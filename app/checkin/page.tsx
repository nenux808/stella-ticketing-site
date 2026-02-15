import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
);

export async function POST(req: Request) {
  try {
    // Optional protection: require secret key header
    const key = req.headers.get("x-checkin-key");
    if (process.env.CHECKIN_API_KEY && key !== process.env.CHECKIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Find ticket by token
    const { data: ticket, error: tErr } = await supabase
      .from("tickets")
      .select("id,event_id,status,checked_in_at")
      .eq("token", token)
      .single();

    if (tErr || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.status !== "active") {
      return NextResponse.json({ error: `Ticket is ${ticket.status}` }, { status: 400 });
    }

    if (ticket.checked_in_at) {
      return NextResponse.json(
        { ok: true, message: "Already checked in", checked_in_at: ticket.checked_in_at },
        { status: 200 }
      );
    }

    // Mark checked in (ticket)
    const now = new Date().toISOString();
    const { error: uErr } = await supabase
      .from("tickets")
      .update({ checked_in_at: now })
      .eq("id", ticket.id);

    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 500 });
    }

    // Insert checkins row (optional but recommended)
    const { error: cErr } = await supabase.from("checkins").insert({
      event_id: ticket.event_id,
      ticket_id: ticket.id,
      checked_in_at: now,
    });

    if (cErr) {
      // Not fatal if ticket already updated
      console.warn("checkins insert failed:", cErr.message);
    }

    return NextResponse.json({ ok: true, message: "Checked in ✅", checked_in_at: now });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
