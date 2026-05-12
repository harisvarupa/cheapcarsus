import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <BrandLogo inverted markClassName="h-11 w-11 bg-white/10" />
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-300">
            Affordable used cars with transparent condition tags and clear listing updates.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} /> Nationwide marketplace, USA
            </span>
            <span className="inline-flex items-center gap-2">
              <Phone size={16} /> (555) 014-2026
            </span>
            <span className="inline-flex items-center gap-2">
              <Mail size={16} /> hello@cheapcarsus.com
            </span>
          </div>
        </div>

        <FooterColumn
          title="Shop"
          links={[
            ["Inventory", "/cars"],
            ["Financing", "/financing"],
            ["Sell Your Car", "/sell-your-car"],
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            ["About", "/about"],
            ["Contact", "/sell-your-car#contact"],
          ]}
        />
        <FooterColumn
          title="Legal"
          links={[
            ["Terms of Service", "/terms"],
            ["Privacy Policy", "/privacy"],
          ]}
        />
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} cheapcarsus. Demo inventory is for launch staging.
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-orange-300">{title}</h3>
      <div className="grid gap-3 text-sm text-slate-300">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="transition hover:text-white">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
