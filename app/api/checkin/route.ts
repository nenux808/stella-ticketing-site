import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    // 1) Find ticket by token
    const { data: ticket, error: tErr } = await supabaseAdmin
      .from("tickets")
      .select("id, status, checked_in_at, event_id, ticket_type_id")
      .eq("token", token)
      .single();

    if (tErr || !ticket) {
      return NextResponse.json({ ok: false, reason: "INVALID_TICKET" }, { status: 404 });
    }

    if (ticket.status !== "active") {
      return NextResponse.json({ ok: false, reason: "NOT_ACTIVE" }, { status: 400 });
    }

    if (ticket.checked_in_at) {
      return NextResponse.json({ ok: false, reason: "ALREADY_USED", checked_in_at: ticket.checked_in_at }, { status: 400 });
    }

    // 2) Mark checked in
    const nowIso = new Date().toISOString();
    const { error: uErr } = await supabaseAdmin
      .from("tickets")
      .update({ checked_in_at: nowIso })
      .eq("id", ticket.id);

    if (uErr) {
      return NextResponse.json({ ok: false, reason: "UPDATE_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, checked_in_at: nowIso });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
