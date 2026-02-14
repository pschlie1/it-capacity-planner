import { requireAuth, isAuthError } from '@/lib/api-auth';
import { validateBody, checkRateLimit, getRateLimitResponse, safeErrorResponse, getClientIp } from '@/lib/api-utils';
import { aiScenarioSchema } from '@/lib/schemas';
import { NextResponse } from 'next/server';
import { buildAIContext } from '@/lib/ai-context';
import OpenAI from 'openai';

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) return getRateLimitResponse();

  const validated = await validateBody(req, aiScenarioSchema);
  if ('error' in validated) return validated.error;
  const { description } = validated.data;
  const { contextText, data } = await buildAIContext(auth.orgId);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      scenario: {
        name: 'Demo Scenario',
        description: description,
        changes: [{ type: 'info', description: 'Set OPENAI_API_KEY for real scenario generation' }],
      }
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const teamIds = data.teams.map(t => ({ id: t.id, name: t.name }));
    const projectIds = data.projects.map(p => ({ id: p.id, name: p.name, priority: p.priority }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You parse natural language scenario descriptions into structured changes. 

TEAMS: ${JSON.stringify(teamIds)}
PROJECTS: ${JSON.stringify(projectIds)}

${contextText}

Respond with ONLY valid JSON:
{
  "scenario": {
    "name": "string (short descriptive name)",
    "description": "string",
    "changes": [
      {
        "type": "hire|defer|reprioritize|contractor|reassign|cancel",
        "description": "string",
        "params": {
          "teamId": "string (optional)",
          "teamName": "string (optional)",
          "projectId": "string (optional)",
          "projectName": "string (optional)",
          "role": "string (optional)",
          "count": "number (optional)",
          "newPriority": "number (optional)",
          "fte": "number (optional)",
          "weeks": "number (optional)",
          "seniority": "string (optional)"
        }
      }
    ],
    "expectedImpact": "string (summary of expected capacity impact)"
  }
}`
        },
        { role: 'user', content: description },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: 'AI service error', details: (error as Error).message }, { status: 500 });
  }
}
