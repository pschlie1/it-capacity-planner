import { checkRateLimit, getRateLimitResponse, safeErrorResponse, getClientIp } from '@/lib/api-utils';
import { NextResponse } from 'next/server';
import { buildAIContext } from '@/lib/ai-context';
import OpenAI from 'openai';

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) return getRateLimitResponse();

  const { contextText, data } = buildAIContext();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      review: {
        generatedAt: new Date().toISOString(),
        summary: 'Weekly review requires OPENAI_API_KEY. Current snapshot: ' + data.feasibleCount + ' feasible projects, ' + data.infeasibleCount + ' over capacity.',
        sections: [
          { title: 'Project Status', items: [{ text: `${data.projects.filter((p: any) => p.status === 'active').length} active projects`, severity: 'info' }] },
          { title: 'Resource Health', items: [{ text: `${data.overallocated.length} over-allocated resources`, severity: data.overallocated.length > 0 ? 'warning' : 'good' }] },
          { title: 'Risks', items: data.spofs.map((s: any) => ({ text: `SPOF: ${s.skillName} (${s.resource.name})`, severity: 'warning' })) },
        ],
        actionItems: [],
        decisionsNeeded: [],
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
          content: `You are running a comprehensive weekly capacity review. Analyze the full dataset and produce a structured review that could replace a weekly capacity meeting.

${contextText}

Respond with ONLY valid JSON:
{
  "review": {
    "generatedAt": "${new Date().toISOString()}",
    "summary": "string (3-4 sentence executive summary)",
    "sections": [
      {
        "title": "Project Status Update",
        "items": [{"text": "string", "severity": "good|warning|critical|info", "project": "string (optional)"}]
      },
      {
        "title": "Resource Health Check",
        "items": [{"text": "string", "severity": "good|warning|critical|info", "resource": "string (optional)"}]
      },
      {
        "title": "Burnout Risk Assessment",
        "items": [{"text": "string", "severity": "good|warning|critical", "resource": "string (optional)"}]
      },
      {
        "title": "Optimization Opportunities",
        "items": [{"text": "string", "severity": "info", "impact": "string (optional)"}]
      },
      {
        "title": "Risk & Dependency Watch",
        "items": [{"text": "string", "severity": "warning|critical"}]
      }
    ],
    "actionItems": [{"text": "string", "owner": "string", "priority": "high|medium|low", "dueBy": "string"}],
    "decisionsNeeded": [{"text": "string", "context": "string", "options": ["string"]}]
  }
}`
        },
        { role: 'user', content: 'Run the weekly capacity review analysis.' },
      ],
      temperature: 0.5,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: 'AI service error', details: (error as Error).message }, { status: 500 });
  }
}
