import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is missing");
  return new Stripe(key, { apiVersion: "2023-10-16" });
}

export async function POST(req: Request) {
  try {
    const stripe = getStripe();

    const body = await req.json();
    const { eventId, ticketTypeId, quantity, buyerEmail, buyerName } = body;

    if (!eventId || !ticketTypeId || !quantity || !buyerEmail) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const qty = Math.max(1, Math.min(10, Number(quantity)));

    // Supabase server client (cookie-based)
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

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("id,title,slug")
      .eq("id", eventId)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: ticketType, error: ttErr } = await supabase
      .from("ticket_types")
      .select("id,name,price_cents,currency")
      .eq("id", ticketTypeId)
      .single();

    if (ttErr || !ticketType) {
      return NextResponse.json({ error: "Ticket type not found" }, { status: 404 });
    }

    // In production, set NEXT_PUBLIC_APP_URL to your Vercel domain
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: buyerEmail,
      metadata: {
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        quantity: String(qty),
        buyer_name: buyerName || "",
        buyer_email: buyerEmail,
      },
      line_items: [
        {
          quantity: qty,
          price_data: {
            currency: (ticketType.currency || "EUR").toLowerCase(),
            unit_amount: ticketType.price_cents,
            product_data: {
              name: `${event.title} — ${ticketType.name}`,
            },
          },
        },
      ],
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/events/${event.slug}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}