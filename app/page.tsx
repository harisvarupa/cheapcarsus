import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeDollarSign, Car, CheckCircle2, Sparkles, Wrench } from "lucide-react";
import { CarSearch } from "@/components/car-search";
import { HERO_DEALERSHIP_IMAGE } from "@/lib/car-images";
import { getCars } from "@/lib/cars";
import { currency, number } from "@/lib/utils";

export const revalidate = 30;

export default async function Home() {
  const cars = await getCars();
  const available = cars.filter((car) => !car.sold);
  const lowestPrice = cars.length ? Math.min(...cars.map((car) => car.price)) : 0;

  return (
    <>
      <section className="hero-grid relative overflow-hidden">
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-300/30 blur-3xl" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-orange-700 shadow-sm">
              <Sparkles size={16} /> Cheap cars without mystery listings
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Find the right used car, even on a tight budget.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              cheapcarsus helps shoppers compare affordable cars, project cars, mechanic specials,
              commuter sedans, trucks, EVs, and SUVs with clear condition pills upfront.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#search"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-7 py-4 font-black text-white shadow-xl shadow-orange-500/25 transition hover:-translate-y-0.5 hover:bg-orange-600"
              >
                Search inventory <ArrowRight size={18} />
              </Link>
              <Link
                href="/sell-your-car#contact"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-4 font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300"
              >
                Sell your car
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <HeroStat label="Cars loaded" value={`${cars.length}+`} />
              <HeroStat label="Available now" value={number(available.length)} />
              <HeroStat label="Starting at" value={lowestPrice ? currency(lowestPrice) : "Add first car"} />
            </div>
          </div>

          <div className="relative">
            <div className="shine overflow-hidden rounded-[2.5rem] bg-slate-950 p-4 shadow-2xl shadow-slate-900/30">
              <Image
                src={HERO_DEALERSHIP_IMAGE}
                alt="Used cars at a dealership"
                width={1200}
                height={1100}
                className="h-[520px] w-full rounded-[2rem] object-cover"
                priority
                unoptimized
              />
            </div>
            <div className="absolute -bottom-6 left-4 right-4 rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:left-8 sm:right-8">
              <div className="flex items-start gap-4">
                <span className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <CheckCircle2 />
                </span>
                <div>
                  <p className="font-black text-slate-950">Transparent status tags</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Flag cars as clean title, not running, broken engine, sold, tow away, or daily
                    driver before shoppers click.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <ValueCard icon={<BadgeDollarSign />} title="Budget-first inventory" text="Filters for price, mileage, fuel type, and year help shoppers stay inside their budget." />
        <ValueCard icon={<Wrench />} title="Mechanic-special friendly" text="Custom pills make disclosed issues visible, from starter problems to broken engines." />
        <ValueCard icon={<Car />} title="Fresh listing details" text="Photos, availability, pricing, and condition notes stay easy to scan before you open a car." />
      </section>

      <div id="search">
        <CarSearch cars={cars} compact title="Search cheap used cars" />
      </div>
    </>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function ValueCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
        {icon}
      </div>
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-3 leading-7 text-slate-600">{text}</p>
    </div>
  );
}
