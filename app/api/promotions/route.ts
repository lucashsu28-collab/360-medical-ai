import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const search = req.nextUrl.search;
  const upstream = await fetch(`${apiUrl}/api/promotions${search}`, {
    next: { revalidate: 60 },
  });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
