"use client";

import { useState } from "react";

export default function CheckInPage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setResult({ status: res.status, ...data });
    } catch (e: any) {
      setResult({ status: 500, error: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ background: "#0b0b0f", color: "white", minHeight: "100vh", padding: 30 }}>
      <h1 style={{ fontSize: 34, fontWeight: 950, marginBottom: 10 }}>Gate Check-in</h1>
      <p style={{ opacity: 0.8, marginTop: 0 }}>
        Paste the token (or use QR scanner app to open URL with token).
      </p>

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Ticket token..."
          style={{
            width: 420,
            maxWidth: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #2b2b33",
            background: "rgba(255,255,255,0.04)",
            color: "white",
          }}
        />
        <button
          onClick={verify}
          disabled={!token || loading}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: 0,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {loading ? "Checking..." : "Verify & Check-in"}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 18, padding: 16, border: "1px solid #2b2b33", borderRadius: 14 }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}