import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

// Stripe (no apiVersion → avoids Vercel TypeScript failure)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Resend
const resend = new Resend(process.env.RESEND_API_KEY!);

// Supabase (SERVICE ROLE — server only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function formatEUR(cents: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );
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

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });

  const rawBody = await req.text();

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature error:", err?.message);
    return new Response(`Webhook Error: ${err?.message}`, { status: 400 });
  }

  try {
    // Only handle final checkout completion
    if (stripeEvent.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = stripeEvent.data.object as Stripe.Checkout.Session;

    const eventId = session.metadata?.event_id;
    const ticketTypeId = session.metadata?.ticket_type_id;
    const qty = Math.max(1, Math.min(10, Number(session.metadata?.quantity || 1)));
    const buyerEmail = session.metadata?.buyer_email || session.customer_email;
    const buyerName = session.metadata?.buyer_name || "";

    if (!eventId || !ticketTypeId || !buyerEmail) {
      console.error("❌ Missing metadata:", session.metadata);
      return NextResponse.json({ error: "Missing required metadata" }, { status: 400 });
    }

    console.log("✅ checkout.session.completed", {
      sessionId: session.id,
      buyerEmail,
      qty,
      eventId,
      ticketTypeId,
    });

    // ---- Idempotency: if already processed, stop ----
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (existingOrder?.id) {
      console.log("ℹ️ Webhook already processed for session:", session.id);
      return NextResponse.json({ received: true });
    }

    // ---- Load event + ticket type ----
    const { data: dbEvent, error: eventErr } = await supabase
      .from("events")
      .select("id,title,venue,address,start_at")
      .eq("id", eventId)
      .single();

    if (eventErr || !dbEvent) throw new Error("Event not found in DB");

    const { data: ticketType, error: ttErr } = await supabase
      .from("ticket_types")
      .select("id,name,price_cents,currency")
      .eq("id", ticketTypeId)
      .single();

    if (ttErr || !ticketType) throw new Error("Ticket type not found in DB");

    const currency = ticketType.currency ?? "EUR";
    const price = ticketType.price_cents ?? 0;
    const total = price * qty;

    // ---- Create ORDER row ----
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent?.toString() || null,
        event_id: eventId,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        currency,
        subtotal_cents: total,
        total_cents: total,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("❌ Order insert failed:", orderErr);
      throw new Error("Order insert failed");
    }

    // ---- Create tickets + QR ----
    const qrAttachments: { filename: string; content: string; cid: string }[] = [];
    const ticketBlocks: string[] = [];

    for (let i = 0; i < qty; i++) {
      const token = randomUUID();

      // QR PNG buffer
      const pngBuffer = await QRCode.toBuffer(token, { width: 320, margin: 1 });

      // Insert ticket (includes order_id)
      const { error: ticketErr, data: created } = await supabase
        .from("tickets")
        .insert({
          order_id: order.id,
          event_id: eventId,
          ticket_type_id: ticketTypeId,
          token,
          status: "active",
        })
        .select("id")
        .single();

      if (ticketErr) {
        console.error("❌ Ticket insert failed:", ticketErr);
        throw new Error(ticketErr.message);
      }

      const base64 = Buffer.from(pngBuffer).toString("base64");

      // Make CID stable + unique
      const cid = `ticket-${i + 1}@stella-events`;

      qrAttachments.push({
        filename: `ticket-${i + 1}.png`,
        content: base64,
        cid,
      });

      ticketBlocks.push(`
        <div style="border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:14px 0;background:#fff;">
          <div style="font-weight:800;margin-bottom:6px;">
            Ticket ${i + 1} — ${ticketType.name} (${formatEUR(price)})
          </div>

          <div style="width:220px;height:220px;border:1px solid #e5e7eb;border-radius:12px;
                      display:flex;align-items:center;justify-content:center;background:#fff;">
            <img alt="QR Code" src="cid:${cid}" style="width:200px;height:200px;display:block;" />
          </div>

          <div style="margin-top:8px;font-size:12px;color:#6b7280;">
            Ref: ${created?.id || token}
          </div>
        </div>
      `);
    }

    console.log("✅ Tickets created:", qty);

    const movieTitle = dbEvent.title || "Movie Show";

    const html = `
      <div style="font-family:system-ui,Arial,sans-serif; background:#0b0b0f; padding:24px;">
        <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;">
          <div style="padding:22px 22px 14px;border-bottom:1px solid #eef2f7;">
            <div style="font-size:12px;letter-spacing:1px;color:#6b7280;font-weight:700;">STELLA EVENTS</div>
            <div style="font-size:26px;font-weight:900;margin-top:6px;color:#111827;">
              Your Tickets — ${movieTitle}
            </div>

            <div style="margin-top:10px;color:#111827;">
              <div style="font-weight:800;">${movieTitle}</div>
              <div style="color:#6b7280;margin-top:6px;">
                📍 ${dbEvent.venue}${dbEvent.address ? ` • ${dbEvent.address}` : ""}<br/>
                🗓️ ${formatDateTime(dbEvent.start_at)}
              </div>
            </div>

            <div style="margin-top:12px;color:#111827;">
              Hi ${buyerName || "there"},<br/>
              Payment confirmed ✅ Here are your QR ticket(s). Show them at the entrance.
            </div>
          </div>

          <div style="padding:18px 22px;background:#f9fafb;">
            ${ticketBlocks.join("")}
            <div style="margin-top:10px;color:#6b7280;font-size:13px;">
              If the QR doesn’t display, use the attached PNG(s).
            </div>
          </div>

          <div style="padding:18px 22px;">
            <div style="color:#111827;">Enjoy the show 🍿</div>
            <div style="margin-top:10px;color:#6b7280;">— Stella Events</div>
            <div style="margin-top:14px;color:#9ca3af;font-size:12px;">
              Powered by NENUX WEB SOLUTIONS
            </div>
          </div>
        </div>
      </div>
    `;

    const sendRes = await resend.emails.send({
      from: process.env.TICKETS_FROM_EMAIL!,
      to: buyerEmail,
      subject: `🎟️ Your Tickets — ${movieTitle} (Stella Events)`,
      html,
      attachments: qrAttachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        content_type: "image/png",
        cid: a.cid,
      })),
    });

    console.log("✅ Email sent:", sendRes?.data?.id || sendRes);

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err?.message || "Webhook error" }, { status: 500 });
  }
}
