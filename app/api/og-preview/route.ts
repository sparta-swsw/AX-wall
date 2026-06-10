import { NextResponse } from 'next/server';
import { fetchOgData } from '@/lib/og';

export async function POST(request: Request) {
  const { url } = await request.json();
  if (!url) return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });

  const ogData = await fetchOgData(url);
  return NextResponse.json({ ...ogData, url });
}
