import { Dashboard } from "@/components/dashboard";
import { getSchichtViews } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const schichten = await getSchichtViews();
  return <Dashboard schichten={schichten} />;
}
