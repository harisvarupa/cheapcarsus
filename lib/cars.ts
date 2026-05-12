import { seedCars } from "@/lib/seed-cars";
import { resolveCarImages } from "@/lib/car-images";
import { getSupabaseBrowserClient } from "@/lib/supabase/server";
import type { Car } from "@/lib/types";
import { slugify } from "@/lib/utils";

type CarRow = {
  id: string;
  slug: string;
  title: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  price: number;
  mileage: number;
  location: string;
  transmission: string;
  drivetrain: string;
  fuel_type: Car["fuelType"];
  body_type: string;
  exterior_color: string;
  interior_color: string;
  vin: string;
  condition: Car["condition"];
  engine: string;
  mpg: string;
  images: string[];
  pills: string[];
  features: string[];
  description: string;
  sold: boolean;
  created_at: string;
};

export type CarPayload = Omit<Car, "id" | "slug" | "createdAt" | "images"> & {
  slug?: string;
  images?: string[];
  imageData?: string;
  imageName?: string;
  imageMimeType?: string;
};

export function rowToCar(row: CarRow): Car {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim ?? "",
    price: row.price,
    mileage: row.mileage,
    location: row.location,
    transmission: row.transmission,
    drivetrain: row.drivetrain,
    fuelType: row.fuel_type,
    bodyType: row.body_type,
    exteriorColor: row.exterior_color,
    interiorColor: row.interior_color,
    vin: row.vin,
    condition: row.condition,
    engine: row.engine,
    mpg: row.mpg,
    images: resolveCarImages(row.images, `${row.year} ${row.make} ${row.model} ${row.body_type}`),
    pills: row.pills ?? [],
    features: row.features ?? [],
    description: row.description,
    sold: row.sold,
    createdAt: row.created_at,
  };
}

export function payloadToRow(payload: CarPayload, images: string[]) {
  const slug = payload.slug?.trim() || slugify(`${payload.year} ${payload.make} ${payload.model} ${payload.trim}`);

  return {
    slug,
    title: payload.title,
    year: payload.year,
    make: payload.make,
    model: payload.model,
    trim: payload.trim,
    price: payload.price,
    mileage: payload.mileage,
    location: payload.location,
    transmission: payload.transmission,
    drivetrain: payload.drivetrain,
    fuel_type: payload.fuelType,
    body_type: payload.bodyType,
    exterior_color: payload.exteriorColor,
    interior_color: payload.interiorColor,
    vin: payload.vin,
    condition: payload.condition,
    engine: payload.engine,
    mpg: payload.mpg,
    images,
    pills: payload.pills,
    features: payload.features,
    description: payload.description,
    sold: payload.sold,
  };
}

export async function getCars(): Promise<Car[]> {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    return seedCars;
  }

  const { data, error } = await supabase.from("cars").select("*").order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("Falling back to seed cars because Supabase read failed:", error?.message);
    return seedCars;
  }

  return data.map((row) => rowToCar(row as CarRow));
}

export async function getCarBySlug(slug: string): Promise<Car | undefined> {
  const cars = await getCars();
  return cars.find((car) => car.slug === slug);
}
