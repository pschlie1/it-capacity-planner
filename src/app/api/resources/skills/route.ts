import { NextResponse } from 'next/server';
import { getSkillMatrix, getAllSkills, getSinglePointsOfFailure, getSkillGaps, getRecommendedAssignments } from '@/lib/resource-store';
import { getStore } from '@/lib/store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  if (projectId) {
    const gaps = getSkillGaps(projectId);
    const recommendations = getRecommendedAssignments(projectId);
    return NextResponse.json({ gaps, recommendations });
  }

  const matrix = getSkillMatrix();
  const skills = getAllSkills();
  const spof = getSinglePointsOfFailure();
  const teams = getStore().teams;

  return NextResponse.json({ matrix, skills, singlePointsOfFailure: spof, teams });
}
