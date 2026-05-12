export const metadata = {
  title: "Terms of Service | cheapcarsus",
  description: "Terms of service for cheapcarsus.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        By using cheapcarsus, you agree that listings are provided for marketplace convenience and
        must be independently verified before purchase.
      </p>
      <h2>Vehicle listings</h2>
      <p>
        Prices, mileage, condition, features, availability, and sold status may change. Buyers should
        inspect vehicles, verify title status, and confirm all details with the seller.
      </p>
      <h2>Listing accuracy</h2>
      <p>
        Listing managers are responsible for accurate vehicle information, lawful photo uploads, and
        removal or sold marking when inventory changes.
      </p>
      <h2>No warranty</h2>
      <p>
        Unless separately stated in a signed agreement, vehicles are presented as used inventory and
        may be sold as-is. cheapcarsus does not guarantee financing, repairs, inspections, or future
        vehicle performance.
      </p>
    </LegalPage>
  );
}

function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <article className="rounded-[2rem] bg-white p-8 leading-8 text-slate-700 shadow-sm sm:p-12">
        <h1 className="mb-6 text-4xl font-black tracking-tight text-slate-950">{title}</h1>
        <div className="[&>h2]:mb-2 [&>h2]:mt-8 [&>h2]:text-2xl [&>h2]:font-black [&>h2]:text-slate-950 [&>p]:mt-3">
          {children}
        </div>
      </article>
    </div>
  );
}
