import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    .select("id, status")
    .eq("token", token)
    .single();

  if (error || !ticket) {
    return NextResponse.json(
      { status: "invalid", message: "Invalid ticket" },
      { status: 404 }
    );
  }

  if (ticket.status === "used") {
    return NextResponse.json({
      status: "used",
      message: "⚠️ Ticket already used",
    });
  }

  await supabase
    .from("tickets")
    .update({ status: "used" })
    .eq("id", ticket.id);

  return NextResponse.json({
    status: "ok",
    message: "✅ Check-in successful",
  });
}
