import { AdminCMS } from "@/components/admin-cms";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Admin | cheapcarsus",
  description: "Private inventory tools for cheapcarsus.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; adminKey?: string }>;
}) {
  const { key, adminKey } = await searchParams;
  const accessKey = key ?? adminKey ?? "";

  if (!process.env.ADMIN_ACCESS_KEY || accessKey !== process.env.ADMIN_ACCESS_KEY) {
    notFound();
  }

  return <AdminCMS initialAdminKey={accessKey} />;
}
