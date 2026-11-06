// Loaded into the sibling Genkan package by run-host-tests.mjs using go -overlay.
package plugin

import (
	"context"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
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

func TestSubscriptionUsageRuntime(t *testing.T) {
	var head, get, canceled atomic.Int32
	var counter atomic.Int64
	var status atomic.Int32
	counter.Store(100)
	status.Store(200)
	stub := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("User-Agent") != "clash.meta" {
			t.Error("wrong UA")
		}
		if r.Method == "HEAD" {
			head.Add(1)
			w.WriteHeader(int(status.Load()))
			return
		}
		get.Add(1)
		w.Header().Set("Subscription-Userinfo", fmt.Sprintf("upload=%d; download=200; total=10000; expire=2000000000", counter.Load()))
		w.WriteHeader(200)
		w.(http.Flusher).Flush()
		<-r.Context().Done() // the plugin should cancel the unread body
		canceled.Add(1)
	}))
	defer stub.Close()
	roots := x509.NewCertPool()
	roots.AddCert(stub.Certificate())
	old := http.DefaultTransport
	transport := old.(*http.Transport).Clone()
	transport.TLSClientConfig = &tls.Config{RootCAs: roots, MinVersion: tls.VersionTLS12}
	http.DefaultTransport = transport
	defer func() { http.DefaultTransport = old; transport.CloseIdleConnections() }()
	raw, err := os.ReadFile(os.Getenv("SUBSCRIPTION_PLUGIN_SOURCE"))
	if err != nil {
		t.Fatal(err)
	}
	source := strings.ReplaceAll(string(raw), "ctx.now", `Number(genkan.storage.get("fixtureTime"))`)
	e := newEnv(t)
	disabled := false
	if _, err = e.m.Install(context.Background(), InstallRequest{Source: source, Enable: &disabled}); err != nil {
		t.Fatal(err)
	}
	url := stub.URL + "/fixture?key=synthetic-private-value"
	w := addWidget(t, e, "subscription-usage", "usage", map[string]any{"origin": stub.URL, "url": url, "zone": "UTC"})
	other := addWidget(t, e, "subscription-usage", "usage", map[string]any{"origin": stub.URL, "url": url, "zone": "UTC"})
	ent, _, _ := e.m.entryFor("subscription-usage")
	clock := time.Date(2026, 10, 1, 1, 0, 0, 0, time.UTC).UnixMilli()
	setClock := func(n int64) {
		t.Helper()
		if err := ent.kv.set("fixtureTime", json.RawMessage(strconv.FormatInt(n, 10))); err != nil {
			t.Fatal(err)
		}
	}
	run := func() {
		t.Helper()
		res, err := e.m.Test(context.Background(), "subscription-usage", TestRequest{Hook: "schedule"})
		if err != nil || !res.OK {
			t.Fatalf("schedule: %+v %v", res, err)
		}
		m := res.Result.(map[string]any)
		if fmt.Sprint(m["failed"]) != "0" {
			t.Fatalf("sample failed: %+v", res)
		}
	}
	setClock(clock)
	run()
	counter.Store(300)
	setClock(clock + 3600000)
	run()
	if head.Load() != 4 || get.Load() != 4 {
		t.Fatalf("requests %d/%d", head.Load(), get.Load())
	}
	deadline := time.Now().Add(time.Second)
	for canceled.Load() != 4 && time.Now().Before(deadline) {
		time.Sleep(time.Millisecond)
	}
	if canceled.Load() != 4 {
		t.Fatalf("body cancellation: %d", canceled.Load())
	}
	for _, lang := range []string{"en", "zh"} {
		res, err := e.m.Test(context.Background(), "subscription-usage", TestRequest{Hook: "widget", Instance: w.ID, Lang: lang})
		if err != nil || !res.OK {
			t.Fatalf("widget: %+v %v", res, err)
		}
		v := res.Result.(WidgetView)
		if v.Error != "" {
			t.Fatal(v.Error)
		}
		kinds := map[string]bool{}
		for _, b := range v.Body {
			if b["type"] == "chart" {
				kinds[b["kind"].(string)] = true
			}
		}
		if !kinds["line"] || !kinds["bar"] {
			t.Fatalf("charts lost: %+v", v.Body)
		}
		b, _ := json.Marshal(res)
		if strings.Contains(string(b), "synthetic-private-value") {
			t.Fatal("secret leaked")
		}
	}
	snapshot, err := e.m.Storage("subscription-usage")
	if err != nil {
		t.Fatal(err)
	}
	if len(snapshot.Entries) != 3 {
		t.Fatalf("instance isolation: %d", len(snapshot.Entries))
	}
	hash := sha256.Sum256([]byte(url + "\nUTC"))
	b, ok := ent.kv.get("usage:" + w.ID)
	if !ok {
		t.Fatal("missing series")
	}
	if !strings.Contains(string(b), hex.EncodeToString(hash[:])) || strings.Contains(string(b), "synthetic-private-value") {
		t.Fatal("source identity mismatch or leak")
	}
	if err := ent.kv.flush(); err != nil {
		t.Fatal(err)
	}
	reopened := newKV(e.dir, "subscription-usage", func() bool { return true })
	defer reopened.close()
	if saved, ok := reopened.get("usage:" + other.ID); !ok || len(saved) == 0 {
		t.Fatal("history not persisted")
	}
	status.Store(429)
	setClock(clock + 7200000)
	res, err := e.m.Test(context.Background(), "subscription-usage", TestRequest{Hook: "schedule"})
	if err != nil || !res.OK {
		t.Fatalf("failure handling: %+v %v", res, err)
	}
	res, err = e.m.Test(context.Background(), "subscription-usage", TestRequest{Hook: "widget", Instance: w.ID})
	if err != nil || !res.OK {
		t.Fatal(err)
	}
	v := res.Result.(WidgetView)
	if v.Error != "" || !strings.Contains(fmt.Sprint(v.Body), "Saved data") {
		t.Fatalf("stale view: %+v", v)
	}
}

func TestSubscriptionUsageRuntimeLarge(t *testing.T) {
	var requests atomic.Int32
	stub := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests.Add(1)
		id, _ := strconv.Atoi(r.URL.Query().Get("id"))
		w.Header().Set("Subscription-Userinfo", fmt.Sprintf("upload=%d; download=200", id))
	}))
	defer stub.Close()
	roots := x509.NewCertPool()
	roots.AddCert(stub.Certificate())
	old := http.DefaultTransport
	transport := old.(*http.Transport).Clone()
	transport.TLSClientConfig = &tls.Config{RootCAs: roots, MinVersion: tls.VersionTLS12}
	http.DefaultTransport = transport
	defer func() { http.DefaultTransport = old; transport.CloseIdleConnections() }()
	raw, err := os.ReadFile(os.Getenv("SUBSCRIPTION_PLUGIN_SOURCE"))
	if err != nil {
		t.Fatal(err)
	}
	source := strings.ReplaceAll(string(raw), "ctx.now", "1790816400000")
	e := newEnv(t)
	disabled := false
	if _, err = e.m.Install(context.Background(), InstallRequest{Source: source, Enable: &disabled}); err != nil {
		t.Fatal(err)
	}
	var last WidgetOut
	for i := 0; i < 200; i++ {
		last = addWidget(t, e, "subscription-usage", "usage", map[string]any{"origin": stub.URL, "url": fmt.Sprintf("%s/sub?id=%d", stub.URL, i), "zone": "UTC"})
	}
	started := time.Now()
	for i := 0; i < 2; i++ {
		res, err := e.m.Test(context.Background(), "subscription-usage", TestRequest{Hook: "schedule"})
		if err != nil || !res.OK {
			t.Fatalf("schedule: %+v %v", res, err)
		}
		result := res.Result.(map[string]any)
		if fmt.Sprint(result["failed"]) != "0" || fmt.Sprint(result["pending"]) != "0" {
			t.Fatalf("incomplete batch: %+v", result)
		}
	}
	if requests.Load() != 200 {
		t.Fatalf("repeated/missing samples: %d", requests.Load())
	}
	snapshot, err := e.m.Storage("subscription-usage")
	if err != nil || snapshot.Size > 224*1024 || len(snapshot.Entries) != 200 {
		t.Fatalf("budget: %d/%d %v", snapshot.Size, len(snapshot.Entries), err)
	}
	ent, _, _ := e.m.entryFor("subscription-usage")
	b, ok := ent.kv.get("usage:" + last.ID)
	if !ok || !strings.Contains(string(b), `"u":199`) {
		t.Fatal("last widget missing/incorrect")
	}
	t.Logf("200 instances, two scheduler passes: %s, stored %d bytes", time.Since(started), snapshot.Size)
}
