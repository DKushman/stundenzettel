import { NextResponse } from "next/server";
import { getSchichtViews, getUnternehmen } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Ein Request für Sidebar + Dashboard — serverseitig gecacht. */
export async function GET() {
  const [schichten, unternehmen] = await Promise.all([
    getSchichtViews(),
    getUnternehmen(),
  ]);
  return NextResponse.json({ schichten, unternehmen });
}
