"use client";

import { useState } from "react";

export default function GatePage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<{ ok?: boolean; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function scan() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setResult({ ok: false, message: e.message });
    } finally {
      setLoading(false);
      setToken("");
    }
  }

  return (
    <main style={{ background: "#0b0b0f", color: "white", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 950 }}>Stella Events — Gate Scanner</h1>
        <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
          Paste/enter the QR token (later we’ll add camera scanning).
        </p>

        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="QR token"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #2b2b33",
            background: "#111118",
            color: "white",
          }}
        />

        <button
          onClick={scan}
          disabled={loading || !token.trim()}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "12px 14px",
            borderRadius: 14,
            border: "none",
            cursor: "pointer",
            fontWeight: 900,
            background: "white",
            color: "black",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Checking..." : "Scan / Verify"}
        </button>

        {result && (
          <div
            style={{
              marginTop: 14,
              borderRadius: 14,
              padding: 12,
              border: "1px solid #2b2b33",
              background: result.ok ? "rgba(0,255,120,0.08)" : "rgba(255,80,80,0.08)",
            }}
          >
            <div style={{ fontWeight: 950 }}>{result.ok ? "✅ OK" : "❌ NOT OK"}</div>
            <div style={{ opacity: 0.9, marginTop: 6 }}>{result.message}</div>
          </div>
        )}
      </div>
    </main>
  );
}