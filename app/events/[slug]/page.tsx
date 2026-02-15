import BuyTickets from "./BuyTickets";
import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function formatEUR(cents: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // ✅ Next.js 16 fix: params is a Promise
  const { slug } = await params;

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { data: event, error } = await supabase
    .from("events")
    .select(
      "id,title,slug,description,venue,address,start_at,status,ticket_types(id,name,price_cents,currency,capacity)"
    )
    .eq("slug", slug)
    .single();

  if (error || !event) {
    return (
      <main style={{ padding: 40, color: "white", background: "#0b0b0f", minHeight: "100vh" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>Event not found</h1>
        <Link href="/" style={{ color: "white", opacity: 0.8 }}>
          Back to Home
        </Link>
      </main>
    );
  }

  const minPrice =
    event.ticket_types?.length
      ? Math.min(...event.ticket_types.map((t: any) => t.price_cents))
      : null;

  return (
    <main style={{ background: "#0b0b0f", color: "white", minHeight: "100vh" }}>
      {/* Header */}
      <section style={{ borderBottom: "1px solid #1f1f27" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
          <Link href="/" style={{ color: "white", opacity: 0.75, textDecoration: "none" }}>
            ← Back
          </Link>

          <div style={{ marginTop: 12, opacity: 0.8, fontSize: 13, letterSpacing: 1 }}>
            STELLA EVENTS
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 950, margin: "8px 0 6px" }}>{event.title}</h1>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, opacity: 0.85 }}>
            <InfoChip label="When" value={formatDateTime(event.start_at)} />
            <InfoChip label="Where" value={event.venue} />
            {event.address ? <InfoChip label="Address" value={event.address} /> : null}
            {minPrice !== null ? <InfoChip label="From" value={formatEUR(minPrice)} /> : null}
          </div>

          {event.description ? (
            <p style={{ marginTop: 14, maxWidth: 900, lineHeight: 1.7, opacity: 0.9 }}>
              {event.description}
            </p>
          ) : null}
        </div>
      </section>

      {/* Body */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "22px 20px 60px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* Ticket list */}
          <div
            style={{
              border: "1px solid #23232b",
              borderRadius: 18,
              padding: 18,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 950 }}>Tickets</h2>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {(event.ticket_types || []).map((t: any) => (
                <div
                  key={t.id}
                  style={{
                    border: "1px solid #2b2b33",
                    borderRadius: 16,
                    padding: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 16 }}>{t.name}</div>
                    <div style={{ opacity: 0.75, fontSize: 13 }}>Capacity: {t.capacity}</div>
                  </div>
                  <div style={{ fontWeight: 950 }}>{formatEUR(t.price_cents)}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, opacity: 0.7, fontSize: 13 }}>
              After payment, your ticket will be sent to your email with a QR code.
            </div>
          </div>

          {/* Buy box */}
          <BuyTickets eventId={event.id} ticketTypes={event.ticket_types || []} />
        </div>

        <style>{`
          @media (max-width: 900px) {
            section > div > div {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>
    </main>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 999,
        padding: "8px 12px",
        background: "rgba(255,255,255,0.03)",
        maxWidth: "100%",
      }}
    >
      <span style={{ fontSize: 12, opacity: 0.7, marginRight: 8 }}>{label}:</span>
      <span style={{ fontWeight: 900 }}>{value}</span>
    </div>
  );
}