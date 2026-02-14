import { validateCsrf } from '@/lib/csrf';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { buildAIContext } from '@/lib/ai-context';
import { validateBody, checkRateLimit, getRateLimitResponse, safeErrorResponse, getClientIp } from '@/lib/api-utils';
import { aiForecastSchema } from '@/lib/schemas';
import OpenAI from 'openai';

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const csrfError = await validateCsrf(req);
  if (csrfError) return csrfError;
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) return getRateLimitResponse();

  const validated = await validateBody(req, aiForecastSchema);
  if ('error' in validated) return validated.error;
  const { type, resourceName } = validated.data;
  const { contextText, data } = await buildAIContext(auth.orgId);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      forecast: {
        type,
        insights: [{ title: 'Demo Mode', description: 'Set OPENAI_API_KEY for real forecasting.', severity: 'info' }],
      }
    });
  }

  const prompts: Record<string, string> = {
    risk: `Analyze each project's risk of delay. Consider complexity, team utilization, skill coverage, dependency chains, and committed dates. For each at-risk project, provide a delay probability percentage and reasoning.`,
    crunch: `Look 3-6 months ahead and identify specific weeks/months where demand will exceed supply by role and skill. Be specific about which teams and roles will be crunched.`,
    attrition: resourceName
      ? `Analyze: What happens if ${resourceName} leaves the organization? Consider their project assignments, unique skills, and which projects would be impacted. Provide a mitigation plan.`
      : `Identify the top 5 most critical resources whose departure would have the biggest impact. For each, analyze the project impact, skill loss, and mitigation options.`,
    trend: `Based on current velocity, allocation patterns, and project timelines, predict which projects will slip and by how much. Identify patterns that indicate systemic issues.`,
  };

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an IT capacity forecasting and risk analysis expert.

${contextText}

Respond with ONLY valid JSON:
{
  "forecast": {
    "type": "${type}",
    "summary": "string",
    "insights": [
      {
        "title": "string",
        "description": "string (detailed)",
        "severity": "critical|warning|info",
        "affectedProjects": ["string"],
        "affectedResources": ["string"],
        "probability": "string (e.g. '75%')",
        "mitigationOptions": ["string"]
      }
    ]
  }
}`
        },
        { role: 'user', content: prompts[type] || prompts.risk },
      ],
      temperature: 0.6,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json(result);
  } catch (error: unknown) {
    return safeErrorResponse(error, 'AI forecast');
  }
}
