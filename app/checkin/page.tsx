"use client";

import { useState } from "react";

export default function CheckinPage() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<null | "ok" | "used" | "invalid" | "error">(null);
  const [message, setMessage] = useState<string>("");

  async function handleCheckin() {
    setStatus(null);
    setMessage("");

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Server error");
        return;
      }

      setStatus(data.status);
      setMessage(data.message);
    } catch (e) {
      setStatus("error");
      setMessage("Network error");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0b0f",
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 18,
          padding: 22,
          border: "1px solid #23232b",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>
          🎟️ Gate Check-in
        </h1>

        <p style={{ opacity: 0.75, fontSize: 14 }}>
          Scan the QR code and paste the token below.
        </p>

        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste ticket token"
          style={{
            width: "100%",
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #2a2a33",
            background: "#0f0f14",
            color: "white",
            outline: "none",
          }}
        />

        <button
          onClick={handleCheckin}
          style={{
            marginTop: 12,
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "none",
            background: "white",
            color: "black",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Check In
        </button>

        {status && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              background:
                status === "ok"
                  ? "rgba(34,197,94,0.15)"
                  : status === "used"
                  ? "rgba(234,179,8,0.15)"
                  : "rgba(239,68,68,0.15)",
              border:
                status === "ok"
                  ? "1px solid rgba(34,197,94,0.4)"
                  : status === "used"
                  ? "1px solid rgba(234,179,8,0.4)"
                  : "1px solid rgba(239,68,68,0.4)",
              fontWeight: 700,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  );
}
