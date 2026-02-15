import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("id, checked_in_at, status")
    .eq("token", token)
    .single();

  if (error || !ticket) {
    return NextResponse.json({ error: "Invalid ticket" }, { status: 404 });
  }

  if (ticket.checked_in_at || ticket.status === "checked_in") {
    return NextResponse.json({ error: "Already checked in" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("tickets")
    .update({
      checked_in_at: new Date().toISOString(),
      status: "checked_in",
    })
    .eq("id", ticket.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to check in" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
