import { getSettings, updateSettings } from '@/lib/store';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function PUT(req: Request) {
  const data = await req.json();
  const settings = updateSettings(data);
  return NextResponse.json(settings);
}
