import Link from "next/link";
import { Camera, ClipboardCheck, DollarSign, Send } from "lucide-react";

export const metadata = {
  title: "Sell Your Car | cheapcarsus",
  description: "Learn how to list a used car on cheapcarsus with clear photos and condition notes.",
};

export default function SellYourCarPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="grid gap-8 rounded-[2.5rem] bg-white p-8 shadow-sm lg:grid-cols-[1fr_0.8fr] lg:p-12">
        <div>
          <span className="rounded-full bg-orange-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-700">
            Sell your car
          </span>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-950">
            Turn a car into a clean listing quickly.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Whether it is a daily driver, trade-in, project car, or non-running vehicle, collect
            strong photos and honest condition notes so shoppers know exactly what they are viewing.
          </p>
          <Link
            href="#contact"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-4 font-black text-white shadow-lg shadow-orange-500/25 transition hover:-translate-y-0.5"
          >
            Contact us <Send size={18} />
          </Link>
        </div>
        <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
          <h2 className="text-2xl font-black">Recommended listing checklist</h2>
          <div className="mt-6 grid gap-4">
            <Step icon={<Camera />} text="Upload at least one clear exterior image in daylight." />
            <Step icon={<ClipboardCheck />} text="Add accurate mileage, VIN, engine, drivetrain, and condition tags." />
            <Step icon={<DollarSign />} text="Set a realistic price and mark sold immediately when the car is no longer available." />
          </div>
        </div>
      </section>

      <section id="contact" className="mt-12 rounded-[2rem] bg-slate-950 p-8 text-white">
        <h2 className="text-3xl font-black">Seller contact</h2>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          For production, connect this section to your preferred lead inbox or Supabase table. For
          now, route seller questions to hello@cheapcarsus.com.
        </p>
      </section>
    </div>
  );
}

function Step({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white/10 p-4">
      <span className="text-orange-300">{icon}</span>
      <p className="font-semibold leading-7 text-slate-200">{text}</p>
    </div>
  );
}
