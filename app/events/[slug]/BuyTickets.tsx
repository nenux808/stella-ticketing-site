"use client";

import { useMemo, useState } from "react";

type TicketType = {
  id: string;
  name: string;
  price_cents: number;
  currency?: string;
  capacity: number;
};

function formatEUR(cents: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export default function BuyTickets({
  eventId,
  ticketTypes,
}: {
  eventId: string;
  ticketTypes: TicketType[];
}) {
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes?.[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selected = useMemo(
    () => ticketTypes.find((t) => t.id === ticketTypeId),
    [ticketTypes, ticketTypeId]
  );

  const total = selected ? selected.price_cents * quantity : 0;

  async function checkout() {
    setErr(null);
    if (!ticketTypeId) return setErr("Select a ticket type.");
    if (!buyerEmail.includes("@")) return setErr("Enter a valid email.");
    if (quantity < 1) return setErr("Quantity must be at least 1.");

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ticketTypeId, quantity, buyerEmail, buyerName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      window.location.href = data.url;
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 18,
        border: "1px solid #23232b",
        borderRadius: 18,
        padding: 18,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 950 }}>Checkout</h2>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Secure payment</div>
      </div>

      <label style={label}>Ticket type</label>
      <select value={ticketTypeId} onChange={(e) => setTicketTypeId(e.target.value)} style={field}>
        {ticketTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} — {formatEUR(t.price_cents)}
          </option>
        ))}
      </select>

      <label style={label}>Quantity</label>
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} style={smallBtn} type="button">
          -
        </button>

        <div style={qtyBox}>{quantity}</div>

        <button onClick={() => setQuantity((q) => Math.min(10, q + 1))} style={smallBtn} type="button">
          +
        </button>
      </div>

      <label style={label}>Name (optional)</label>
      <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Your name" style={field} />

      <label style={label}>Email *</label>
      <input
        value={buyerEmail}
        onChange={(e) => setBuyerEmail(e.target.value)}
        placeholder="you@example.com"
        style={field}
      />

      <div
        style={{
          marginTop: 14,
          borderTop: "1px solid #23232b",
          paddingTop: 12,
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 950,
        }}
      >
        <span>Total</span>
        <span>{formatEUR(total)}</span>
      </div>

      {err && <div style={{ marginTop: 10, color: "#ff6b6b" }}>{err}</div>}

      <button onClick={checkout} disabled={loading} style={payBtn}>
        {loading ? "Redirecting..." : "Pay with Stripe"}
      </button>

      <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12, lineHeight: 1.5 }}>
        After payment, tickets will be delivered via email with a QR code (we’ll add auto-email next).
      </div>
    </div>
  );
}

const label: React.CSSProperties = {
  display: "block",
  marginTop: 12,
  opacity: 0.85,
  fontSize: 13,
};

const field: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  background: "#111118",
  color: "white",
  border: "1px solid #2b2b33",
  marginTop: 6,
};

const smallBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #2b2b33",
  background: "#111118",
  color: "white",
  cursor: "pointer",
  fontWeight: 950,
};

const qtyBox: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #2b2b33",
  borderRadius: 12,
  minWidth: 60,
  textAlign: "center",
  fontWeight: 950,
};

const payBtn: React.CSSProperties = {
  marginTop: 14,
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  fontWeight: 950,
  background: "white",
  color: "black",
};
