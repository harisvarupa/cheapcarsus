import { NextRequest, NextResponse } from "next/server";
import { payloadToRow, rowToCar, type CarPayload } from "@/lib/cars";
import { formatSupabaseError, uploadCarImages, validateCarPayload } from "@/lib/admin-cars";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
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

  const { data, error } = await supabase.from("cars").select("*").order("created_at", { ascending: false });

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to load cars." }, { status: 500 });
  }

  return NextResponse.json({ cars: data.map((row) => rowToCar(row)) });
}

export async function POST(request: NextRequest) {
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

  const payload = (await request.json()) as CarPayload;
  const validationError = validateCarPayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  let uploadedImages: string[] = [];
  try {
    uploadedImages = await uploadCarImages(payload);
  } catch (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error, "upload vehicle images to Supabase Storage") },
      { status: 500 },
    );
  }

  const images = [...uploadedImages, ...(payload.images ?? [])];
  const row = payloadToRow(
    {
      ...payload,
      slug: payload.slug || `${slugify(`${payload.year} ${payload.make} ${payload.model} ${payload.trim}`)}-${Date.now().toString(36)}`,
    },
    images,
  );

  let savedCar;
  try {
    savedCar = await supabase.from("cars").insert(row).select("*").single();
  } catch (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error, "save vehicle to Supabase database") },
      { status: 500 },
    );
  }

  const { data, error } = savedCar;

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to save car." }, { status: 500 });
  }

  return NextResponse.json({ car: rowToCar(data) }, { status: 201 });
}
