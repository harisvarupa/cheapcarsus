import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Calendar, Fuel, Gauge, MapPin, Settings, Wrench } from "lucide-react";
import { CarCard } from "@/components/car-card";
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
  const heroImage = car.images[0] || DEFAULT_CAR_IMAGE;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/cars" className="mb-6 inline-flex items-center gap-2 font-black text-slate-600 hover:text-orange-700">
        <ArrowLeft size={18} /> Back to inventory
      </Link>

      <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-200 shadow-2xl shadow-slate-900/12">
            <Image
              src={heroImage}
              alt={car.title}
              width={1200}
              height={800}
              className="h-[520px] w-full object-cover"
              priority
              unoptimized
            />
            {car.sold ? (
              <div className="absolute left-6 top-6 rounded-full bg-red-600 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white">
                Sold
              </div>
            ) : null}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {car.images.slice(1).map((image) => (
              <Image
                key={image}
                src={image}
                alt={`${car.title} detail`}
                width={600}
                height={400}
                className="h-56 w-full rounded-[1.75rem] object-cover shadow-sm"
                unoptimized
              />
            ))}
          </div>
        </div>

        <div className="glass-panel h-fit rounded-[2.5rem] p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            {car.pills.map((pill) => (
              <span
                key={pill}
                className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-orange-700"
              >
                {pill}
              </span>
            ))}
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{car.title}</h1>
          <p className="mt-3 inline-flex items-center gap-2 text-slate-600">
            <MapPin size={18} /> {car.location}
          </p>
          <div className="mt-6 flex items-end justify-between gap-5 rounded-[2rem] bg-slate-950 p-6 text-white">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Asking price</p>
              <p className="mt-2 text-4xl font-black text-orange-300">{currency(car.price)}</p>
            </div>
            <span className={`rounded-full px-4 py-2 text-sm font-black ${car.sold ? "bg-red-600" : "bg-emerald-500"}`}>
              {car.sold ? "Sold" : "Available"}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Spec icon={<Calendar />} label="Year" value={String(car.year)} />
            <Spec icon={<Gauge />} label="Mileage" value={`${number(car.mileage)} mi`} />
            <Spec icon={<Fuel />} label="Fuel" value={car.fuelType} />
            <Spec icon={<Settings />} label="Transmission" value={car.transmission} />
            <Spec icon={<Wrench />} label="Engine" value={car.engine} />
            <Spec icon={<BadgeCheck />} label="Condition" value={car.condition} />
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-black text-slate-950">Seller notes</h2>
            <p className="mt-3 leading-8 text-slate-600">{car.description}</p>
          </div>

          <div className="mt-8 grid gap-3 rounded-[2rem] bg-white p-5 shadow-sm">
            <Info label="VIN" value={car.vin || "Available on request"} />
            <Info label="Drivetrain" value={car.drivetrain} />
            <Info label="Body type" value={car.bodyType} />
            <Info label="Exterior / Interior" value={`${car.exteriorColor} / ${car.interiorColor}`} />
            <Info label="MPG / range" value={car.mpg} />
          </div>

          <div className="mt-8">
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
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-900">{value}</p>
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
