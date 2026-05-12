import { NextRequest, NextResponse } from "next/server";
import { payloadToRow, rowToCar, type CarPayload } from "@/lib/cars";
import {
  formatSupabaseError,
  storagePathsFromPublicUrls,
  uploadCarImages,
  validateCarPayload,
} from "@/lib/admin-cars";
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
  const body = (await request.json()) as Partial<CarPayload>;

  if (isSoldOnlyUpdate(body)) {
    const { data, error } = await supabase.from("cars").update({ sold: body.sold }).eq("id", id).select("*").single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Unable to update car." }, { status: 500 });
    }

    return NextResponse.json({ car: rowToCar(data) });
  }

  const existingCar = await supabase.from("cars").select("*").eq("id", id).single();
  if (existingCar.error || !existingCar.data) {
    return NextResponse.json(
      { error: existingCar.error?.message || "Unable to find car." },
      { status: 404 },
    );
  }

  const payload = {
    ...body,
    slug: body.slug || existingCar.data.slug,
  } as CarPayload;
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

  const retainedImages = payload.images ?? [];
  const row = payloadToRow(payload, [...retainedImages, ...uploadedImages]);
  const { data, error } = await supabase.from("cars").update(row).eq("id", id).select("*").single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Unable to update car." }, { status: 500 });
  }

  const removedImageUrls = ((existingCar.data.images as string[]) ?? []).filter(
    (image) => !retainedImages.includes(image),
  );
  const removedImagePaths = storagePathsFromPublicUrls(removedImageUrls);
  if (removedImagePaths.length) {
    await supabase.storage.from(process.env.SUPABASE_BUCKET || "cars").remove(removedImagePaths);
  }

  return NextResponse.json({ car: rowToCar(data) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const existingCar = await supabase.from("cars").select("images").eq("id", id).single();
  if (existingCar.error || !existingCar.data) {
    return NextResponse.json(
      { error: existingCar.error?.message || "Unable to find car." },
      { status: 404 },
    );
  }

  const { error } = await supabase.from("cars").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message || "Unable to delete car." }, { status: 500 });
  }

  const imagePaths = storagePathsFromPublicUrls((existingCar.data.images as string[]) ?? []);
  if (imagePaths.length) {
    await supabase.storage.from(process.env.SUPABASE_BUCKET || "cars").remove(imagePaths);
  }

  return NextResponse.json({ ok: true });
}

function isSoldOnlyUpdate(body: Partial<CarPayload>) {
  return Object.keys(body).length === 1 && typeof body.sold === "boolean";
}
