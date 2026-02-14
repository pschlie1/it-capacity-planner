import { validateCsrf } from '@/lib/csrf';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { validateBody, checkRateLimit, getRateLimitResponse, safeErrorResponse, getClientIp } from '@/lib/api-utils';
import { aiIntakeSchema } from '@/lib/schemas';
import { NextResponse } from 'next/server';
import { buildAIContext } from '@/lib/ai-context';
import OpenAI from 'openai';

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  const csrfError = await validateCsrf(req);
  if (csrfError) return csrfError;
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) return getRateLimitResponse();

  const validated = await validateBody(req, aiIntakeSchema);
  if ('error' in validated) return validated.error;
  const { description } = validated.data;
  const { contextText, data } = await buildAIContext(auth.orgId);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Demo mode - return a sample project
    return NextResponse.json({
      project: {
        name: 'AI-Generated Project (Demo)',
        description: description || 'Demo project',
        category: 'Digital Transformation',
        tshirtSize: 'M',
        businessValue: 'high',
        riskLevel: 'medium',
        riskNotes: 'Set OPENAI_API_KEY to get real AI analysis',
        sponsor: 'TBD',
        quarterTarget: 'Q3 2026',
        requiredSkills: ['React', 'TypeScript'],
        teamEstimates: data.teams.slice(0, 2).map(t => ({
          teamId: t.id, teamName: t.name,
          design: 40, development: 160, testing: 60, deployment: 24, postDeploy: 16,
        })),
        suggestedPriority: data.projects.length + 1,
        estimatedDuration: '16 weeks',
        riskAssessment: 'Medium risk - standard complexity project',
        resourceRecommendations: [],
      }
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const teamIds = data.teams.map(t => ({ id: t.id, name: t.name, skills: t.skills }));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an IT capacity planning expert. Given a project description, generate a complete project record based on the organization's current data.

AVAILABLE TEAMS (use these exact IDs):
${JSON.stringify(teamIds, null, 2)}

CURRENT CONTEXT:
${contextText}

Respond with ONLY valid JSON (no markdown, no code fences) matching this schema:
{
  "name": "string",
  "description": "string (2-3 sentences)",
  "category": "string (one of: Digital Transformation, ERP Modernization, Data & AI, Security & Compliance, Architecture, Tech Debt, Infrastructure, CRM, Supply Chain, IT Operations)",
  "tshirtSize": "S|M|L|XL",
  "businessValue": "critical|high|medium|low",
  "riskLevel": "high|medium|low",
  "riskNotes": "string (specific risk factors)",
  "sponsor": "string (appropriate C-level/VP)",
  "quarterTarget": "string (e.g. Q3 2026)",
  "requiredSkills": ["string"],
  "teamEstimates": [{"teamId": "string", "teamName": "string", "design": number, "development": number, "testing": number, "deployment": number, "postDeploy": number}],
  "suggestedPriority": number,
  "estimatedDuration": "string",
  "riskAssessment": "string (detailed reasoning)",
  "resourceRecommendations": [{"resourceName": "string", "role": "string", "reason": "string", "allocationPct": number}]
}`
        },
        { role: 'user', content: description },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return NextResponse.json({ project: result });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'AI service error', details: (error as Error).message }, { status: 500 });
  }
}
