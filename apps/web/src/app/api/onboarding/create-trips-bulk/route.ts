import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = body?.programs?.length ?? 0;
    const tripIds = Array.from({ length: count }, (_, i) => `trip_bulk_${Date.now()}_${i}`);
    return NextResponse.json({ success: true, tripIds, count });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
