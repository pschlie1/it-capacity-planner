import { validateBody, checkRateLimit, getRateLimitResponse, safeErrorResponse, getClientIp } from '@/lib/api-utils';
import { aiOptimizeSchema } from '@/lib/schemas';
import { NextResponse } from 'next/server';
import { buildAIContext } from '@/lib/ai-context';
import OpenAI from 'openai';

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) return getRateLimitResponse();

  const validated = await validateBody(req, aiOptimizeSchema);
  if ('error' in validated) return validated.error;
  const { type } = validated.data; // 'portfolio' | 'resource' | 'hiring' | 'cost'
  const { contextText, data } = buildAIContext();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      recommendations: [{
        id: 'demo-1', type, title: 'Demo Recommendation',
        description: 'Set OPENAI_API_KEY to get real AI optimization recommendations.',
        impact: 'N/A', confidence: 'low', actions: [],
      }]
    });
  }

  const prompts: Record<string, string> = {
    portfolio: `Analyze the project portfolio and recommend the optimal priority ordering to maximize total business value delivered within capacity constraints. Consider:
- Business value ratings and committed dates
- Team capacity and current utilization
- Project dependencies
- Risk levels
Provide 3-5 specific reordering recommendations.`,
    resource: `Analyze resource allocations and suggest reassignments to reduce bottlenecks and improve utilization balance. Look for:
- Over-allocated resources that could be relieved
- Under-utilized resources that could take on more
- Skill mismatches that could be optimized
Provide 3-5 specific reassignment recommendations.`,
    hiring: `Based on skill gaps and demand forecast, recommend specific hires. Consider:
- Skills that are single points of failure
- Teams at or above 90% utilization
- Projects that lack required skills coverage
- Upcoming project demands
Provide 3-5 specific hiring recommendations with role, skills, seniority, team, and urgency.`,
    cost: `Analyze the resource cost structure and identify optimization opportunities:
- Where contractors could replace FTEs for short-term projects
- Where FTEs should replace ongoing contractor engagements
- Over-staffed areas that could be right-sized
- Cost-effective alternatives for expensive skill gaps
Provide 3-5 cost optimization recommendations.`,
  };

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert IT capacity optimization consultant. Analyze the data and provide actionable recommendations.

${contextText}

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "recommendations": [
    {
      "id": "string (unique)",
      "type": "${type}",
      "title": "string (concise)",
      "description": "string (detailed explanation)",
      "impact": "string (quantified impact)",
      "confidence": "high|medium|low",
      "actions": [{"label": "string", "actionType": "string", "params": {}}]
    }
  ],
  "summary": "string (2-3 sentence overview)"
}`
        },
        { role: 'user', content: prompts[type] || prompts.portfolio },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: 'AI service error', details: (error as Error).message }, { status: 500 });
  }
}
