import { getTeam, updateTeam, deleteTeam } from '@/lib/store';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const team = getTeam(params.id);
  return team ? NextResponse.json(team) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  const team = updateTeam(params.id, data);
  return NextResponse.json(team);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  deleteTeam(params.id);
  return NextResponse.json({ success: true });
}
