import { Calculator, CheckCircle2, Landmark } from "lucide-react";

export const metadata = {
  title: "Financing | cheapcarsus",
  description: "Budget guidance for financing affordable used cars.",
};

export default function FinancingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="rounded-[2.5rem] bg-slate-950 p-8 text-white sm:p-12">
        <span className="rounded-full bg-orange-500 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-950">
          Financing
        </span>
        <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight">Buy inside your budget.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
          cheapcarsus can support cash buyers, credit-union financing, and lender referrals. Keep
          total ownership cost in mind: taxes, registration, insurance, repairs, fuel, and charging.
        </p>
      </section>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <FinanceCard icon={<Calculator />} title="Estimate total cost" text="Compare price, mileage, fuel economy, and expected repair needs before committing." />
        <FinanceCard icon={<Landmark />} title="Bring pre-approval" text="A credit-union or bank pre-approval can help you negotiate confidently." />
        <FinanceCard icon={<CheckCircle2 />} title="Inspect before purchase" text="For mechanic specials, price in towing, diagnostics, parts, and labor." />
      </div>
    </div>
  );
}

function FinanceCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
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
