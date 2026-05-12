"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CarCard } from "@/components/car-card";
import { CustomSelect } from "@/components/custom-select";
import type { Car, CarFilters } from "@/lib/types";
import { cn, currency, unique } from "@/lib/utils";

const defaultFilters: CarFilters = {
  query: "",
  make: "",
  model: "",
  fuelType: "",
  bodyType: "",
  condition: "",
  minYear: "",
  maxYear: "",
  maxPrice: "",
  maxMileage: "",
  includeSold: true,
};

export function CarSearch({
  cars,
  compact = false,
  title = "Browse Used Cars",
}: {
  cars: Car[];
  compact?: boolean;
  title?: string;
}) {
  const [filters, setFilters] = useState<CarFilters>(defaultFilters);

  const makeOptions = useMemo(
    () => unique(cars.map((car) => car.make)).map((make) => ({ label: make, value: make })),
    [cars],
  );
  const modelOptions = useMemo(
    () =>
      unique(cars.filter((car) => !filters.make || car.make === filters.make).map((car) => car.model)).map(
        (model) => ({ label: model, value: model }),
      ),
    [cars, filters.make],
  );
  const fuelOptions = useMemo(
    () => unique(cars.map((car) => car.fuelType)).map((fuel) => ({ label: fuel, value: fuel })),
    [cars],
  );
  const bodyOptions = useMemo(
    () => unique(cars.map((car) => car.bodyType)).map((body) => ({ label: body, value: body })),
    [cars],
  );
  const conditionOptions = useMemo(
    () => unique(cars.map((car) => car.condition)).map((condition) => ({ label: condition, value: condition })),
    [cars],
  );

  const filteredCars = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return cars.filter((car) => {
      const searchable = `${car.title} ${car.make} ${car.model} ${car.trim} ${car.location} ${car.pills.join(" ")}`.toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (!filters.make || car.make === filters.make) &&
        (!filters.model || car.model === filters.model) &&
        (!filters.fuelType || car.fuelType === filters.fuelType) &&
        (!filters.bodyType || car.bodyType === filters.bodyType) &&
        (!filters.condition || car.condition === filters.condition) &&
        (!filters.minYear || car.year >= Number(filters.minYear)) &&
        (!filters.maxYear || car.year <= Number(filters.maxYear)) &&
        (!filters.maxPrice || car.price <= Number(filters.maxPrice)) &&
        (!filters.maxMileage || car.mileage <= Number(filters.maxMileage)) &&
        (filters.includeSold || !car.sold)
      );
    });
  }, [cars, filters]);

  const update = <K extends keyof CarFilters>(key: K, value: CarFilters[K]) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "make" ? { model: "" } : {}),
    }));
  };

  return (
    <section className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", compact ? "py-8" : "py-14")}>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-700">
            <SlidersHorizontal size={15} /> Smart filters
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Search by brand, model, year, price, mileage, fuel type, body style, condition tags, and
            availability.
          </p>
        </div>
        <div className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm">
          {filteredCars.length} of {cars.length} cars
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] p-4 sm:p-6">
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            value={filters.query}
            onChange={(event) => update("query", event.target.value)}
            placeholder="Search Camry, hybrid, broken engine, Dallas..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-4 text-base font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />
          {filters.query ? (
            <button
              type="button"
              onClick={() => update("query", "")}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 p-1.5 text-slate-500"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <CustomSelect label="Brand" value={filters.make} options={makeOptions} onChange={(value) => update("make", value)} />
          <CustomSelect label="Model" value={filters.model} options={modelOptions} onChange={(value) => update("model", value)} />
          <CustomSelect label="Fuel" value={filters.fuelType} options={fuelOptions} onChange={(value) => update("fuelType", value)} />
          <CustomSelect label="Body" value={filters.bodyType} options={bodyOptions} onChange={(value) => update("bodyType", value)} />
          <CustomSelect
            label="Condition"
            value={filters.condition}
            options={conditionOptions}
            onChange={(value) => update("condition", value)}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <FilterInput label="Min year" value={filters.minYear} onChange={(value) => update("minYear", value)} placeholder="2012" />
          <FilterInput label="Max year" value={filters.maxYear} onChange={(value) => update("maxYear", value)} placeholder="2024" />
          <FilterInput label="Max price" value={filters.maxPrice} onChange={(value) => update("maxPrice", value)} placeholder="15000" />
          <FilterInput
            label="Max mileage"
            value={filters.maxMileage}
            onChange={(value) => update("maxMileage", value)}
            placeholder="120000"
          />
          <label className="flex items-end">
            <button
              type="button"
              onClick={() => update("includeSold", !filters.includeSold)}
              className={cn(
                "flex min-h-[48px] w-full items-center justify-center rounded-2xl border px-4 py-3 text-sm font-black transition",
                filters.includeSold
                  ? "border-orange-200 bg-orange-50 text-orange-700"
                  : "border-slate-200 bg-white text-slate-500",
              )}
            >
              {filters.includeSold ? "Showing sold cars" : "Hide sold cars"}
            </button>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setFilters(defaultFilters)}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-700"
          >
            Reset filters
          </button>
          {filters.maxPrice ? (
            <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
              Under {currency(Number(filters.maxPrice))}
            </span>
          ) : null}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div layout className="mt-9 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCars.map((car) => (
            <motion.div
              layout
              key={car.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
            >
              <CarCard car={car} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {!filteredCars.length ? (
        <div className="mt-10 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="text-2xl font-black text-slate-950">No cars matched those filters.</h3>
          <p className="mt-2 text-slate-600">Try a broader search or reset filters to view all inventory.</p>
        </div>
      ) : null}
    </section>
  );
}

function FilterInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      />
    </label>
  );
}
