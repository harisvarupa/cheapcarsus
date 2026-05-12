import { CarSearch } from "@/components/car-search";
import { getCars } from "@/lib/cars";

export const metadata = {
  title: "Inventory | cheapcarsus",
  description: "Search affordable used cars by make, model, year, fuel type, condition, price, and mileage.",
};

export const revalidate = 30;

export default async function CarsPage() {
  const cars = await getCars();

  return (
    <>
      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <span className="rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-950">
            Inventory
          </span>
          <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-tight">Used cars for every budget.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Browse live Supabase listings when configured, with seed inventory available for local
            development and launch demos.
          </p>
        </div>
      </section>
      <CarSearch cars={cars} title="All cheapcarsus inventory" />
    </>
  );
}
