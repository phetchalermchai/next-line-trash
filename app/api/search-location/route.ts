import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    if (!q) return NextResponse.json([], { status: 400 });

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&addressdetails=1&limit=5`;

    const res = await fetch(url, {
      headers: { "User-Agent": "nonthaburi-complaint-system" }
    });

    if (!res.ok) {
      // Nominatim ตอบ error เช่น 429, 500
      return NextResponse.json(
        { error: `Upstream error: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (err: any) {
    console.error("API search-location error:", err);
    return NextResponse.json(
      { error: "Unexpected error. " + (err?.message || "") },
      { status: 500 }
    );
  }
}
