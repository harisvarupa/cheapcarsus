import { NextRequest, NextResponse } from "next/server";
import { payloadToRow, rowToCar, type CarPayload } from "@/lib/cars";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

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
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  let uploadedImage = "";
  try {
    uploadedImage = await uploadImage(payload);
  } catch (error) {
    return NextResponse.json(
      { error: formatSupabaseError(error, "upload vehicle image to Supabase Storage") },
      { status: 500 },
    );
  }
  const images = uploadedImage ? [uploadedImage, ...(payload.images ?? [])] : (payload.images ?? []);
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

async function uploadImage(payload: CarPayload) {
  if (!payload.imageData || !payload.imageMimeType) {
    return "";
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return "";
  }

  const bucket = process.env.SUPABASE_BUCKET || "cars";
  const extension = extensionForMime(payload.imageMimeType);
  const fileName = `${slugify(`${payload.year} ${payload.make} ${payload.model}`)}-${crypto.randomUUID()}.${extension}`;
  const bytes = Buffer.from(payload.imageData, "base64");

  const { error } = await supabase.storage.from(bucket).upload(fileName, bytes, {
    contentType: payload.imageMimeType,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

function extensionForMime(mimeType: string) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

function validatePayload(payload: CarPayload) {
  const required: (keyof CarPayload)[] = [
    "title",
    "year",
    "make",
    "model",
    "price",
    "mileage",
    "location",
    "fuelType",
    "bodyType",
    "condition",
    "engine",
    "description",
  ];

  for (const field of required) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      return `${field} is required.`;
    }
  }

  if (!Number.isFinite(payload.year) || payload.year < 1900) {
    return "Enter a valid year.";
  }

  if (!Number.isFinite(payload.price) || payload.price < 0) {
    return "Enter a valid price.";
  }

  if (!Number.isFinite(payload.mileage) || payload.mileage < 0) {
    return "Enter a valid mileage.";
  }

  if (!payload.imageData && !payload.images?.length) {
    return "Upload a vehicle image before saving.";
  }

  return "";
}

function formatSupabaseError(error: unknown, action: string) {
  const message = error instanceof Error ? error.message : "Unknown Supabase error";

  if (message === "fetch failed") {
    return `Could not ${action}. Check that NEXT_PUBLIC_SUPABASE_URL is the exact Project URL from Supabase Data API settings and that the project host resolves on your network.`;
  }

  return `Could not ${action}: ${message}`;
}
