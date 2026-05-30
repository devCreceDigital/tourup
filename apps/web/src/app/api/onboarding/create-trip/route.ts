import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tripId = `trip_${Date.now()}`;
    console.log("Creating trip:", body?.title ?? "unknown");
    return NextResponse.json({ success: true, tripId });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
