import { validateCsrf } from '@/lib/csrf';
import { validateBody, checkRateLimit, getRateLimitResponse, safeErrorResponse, getClientIp } from '@/lib/api-utils';
import { aiMessageSchema } from '@/lib/schemas';
import { NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
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

  const body = await req.json();
  const message = body.message;

  const { contextText, data } = await buildAIContext(auth.orgId);
  const { allocations, teamCapacities } = data;
  const feasibleProjects = allocations.filter((a: any) => a.feasible);
  const infeasibleProjects = allocations.filter((a: any) => !a.feasible);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      response: `**AI Analysis (Demo Mode)**\n\n${data.teams.length} teams, ${feasibleProjects.length}/${data.projects.length} projects feasible. Set OPENAI_API_KEY for full analysis.`,
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an expert IT capacity planning analyst. Provide actionable, data-driven insights. Be concise but thorough. Use markdown.\n\n${contextText}` },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return NextResponse.json({ response: completion.choices[0].message.content });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'AI');
  }
}
