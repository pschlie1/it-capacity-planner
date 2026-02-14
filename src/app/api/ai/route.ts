import { NextResponse } from 'next/server';
import { getTeams, getProjects, getTeamEstimates } from '@/lib/store';
import { runAllocationEngine, TeamData, ProjectData } from '@/lib/allocation-engine';
import OpenAI from 'openai';

export async function POST(req: Request) {
  const { message } = await req.json();

  const teams = getTeams();
  const projects = getProjects();
  const allEstimates = getTeamEstimates();

  const teamData: TeamData[] = teams.map(t => ({ ...t }));
  const projectData: ProjectData[] = projects.map(p => ({
    id: p.id, name: p.name, priority: p.priority, status: p.status,
    startWeekOffset: p.startWeekOffset,
    teamEstimates: allEstimates.filter(te => te.projectId === p.id).map(te => ({
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
  const ests = allEstimates.filter(te => te.projectId === p.id);
  const totalHours = ests.reduce((sum, te) => sum + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0);
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      response: `**AI Analysis (Demo Mode)**\n\nThe AI analyst requires an OpenAI API key to provide real-time analysis. Here's a summary based on the current data:\n\n**Capacity Overview:**\n- ${teams.length} teams with ${teamCapacities.reduce((s, tc) => s + tc.projectCapacityPerWeek, 0).toFixed(0)}h/week total project capacity\n- ${feasibleProjects.length}/${projects.length} projects are feasible within the 12-month window\n- Average utilization: ${(teamCapacities.reduce((s, tc) => s + tc.utilization, 0) / teamCapacities.length).toFixed(1)}%\n\n**Key Findings:**\n${infeasibleProjects.length > 0 ? `- ⚠️ ${infeasibleProjects.length} projects exceed capacity: ${infeasibleProjects.map(p => p.projectName).join(', ')}` : '- ✅ All projects fit within capacity'}\n- Most constrained: ${teamCapacities.sort((a, b) => b.utilization - a.utilization)[0]?.teamName}\n\nTo enable full AI analysis, set the OPENAI_API_KEY environment variable.`,
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert IT capacity planning analyst. You have access to the organization's complete capacity planning data below. Provide actionable, data-driven insights. Be concise but thorough. Use specific numbers and team names. Format responses with markdown.\n\n${contextData}`
        },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return NextResponse.json({ response: completion.choices[0].message.content });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: 'AI service error', details: err.message }, { status: 500 });
  }
}
