import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ ok: false, message: "Missing token" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("checkin_by_token", {
      p_token: token.trim(),
    });

    if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });

    // rpc returns an array (table result)
    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json(row);
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message || "Server error" }, { status: 500 });
  }
}