import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runAllocationEngine, TeamData, ProjectData } from '@/lib/allocation-engine';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { message } = await req.json();

  // Gather full context
  const teams = await prisma.team.findMany();
  const projects = await prisma.project.findMany({
    include: { teamEstimates: true },
    orderBy: { priority: 'asc' },
  });

  const teamData: TeamData[] = teams.map(t => ({ ...t, uxDesignerFte: t.uxDesignerFte }));
  const projectData: ProjectData[] = projects.map(p => ({
    id: p.id, name: p.name, priority: p.priority, status: p.status,
    startWeekOffset: p.startWeekOffset,
    teamEstimates: p.teamEstimates.map(te => ({
      teamId: te.teamId, design: te.design, development: te.development,
      testing: te.testing, deployment: te.deployment, postDeploy: te.postDeploy,
    })),
  }));

  const { allocations, teamCapacities } = runAllocationEngine(teamData, projectData);

  const feasibleProjects = allocations.filter(a => a.feasible);
  const infeasibleProjects = allocations.filter(a => !a.feasible);

  const contextData = `
## IT Capacity Planning Data

### Teams (${teams.length} total)
${teams.map(t => `- **${t.name}**: ${t.developerFte} devs, ${t.architectFte} architects, ${t.qaFte} QA, ${t.devopsFte} DevOps | KLO/TLM: ${t.kloTlmHoursPerWeek}h/wk | Admin: ${t.adminPct}%`).join('\n')}

### Team Capacities
${teamCapacities.map(tc => `- **${tc.teamName}**: ${tc.totalHoursPerWeek.toFixed(0)}h total → ${tc.kloTlmHours}h KLO/TLM → ${tc.adminHours.toFixed(0)}h admin → **${tc.projectCapacityPerWeek.toFixed(0)}h/wk project capacity** | Utilization: ${tc.utilization.toFixed(1)}%`).join('\n')}

### Projects (${projects.length} total, ordered by priority)
${projects.map(p => {
  const alloc = allocations.find(a => a.projectId === p.id);
  const totalHours = p.teamEstimates.reduce((sum, te) => sum + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0);
  return `${p.priority}. **${p.name}** (${p.status}) - ${totalHours}h total | ${alloc?.feasible ? '✅ Feasible' : '❌ Exceeds capacity'} | Weeks ${alloc?.startWeek}-${alloc?.endWeek} (${alloc?.totalWeeks} wks)${alloc?.bottleneck ? ` | Bottleneck: ${alloc.bottleneck.teamName}` : ''}`;
}).join('\n')}

### The Red Line
- **${feasibleProjects.length} projects fit** within the 12-month capacity window
- **${infeasibleProjects.length} projects exceed** capacity (below the red line)
${infeasibleProjects.length > 0 ? `- Projects below the red line: ${infeasibleProjects.map(p => p.projectName).join(', ')}` : ''}

### Key Metrics
- Total organization project capacity: ${teamCapacities.reduce((sum, tc) => sum + tc.projectCapacityPerWeek, 0).toFixed(0)} hours/week
- Average utilization: ${(teamCapacities.reduce((sum, tc) => sum + tc.utilization, 0) / teamCapacities.length).toFixed(1)}%
- Most utilized team: ${teamCapacities.sort((a, b) => b.utilization - a.utilization)[0]?.teamName} (${teamCapacities.sort((a, b) => b.utilization - a.utilization)[0]?.utilization.toFixed(1)}%)
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert IT capacity planning analyst. You have access to the organization's complete capacity planning data below. Provide actionable, data-driven insights. Be concise but thorough. Use specific numbers and team names. Format responses with markdown.

${contextData}`
        },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return NextResponse.json({
      response: completion.choices[0].message.content,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: 'AI service unavailable', details: err.message },
      { status: 500 }
    );
  }
}
