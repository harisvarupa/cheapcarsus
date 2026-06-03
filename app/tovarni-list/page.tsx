import { TovarniListGenerator } from "@/components/tovarni-list-generator";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Tovarni list | Bosnian Delivery Service",
  description: "Privatni alat za generisanje tovarnih listova.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TovarniListPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; adminKey?: string }>;
}) {
  const { key, adminKey } = await searchParams;
  const accessKey = key ?? adminKey ?? "";

  if (!process.env.ADMIN_ACCESS_KEY || accessKey !== process.env.ADMIN_ACCESS_KEY) {
    notFound();
  }

  return <TovarniListGenerator initialAdminKey={accessKey} />;
}
