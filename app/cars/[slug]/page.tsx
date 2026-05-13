import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Calendar, Fuel, Gauge, MapPin, Settings, Wrench } from "lucide-react";
import { CarCard } from "@/components/car-card";
import { CarImageGallery } from "@/components/car-image-gallery";
import { DEFAULT_CAR_IMAGE } from "@/lib/car-images";
import { getCarBySlug, getCars } from "@/lib/cars";
import { currency, number } from "@/lib/utils";

export const revalidate = 30;

export async function generateStaticParams() {
  const cars = await getCars();
  return cars.map((car) => ({ slug: car.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);

  return {
    title: car ? `${car.title} | cheapcarsus` : "Car not found | cheapcarsus",
    description: car?.description,
  };
}

export default async function CarDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [car, cars] = await Promise.all([getCarBySlug(slug), getCars()]);

  if (!car) {
    notFound();
  }

  const related = cars
    .filter((item) => item.id !== car.id && (item.make === car.make || item.bodyType === car.bodyType))
    .slice(0, 3);
  const galleryImages = car.images.length ? car.images : [DEFAULT_CAR_IMAGE];

  return (
    <div className="mx-auto max-w-7xl px-0 py-0 sm:px-6 sm:py-10 lg:px-8">
      <Link href="/cars" className="mx-4 my-4 inline-flex items-center gap-2 font-black text-slate-600 hover:text-orange-700 sm:mx-0 sm:mb-6 sm:mt-0">
        <ArrowLeft size={18} /> Back to inventory
      </Link>

      <section className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8">
        <CarImageGallery images={galleryImages} title={car.title} sold={car.sold} />

        <div className="glass-panel h-fit rounded-none p-5 sm:rounded-[2.5rem] sm:p-8">
          <div className="lg:hidden">
            <h1 className="text-3xl font-black tracking-tight text-slate-950">{car.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-3xl font-black text-orange-600">{currency(car.price)}</p>
              <span className={`rounded-full px-3 py-1.5 text-xs font-black ${car.sold ? "bg-red-600 text-white" : "bg-emerald-500 text-white"}`}>
                {car.sold ? "Sold" : "Available"}
              </span>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
              <MapPin size={16} /> {car.location}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {car.pills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-orange-700"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden flex-wrap gap-2 lg:flex">
            {car.pills.map((pill) => (
              <span
                key={pill}
                className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-orange-700"
              >
                {pill}
              </span>
            ))}
          </div>
          <h1 className="mt-5 hidden text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:block">{car.title}</h1>
          <p className="mt-3 hidden items-center gap-2 text-slate-600 lg:inline-flex">
            <MapPin size={18} /> {car.location}
          </p>
          <div className="mt-6 hidden items-end justify-between gap-5 rounded-[2rem] bg-slate-950 p-6 text-white lg:flex">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Asking price</p>
              <p className="mt-2 text-4xl font-black text-orange-300">{currency(car.price)}</p>
            </div>
            <span className={`rounded-full px-4 py-2 text-sm font-black ${car.sold ? "bg-red-600" : "bg-emerald-500"}`}>
              {car.sold ? "Sold" : "Available"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3">
            <Spec icon={<Calendar />} label="Year" value={String(car.year)} />
            <Spec icon={<Gauge />} label="Mileage" value={`${number(car.mileage)} mi`} />
            <Spec icon={<Fuel />} label="Fuel" value={car.fuelType} />
            <Spec icon={<Settings />} label="Transmission" value={car.transmission} />
            <Spec icon={<Wrench />} label="Engine" value={car.engine} />
            <Spec icon={<BadgeCheck />} label="Condition" value={car.condition} />
          </div>

          <div className="mt-6 sm:mt-8">
            <h2 className="text-xl font-black text-slate-950">Seller notes</h2>
            <p className="mt-3 leading-7 text-slate-600 sm:leading-8">{car.description}</p>
          </div>

          <div className="mt-6 grid gap-3 rounded-3xl bg-white p-4 shadow-sm sm:mt-8 sm:rounded-[2rem] sm:p-5">
            <Info label="VIN" value={car.vin || "Available on request"} />
            <Info label="Drivetrain" value={car.drivetrain} />
            <Info label="Body type" value={car.bodyType} />
            <Info label="Exterior / Interior" value={`${car.exteriorColor} / ${car.interiorColor}`} />
            <Info label="MPG / range" value={car.mpg} />
          </div>

          <div className="mt-6 sm:mt-8">
            <h2 className="text-xl font-black text-slate-950">Features</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {car.features.map((feature) => (
                <span key={feature} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="mt-16">
          <h2 className="text-3xl font-black tracking-tight text-slate-950">Similar cars</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <CarCard key={item.id} car={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-sm sm:block sm:p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 sm:mb-3 sm:h-10 sm:w-10">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-xs sm:tracking-[0.16em]">{label}</p>
        <p className="mt-0.5 text-sm font-black text-slate-900 sm:mt-1 sm:text-base">{value}</p>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="text-right text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}
