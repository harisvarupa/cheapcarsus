export const metadata = {
  title: "Privacy Policy | cheapcarsus",
  description: "Privacy policy for cheapcarsus.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        cheapcarsus collects only the information needed to operate listings, respond to inquiries,
        protect the site, and improve the marketplace experience.
      </p>
      <h2>Information we may process</h2>
      <p>
        Vehicle listing data may include photos, VIN, mileage, condition notes, location, price, and
        contact details you choose to provide. Admin actions use an access key and server-side
        Supabase credentials.
      </p>
      <h2>Third-party services</h2>
      <p>
        Supabase is used for listing and image storage. Google Gemini may process uploaded vehicle
        images when listing autofill is used. Do not upload images containing private documents or
        sensitive personal information.
      </p>
      <h2>Your choices</h2>
      <p>
        Contact hello@cheapcarsus.com to request updates or removal of listing information. Retention
        depends on operational, legal, and fraud-prevention needs.
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
