import { NextRequest, NextResponse } from "next/server";
import { rowToCar } from "@/lib/cars";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminKey = request.headers.get("x-admin-key");

  if (!process.env.ADMIN_ACCESS_KEY || adminKey !== process.env.ADMIN_ACCESS_KEY) {
    return NextResponse.json({ error: "Invalid admin key." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service credentials are not configured." },
      { status: 500 },
    );
  }

  const { id } = await params;
  const body = (await request.json()) as { sold?: boolean };

  if (typeof body.sold !== "boolean") {
    return NextResponse.json({ error: "Only sold status updates are supported." }, { status: 400 });
  }

  const { data, error } = await supabase.from("cars").update({ sold: body.sold }).eq("id", id).select("*").single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to update car." }, { status: 500 });
  }

  return NextResponse.json({ car: rowToCar(data) });
}
