"use client";

import { useState } from "react";

export default function CheckInPage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheckIn() {
    if (!token) return;

    setLoading(true);
    setResult(null);

    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setResult(data.error || "Invalid ticket");
    } else {
      setResult("✅ Ticket checked in successfully");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0b0b0f", color: "white", padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>🎫 Gate Check-in</h1>
      <p style={{ opacity: 0.8 }}>Scan or paste the QR code token below</p>

      <div style={{ marginTop: 20, maxWidth: 420 }}>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste ticket token"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #333",
            background: "#111",
            color: "white",
          }}
        />

        <button
          onClick={handleCheckIn}
          disabled={loading}
          style={{
            marginTop: 12,
            width: "100%",
            padding: 12,
            borderRadius: 10,
            background: "white",
            color: "black",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {loading ? "Checking..." : "Check In"}
        </button>

        {result && (
          <div style={{ marginTop: 12, fontWeight: 900 }}>
            {result}
          </div>
        )}
      </div>
    </main>
  );
}
