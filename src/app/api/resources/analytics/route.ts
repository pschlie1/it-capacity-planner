import { NextResponse } from 'next/server';
import {
  getResources, getAssignments, getOverallocatedResources, getSinglePointsOfFailure,
  getSkillMatrix, getAllSkills, getProductivitySettings, getResourceWeeklyUtilization
} from '@/lib/resource-store';
import { getStore } from '@/lib/store';

export async function GET() {
  const resources = getResources();
  const teams = getStore().teams;
  const projects = getStore().projects;
  const assignments = getAssignments();
  const overallocated = getOverallocatedResources();
  const spof = getSinglePointsOfFailure();
  const skillMatrix = getSkillMatrix();
  const allSkills = getAllSkills();
  const productivity = getProductivitySettings();

  // Most utilized resources
  const resourceUtilization = resources.map(r => {
    const util = getResourceWeeklyUtilization(r.id);
    const avg = util.reduce((a, b) => a + b, 0) / 52;
    const team = teams.find(t => t.id === r.teamId);
    return { id: r.id, name: r.name, teamName: team?.name, avgUtilization: avg, maxUtilization: Math.max(...util), seniority: r.seniority, roleType: r.roleType };
  }).sort((a, b) => b.avgUtilization - a.avgUtilization);

  // Resource contention - who is assigned to the most projects
  const contentionMap: Record<string, number> = {};
  assignments.forEach(a => { contentionMap[a.resourceId] = (contentionMap[a.resourceId] || 0) + 1; });
  const mostContested = Object.entries(contentionMap)
    .map(([id, count]) => {
      const r = resources.find(res => res.id === id)!;
      return { id, name: r.name, projectCount: count, teamName: teams.find(t => t.id === r.teamId)?.name };
    })
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, 10);

  // Seniority distribution per team
  const seniorityByTeam = teams.map(t => {
    const teamResources = resources.filter(r => r.teamId === t.id);
    const dist: Record<string, number> = { Junior: 0, Mid: 0, Senior: 0, Lead: 0, Principal: 0 };
    teamResources.forEach(r => { dist[r.seniority]++; });
    return { teamId: t.id, teamName: t.name, total: teamResources.length, ...dist };
  });

  // Burnout risk: >85% utilization for 4+ consecutive weeks
  const burnoutRisk = resources.map(r => {
    const util = getResourceWeeklyUtilization(r.id);
    let maxConsecutive = 0;
    let current = 0;
    for (const u of util) {
      if (u >= 85) { current++; maxConsecutive = Math.max(maxConsecutive, current); }
      else { current = 0; }
    }
    return { id: r.id, name: r.name, maxConsecutiveHighWeeks: maxConsecutive, atRisk: maxConsecutive >= 4, teamName: teams.find(t => t.id === r.teamId)?.name };
  }).filter(r => r.atRisk);

  // Hiring forecast by role
  const roleNeeds: Record<string, { current: number; avgUtil: number }> = {};
  resources.forEach(r => {
    if (!roleNeeds[r.roleType]) roleNeeds[r.roleType] = { current: 0, avgUtil: 0 };
    roleNeeds[r.roleType].current++;
    const util = getResourceWeeklyUtilization(r.id);
    roleNeeds[r.roleType].avgUtil += util.reduce((a, b) => a + b, 0) / 52;
  });
  Object.keys(roleNeeds).forEach(k => { roleNeeds[k].avgUtil /= roleNeeds[k].current; });

  return NextResponse.json({
    totalResources: resources.length,
    totalTeams: teams.length,
    resourceUtilization,
    mostContested,
    overallocatedCount: new Set(overallocated.map(o => o.resource.id)).size,
    overallocated: overallocated.slice(0, 20),
    singlePointsOfFailure: spof,
    seniorityByTeam,
    burnoutRisk,
    roleNeeds,
    skillMatrix,
    allSkills,
    productivity,
  });
}
