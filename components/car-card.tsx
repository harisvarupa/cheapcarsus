import Link from "next/link";
import Image from "next/image";
import { Gauge, MapPin, Sparkles } from "lucide-react";
import { DEFAULT_CAR_IMAGE } from "@/lib/car-images";
import type { Car } from "@/lib/types";
import { currency, number } from "@/lib/utils";

export function CarCard({ car }: { car: Car }) {
  const image = car.images[0] || DEFAULT_CAR_IMAGE;

  return (
    <Link
      href={`/cars/${car.slug}`}
      className="group fade-in relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/12"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
        <Image
          src={image}
          alt={car.title}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 to-transparent" />
        {car.sold ? (
          <div className="absolute left-4 top-4 rounded-full bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg">
            Sold
          </div>
        ) : (
          <div className="absolute left-4 top-4 rounded-full bg-emerald-500 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg">
            Available
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-black text-slate-950 backdrop-blur">
            {currency(car.price)}
          </span>
          <span className="rounded-full bg-slate-950/80 px-3 py-2 text-xs font-bold text-white backdrop-blur">
            {car.year}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-950">{car.title}</h3>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500">
              <MapPin size={15} /> {car.location}
            </p>
          </div>
          <Sparkles className="mt-1 shrink-0 text-orange-500" size={20} />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
          <span className="rounded-2xl bg-slate-50 px-3 py-2 font-bold text-slate-700">
            {car.fuelType}
          </span>
          <span className="rounded-2xl bg-slate-50 px-3 py-2 font-bold text-slate-700">
            {car.transmission}
          </span>
          <span className="rounded-2xl bg-slate-50 px-3 py-2 font-bold text-slate-700">
            {car.drivetrain}
          </span>
          <span className="inline-flex items-center gap-1 rounded-2xl bg-slate-50 px-3 py-2 font-bold text-slate-700">
            <Gauge size={15} /> {number(car.mileage)} mi
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {car.pills.slice(0, 4).map((pill) => (
            <span
              key={pill}
              className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-orange-700"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
