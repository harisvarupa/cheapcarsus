import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { CarPayload } from "@/lib/cars";
import { slugify } from "@/lib/utils";

export async function uploadCarImages(payload: CarPayload) {
  const imageUploads = getImageUploads(payload);

  if (!imageUploads.length) {
    return [];
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const bucket = process.env.SUPABASE_BUCKET || "cars";
  const baseName = slugify(`${payload.year} ${payload.make} ${payload.model}`);

  return Promise.all(
    imageUploads.map(async (imageUpload, index) => {
      const extension = extensionForMime(imageUpload.mimeType);
      const fileName = `${baseName}-${index + 1}-${crypto.randomUUID()}.${extension}`;
      const bytes = Buffer.from(imageUpload.data, "base64");

      const { error } = await supabase.storage.from(bucket).upload(fileName, bytes, {
        contentType: imageUpload.mimeType,
        upsert: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return data.publicUrl;
    }),
  );
}

export function validateCarPayload(payload: CarPayload, { requireImage = true } = {}) {
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

  if (requireImage && !getImageUploads(payload).length && !payload.images?.length) {
    return "Upload at least one vehicle image before saving.";
  }

  return "";
}

export function getImageUploads(payload: CarPayload) {
  const imageUploads = payload.imageUploads
    ?.filter((imageUpload) => imageUpload.data && imageUpload.mimeType)
    .map((imageUpload) => ({
      data: imageUpload.data,
      mimeType: imageUpload.mimeType,
    }));

  if (imageUploads?.length) {
    return imageUploads;
  }

  if (payload.imageData && payload.imageMimeType) {
    return [{ data: payload.imageData, mimeType: payload.imageMimeType }];
  }

  return [];
}

export function storagePathsFromPublicUrls(imageUrls: string[]) {
  const bucket = process.env.SUPABASE_BUCKET || "cars";
  const marker = `/object/public/${bucket}/`;

  return imageUrls
    .map((imageUrl) => {
      try {
        const pathname = new URL(imageUrl).pathname;
        const markerIndex = pathname.indexOf(marker);

        if (markerIndex === -1) {
          return "";
        }

        return decodeURIComponent(pathname.slice(markerIndex + marker.length));
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

export function formatSupabaseError(error: unknown, action: string) {
  const message = error instanceof Error ? error.message : "Unknown Supabase error";

  if (message === "fetch failed") {
    return `Could not ${action}. Check that NEXT_PUBLIC_SUPABASE_URL is the exact Project URL from Supabase Data API settings and that the project host resolves on your network.`;
  }

  return `Could not ${action}: ${message}`;
}

function extensionForMime(mimeType: string) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}
