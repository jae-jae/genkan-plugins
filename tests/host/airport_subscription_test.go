// Loaded into the sibling Genkan package by run-host-tests.mjs using go -overlay.
package plugin

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"
	"time"
)

func TestAirportSubscriptionRuntime(t *testing.T) {
	var headCalls, getCalls, canceled atomic.Int32
	var counter atomic.Int64
	var status atomic.Int32
	counter.Store(1073741824) // 1 GB
	status.Store(200)

	profileTitle := "base64:" + base64.StdEncoding.EncodeToString([]byte("次元云机场"))

	stub := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.Header.Get("User-Agent"), "clash.meta") {
			t.Errorf("unexpected User-Agent: %s", r.Header.Get("User-Agent"))
		}
		if r.Method == "HEAD" {
			headCalls.Add(1)
			// Simulate panels that omit Subscription-Userinfo on HEAD (or return 405) unless status is an upstream error
			st := int(status.Load())
			if st == 200 {
				w.WriteHeader(405)
				return
			}
			w.WriteHeader(st)
			return
		}
		getCalls.Add(1)
		st := int(status.Load())
		if st != 200 {
			w.WriteHeader(st)
			return
		}
		w.Header().Set("Profile-Title", profileTitle)
		w.Header().Set("Subscription-Userinfo", fmt.Sprintf("upload=%d; download=5368709120; total=107374182400; expire=2000000000", counter.Load()))
		w.WriteHeader(200)
		w.(http.Flusher).Flush()
		<-r.Context().Done() // plugin must cancel the unread node-list body stream
		canceled.Add(1)
	}))
	defer stub.Close()

	raw, err := os.ReadFile(os.Getenv("AIRPORT_SUB_PLUGIN_SOURCE"))
	if err != nil {
		t.Fatal(err)
	}
	source := strings.ReplaceAll(string(raw), "ctx.now", `Number(genkan.storage.get("fixtureTime"))`)
	e := newEnv(t)
	disabled := false
	if _, err = e.m.Install(context.Background(), InstallRequest{Source: source, Enable: &disabled}); err != nil {
		t.Fatal(err)
	}

	secretURL := stub.URL + "/sub?token=synthetic-private-token-xyz"
	w := addWidget(t, e, "airport-subscription", "sub", map[string]any{"url": secretURL, "zone": "Asia/Shanghai", "resetDay": 15})
	other := addWidget(t, e, "airport-subscription", "sub", map[string]any{"url": secretURL, "zone": "Asia/Shanghai"})

	ent, _, _ := e.m.entryFor("airport-subscription")
	clock := time.Date(2026, 11, 7, 6, 0, 0, 0, time.UTC).UnixMilli()
	setClock := func(ms int64) {
		t.Helper()
		if err := ent.kv.set("fixtureTime", json.RawMessage(strconv.FormatInt(ms, 10))); err != nil {
			t.Fatal(err)
		}
	}

	// 1. Immediate live fetch on first widget render (no waiting for schedule!)
	setClock(clock)
	res, err := e.m.Test(context.Background(), "airport-subscription", TestRequest{Hook: "widget", Instance: w.ID, Lang: "zh"})
	if err != nil || !res.OK {
		t.Fatalf("initial widget render failed: %+v %v", res, err)
	}
	v := res.Result.(WidgetView)
	if v.Error != "" {
		t.Fatalf("unexpected widget error: %s", v.Error)
	}
	if v.Title != "次元云机场" {
		t.Fatalf("expected auto-detected profile-title, got %q", v.Title)
	}

	deadline := time.Now().Add(time.Second)
	for canceled.Load() < 1 && time.Now().Before(deadline) {
		time.Sleep(time.Millisecond)
	}
	if canceled.Load() < 1 {
		t.Fatalf("expected unread GET body to be canceled, got %d", canceled.Load())
	}

	// 2. Interactive view switch ("trend" -> line chart) and manual "sync" action
	if _, err = e.m.Patch("airport-subscription", PatchRequest{Enabled: boolPtr(true)}); err != nil {
		t.Fatal(err)
	}
	actRes, err := e.m.Test(context.Background(), "airport-subscription", TestRequest{
		Hook: "action", Instance: w.ID, Action: "view", Params: map[string]any{"view": "trend"}, Lang: "zh",
	})
	if err != nil || !actRes.OK {
		t.Fatalf("view action failed: %+v %v", actRes, err)
	}
	ar := actRes.Result.(ActionResult)
	hasLine := false
	for _, blk := range ar.View.View.Body {
		if blk["type"] == "chart" && blk["kind"] == "line" {
			hasLine = true
		}
	}
	if !hasLine {
		t.Fatalf("expected line chart after switching to trend view: %+v", ar.View.View.Body)
	}

	counter.Store(3221225472) // +2 GB upload
	setClock(clock + 60000)
	syncRes, err := e.m.Test(context.Background(), "airport-subscription", TestRequest{
		Hook: "action", Instance: w.ID, Action: "sync", Lang: "en",
	})
	if err != nil || !syncRes.OK {
		t.Fatalf("sync action failed: %+v %v", syncRes, err)
	}
	if syncRes.Result.(ActionResult).Toast == "" {
		t.Fatal("expected toast confirmation on sync")
	}

	// 3. Background schedule samples all due instances & persists cleanly without leaking secrets
	setClock(clock + 3600000)
	schRes, err := e.m.Test(context.Background(), "airport-subscription", TestRequest{Hook: "schedule"})
	if err != nil || !schRes.OK {
		t.Fatalf("schedule failed: %+v %v", schRes, err)
	}
	if fmt.Sprint(schRes.Result.(map[string]any)["failed"]) != "0" {
		t.Fatalf("schedule reported failures: %+v", schRes)
	}

	for _, lang := range []string{"en", "zh"} {
		r, err := e.m.Test(context.Background(), "airport-subscription", TestRequest{Hook: "widget", Instance: other.ID, Lang: lang})
		if err != nil || !r.OK || r.Result.(WidgetView).Error != "" {
			t.Fatalf("widget %s: %+v %v", lang, r, err)
		}
		b, _ := json.Marshal(r)
		if strings.Contains(string(b), "synthetic-private-token-xyz") {
			t.Fatal("secret leaked in test response")
		}
	}

	hash := sha256.Sum256([]byte(secretURL + "\nAsia/Shanghai"))
	stored, ok := ent.kv.get("sub:" + w.ID)
	if !ok || !strings.Contains(string(stored), hex.EncodeToString(hash[:])) || strings.Contains(string(stored), "synthetic-private-token-xyz") {
		t.Fatal("source identity mismatch or secret leaked in storage")
	}
	if err := ent.kv.flush(); err != nil {
		t.Fatal(err)
	}
	reopened := newKV(e.dir, "airport-subscription", func() bool { return true })
	defer reopened.close()
	if saved, ok := reopened.get("sub:" + other.ID); !ok || len(saved) == 0 {
		t.Fatal("history not persisted across kv reopen")
	}

	// 4. Upstream rate-limit preserves cached view with yellow stale warning
	status.Store(429)
	setClock(clock + 7200000)
	if _, err = e.m.Test(context.Background(), "airport-subscription", TestRequest{Hook: "schedule"}); err != nil {
		t.Fatal(err)
	}
	staleRes, err := e.m.Test(context.Background(), "airport-subscription", TestRequest{Hook: "widget", Instance: w.ID, Lang: "en"})
	if err != nil || !staleRes.OK {
		t.Fatal(err)
	}
	sv := staleRes.Result.(WidgetView)
	if sv.Error != "" || sv.Tone != "yellow" || !strings.Contains(fmt.Sprint(sv.Body), "Showing saved data") {
		t.Fatalf("expected yellow stale view, got: %+v", sv)
	}
}

func TestAirportSubscriptionRuntimeLarge(t *testing.T) {
	var requests atomic.Int32
	stub := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		id, _ := strconv.Atoi(r.URL.Query().Get("id"))
		w.Header().Set("Subscription-Userinfo", fmt.Sprintf("upload=%d; download=2048; total=107374182400", id))
	}))
	defer stub.Close()

	raw, err := os.ReadFile(os.Getenv("AIRPORT_SUB_PLUGIN_SOURCE"))
	if err != nil {
		t.Fatal(err)
	}
	source := strings.ReplaceAll(string(raw), "ctx.now", "1794031200000")
	e := newEnv(t)
	disabled := false
	if _, err = e.m.Install(context.Background(), InstallRequest{Source: source, Enable: &disabled}); err != nil {
		t.Fatal(err)
	}

	var last WidgetOut
	for i := 0; i < 200; i++ {
		last = addWidget(t, e, "airport-subscription", "sub", map[string]any{
			"url":  fmt.Sprintf("%s/sub?id=%d", stub.URL, i),
			"zone": "UTC",
		})
	}

	for i := 0; i < 2; i++ {
		res, err := e.m.Test(context.Background(), "airport-subscription", TestRequest{Hook: "schedule"})
		if err != nil || !res.OK {
			t.Fatalf("schedule: %+v %v", res, err)
		}
		m := res.Result.(map[string]any)
		if fmt.Sprint(m["failed"]) != "0" || fmt.Sprint(m["pending"]) != "0" {
			t.Fatalf("incomplete batch: %+v", m)
		}
	}

	if requests.Load() != 200 {
		t.Fatalf("expected 200 requests across two passes within interval, got %d", requests.Load())
	}
	snapshot, err := e.m.Storage("airport-subscription")
	if err != nil || snapshot.Size > 224*1024 || len(snapshot.Entries) != 200 {
		t.Fatalf("budget or entry count mismatch: size=%d entries=%d err=%v", snapshot.Size, len(snapshot.Entries), err)
	}
	ent, _, _ := e.m.entryFor("airport-subscription")
	b, ok := ent.kv.get("sub:" + last.ID)
	if !ok || !strings.Contains(string(b), `"u":199`) {
		t.Fatal("last widget missing or incorrect")
	}
}

func boolPtr(b bool) *bool { return &b }
