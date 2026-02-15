"use client";

import { useState } from "react";

export default function CheckInPage() {
  const [token, setToken] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onCheckIn() {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // If you set CHECKIN_API_KEY in env, put it here manually for staff device
          // "x-checkin-key": "YOUR_CHECKIN_KEY",
        },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setMsg(data.message || "Checked in ✅");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0b0b0f", color: "white", padding: 24 }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 style={{ fontSize: 34, fontWeight: 950, marginBottom: 8 }}>Gate Check-in</h1>
        <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
          Paste the <b>Ref / Token</b> (or scan QR and paste token), then check in.
        </p>

        <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste ticket token (Ref...)"
            style={{
              padding: 14,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              outline: "none",
            }}
          />

          <button
            onClick={onCheckIn}
            disabled={loading || !token.trim()}
            style={{
              padding: 14,
              borderRadius: 12,
              border: "none",
              fontWeight: 950,
              cursor: "pointer",
              background: "white",
              color: "black",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Checking..." : "Check In"}
          </button>

          {msg && (
            <div
              style={{
                marginTop: 6,
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.03)",
                opacity: 0.95,
              }}
            >
              {msg}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
