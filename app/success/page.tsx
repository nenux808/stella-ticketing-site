import Link from "next/link";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main style={{ background: "#0b0b0f", color: "white", minHeight: "100vh", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 950 }}>Payment successful ✅</h1>
      <p>Thanks! Your payment was completed.</p>

      <p style={{ opacity: 0.8 }}>
        Ticket email + QR code delivery will be handled by the webhook.
      </p>

      <div style={{ marginTop: 10, opacity: 0.8 }}>
        Session ID: {sp?.session_id || "N/A"}
      </div>

      <Link href="/" style={{ color: "white", marginTop: 20, display: "inline-block", opacity: 0.85 }}>
        Back to Home
      </Link>
    </main>
  );
}
