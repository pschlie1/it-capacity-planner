import { getTeams, createTeam } from '@/lib/store';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(getTeams());
}

export async function POST(req: Request) {
  const data = await req.json();
  const team = createTeam(data);
  return NextResponse.json(team);
}
