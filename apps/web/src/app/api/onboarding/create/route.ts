import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = body?.workspaceConfig?.slug ?? "agencia";
    return NextResponse.json({ success: true, agencyId: `ag_${Date.now()}`, slug });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
