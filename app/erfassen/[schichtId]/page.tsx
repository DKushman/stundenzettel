import { Wizard } from "@/components/wizard/wizard";

export default async function WizardPage({
  params,
}: {
  params: Promise<{ schichtId: string }>;
}) {
  const { schichtId } = await params;
  return <Wizard schichtId={schichtId} />;
}
