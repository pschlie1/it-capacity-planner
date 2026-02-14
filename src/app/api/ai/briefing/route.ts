import { requireAuth, isAuthError } from '@/lib/api-auth';
import { checkRateLimit, getRateLimitResponse, safeErrorResponse, getClientIp } from '@/lib/api-utils';
import { NextResponse } from 'next/server';
import { buildAIContext } from '@/lib/ai-context';
import OpenAI from 'openai';

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) return getRateLimitResponse();

  const { contextText, data } = await buildAIContext(auth.orgId);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      briefing: {
        generatedAt: new Date().toISOString(),
        sections: [
          { title: 'Portfolio Overview', content: `**${data.projects.length} projects** in portfolio. ${data.feasibleCount} feasible within 12-month window, ${data.infeasibleCount} exceed capacity. Set OPENAI_API_KEY for full AI-generated briefings.` },
          { title: 'Capacity Summary', content: `Average team utilization: ${(data.teamCapacities.reduce((s: number, tc: any) => s + tc.utilization, 0) / data.teamCapacities.length).toFixed(1)}%. ${data.teams.length} teams, ${data.resources.length} resources.` },
          { title: 'Key Risks', content: data.spofs.length > 0 ? `Single points of failure: ${data.spofs.map((s: any) => s.skillName).join(', ')}` : 'No critical single points of failure.' },
          { title: 'Recommendations', content: 'Enable AI for personalized recommendations.' },
        ]
      }
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are generating an executive capacity briefing for the IT leadership team and board. The tone should be professional, concise, and data-driven.

${contextText}

Generate a comprehensive briefing. Respond with ONLY valid JSON:
{
  "generatedAt": "${new Date().toISOString()}",
  "sections": [
    {"title": "Portfolio Overview", "content": "markdown string"},
    {"title": "Capacity Summary", "content": "markdown string with key metrics"},
    {"title": "Key Risks & Concerns", "content": "markdown string - top 3-5 risks with severity"},
    {"title": "Recommendations", "content": "markdown string - top 3-5 actionable recommendations"},
    {"title": "Resource Highlights", "content": "markdown string - staffing, skills gaps, burnout risks"},
    {"title": "Quarterly Outlook", "content": "markdown string - what to expect next quarter"}
  ],
  "keyMetrics": [
    {"label": "string", "value": "string", "trend": "up|down|stable", "status": "good|warning|critical"}
  ]
}`
        },
        { role: 'user', content: 'Generate the executive capacity briefing for the current state.' },
      ],
      temperature: 0.5,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json({ briefing: result });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'AI service error', details: (error as Error).message }, { status: 500 });
  }
}
