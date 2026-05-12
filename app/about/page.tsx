import { BadgeCheck, Eye, Handshake, Wrench } from "lucide-react";

export const metadata = {
  title: "About | cheapcarsus",
  description: "Learn how cheapcarsus helps buyers compare affordable used cars with transparent condition tags.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="rounded-[2.5rem] bg-slate-950 p-8 text-white sm:p-12">
        <span className="rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-950">
          About cheapcarsus
        </span>
        <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight">
          A used-car site built for honest budget shopping.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
          We highlight what matters before a buyer opens a listing: price, mileage, condition,
          known issues, sold status, and practical features.
        </p>
      </section>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <AboutCard icon={<Eye />} title="Clear first impressions" text="Vehicle cards show key photos, titles, mileage, price, and issue pills immediately." />
        <AboutCard icon={<Wrench />} title="Project cars welcome" text="Mechanic specials, non-running cars, and repair-needed vehicles can be disclosed cleanly." />
        <AboutCard icon={<Handshake />} title="Built for quick decisions" text="Listings keep the essentials upfront so buyers can compare cars without digging." />
      </div>

      <section className="mt-12 rounded-[2rem] bg-white p-8 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-slate-950">How we describe cars</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {["Available or sold status is visible on every card.", "Condition pills explain important issues in plain language.", "Filters make cheap, efficient, electric, SUV, truck, and mechanic-special inventory easy to find.", "Every detail page keeps specs, features, and seller notes in one place."].map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
              <BadgeCheck className="shrink-0 text-orange-600" />
              <p className="font-semibold leading-7 text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AboutCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
        {icon}
      </div>
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-3 leading-7 text-slate-600">{text}</p>
    </div>
  );
}
