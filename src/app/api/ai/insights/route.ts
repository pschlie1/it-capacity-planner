import { NextResponse } from 'next/server';
import { buildAIContext } from '@/lib/ai-context';
import OpenAI from 'openai';

export async function GET() {
  const { contextText, data } = buildAIContext();

  // Generate seed insights from data even without API key
  const seedInsights: any[] = [];
  
  // Over-allocated resources
  for (const o of data.overallocated) {
    seedInsights.push({
      id: `overalloc-${o.name}`,
      type: 'warning',
      icon: '⚠️',
      title: `${o.name} is over-allocated`,
      description: `Peak allocation of ${o.peakPct}% across ${o.weeks.length} weeks. Risk of burnout and quality issues.`,
      actionable: true,
      actionLabel: 'View Resource',
    });
  }

  // SPOFs
  for (const s of data.spofs) {
    seedInsights.push({
      id: `spof-${s.skillName}`,
      type: 'critical',
      icon: '🔴',
      title: `Single point of failure: ${s.skillName}`,
      description: `Only ${s.resource.name} has this skill. Affects: ${s.projects.join(', ')}. Consider cross-training.`,
      actionable: true,
      actionLabel: 'View Skills Matrix',
    });
  }

  // Infeasible projects
  if (data.infeasibleCount > 0) {
    seedInsights.push({
      id: 'infeasible',
      type: 'critical',
      icon: '🔴',
      title: `${data.infeasibleCount} projects exceed capacity`,
      description: `Projects below the red line: ${data.infeasibleProjects.join(', ')}. Consider deferring or adding resources.`,
      actionable: true,
      actionLabel: 'View Portfolio',
    });
  }

  // Under-utilized teams
  const underUtilized = data.teamCapacities.filter((tc: any) => tc.utilization < 50);
  for (const tc of underUtilized) {
    seedInsights.push({
      id: `underutil-${tc.teamId}`,
      type: 'opportunity',
      icon: '💡',
      title: `${tc.teamName} has spare capacity`,
      description: `Only ${tc.utilization.toFixed(0)}% utilized. ${(tc.projectCapacityPerWeek * (1 - tc.utilization / 100)).toFixed(0)}h/week available for new work.`,
      actionable: true,
      actionLabel: 'View Team',
    });
  }

  // High utilization warning
  const highUtil = data.teamCapacities.filter((tc: any) => tc.utilization > 90);
  for (const tc of highUtil) {
    seedInsights.push({
      id: `highutil-${tc.teamId}`,
      type: 'warning',
      icon: '⚠️',
      title: `${tc.teamName} near capacity limit`,
      description: `${tc.utilization.toFixed(0)}% utilized. Any additional demand or unexpected absence will cause delays.`,
      actionable: true,
      actionLabel: 'View Team',
    });
  }

  // High risk projects
  const highRisk = data.projects.filter((p: any) => p.riskLevel === 'high' && p.status !== 'complete' && p.status !== 'cancelled');
  if (highRisk.length > 0) {
    seedInsights.push({
      id: 'high-risk',
      type: 'warning',
      icon: '⚠️',
      title: `${highRisk.length} high-risk projects active`,
      description: `${highRisk.map((p: any) => p.name).join(', ')} — monitor closely for delays.`,
      actionable: false,
    });
  }

  // If we have API key, ask AI for additional smart insights
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Generate 3-5 additional actionable insights about this IT capacity data that aren't obvious from simple metrics. Focus on hidden patterns, optimization opportunities, and strategic recommendations.

${contextText}

Respond with ONLY valid JSON:
{"insights": [{"id": "string", "type": "opportunity|warning|critical|info", "icon": "💡|⚠️|🔴|✅", "title": "string", "description": "string", "actionable": true}]}`
          },
          { role: 'user', content: 'Generate smart capacity insights.' },
        ],
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const aiInsights = JSON.parse(completion.choices[0].message.content || '{}');
      if (aiInsights.insights) {
        seedInsights.push(...aiInsights.insights);
      }
    } catch {
      // Silently fail - we still have seed insights
    }
  }

  return NextResponse.json({ insights: seedInsights.slice(0, 12) });
}
