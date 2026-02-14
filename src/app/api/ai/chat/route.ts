import { NextResponse } from 'next/server';
import { buildAIContext } from '@/lib/ai-context';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import * as projectService from '@/lib/services/projects';
import * as scenarioService from '@/lib/services/scenarios';
import { validateBody, checkRateLimit, getRateLimitResponse, safeErrorResponse, getClientIp } from '@/lib/api-utils';
import { aiChatSchema } from '@/lib/schemas';
import OpenAI from 'openai';

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'adjust_project_priority',
      description: 'Change a project priority',
      parameters: { type: 'object', properties: { projectName: { type: 'string' }, newPriority: { type: 'number' } }, required: ['projectName', 'newPriority'] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_project_status',
      description: 'Change a project status',
      parameters: { type: 'object', properties: { projectName: { type: 'string' }, status: { type: 'string', enum: ['not_started', 'in_planning', 'active', 'on_hold', 'complete', 'cancelled'] } }, required: ['projectName', 'status'] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_scenario',
      description: 'Create a new what-if scenario',
      parameters: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } }, required: ['name'] }
    }
  },
];

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) return getRateLimitResponse();

  const validated = await validateBody(req, aiChatSchema);
  if ('error' in validated) return validated.error;
  const clientMessages = validated.data.messages;

  const orgId = (auth as any).orgId as string;
  const userId = (auth as any).user.id as string;
  const { contextText, data } = await buildAIContext(orgId);

  async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
    const projects = data.projects;
    if (name === 'adjust_project_priority') {
      const proj = projects.find((p: any) => p.name.toLowerCase().includes((args.projectName as string).toLowerCase()));
      if (!proj) return `Project "${args.projectName}" not found`;
      await projectService.updateProject(orgId, userId, proj.id, { priority: args.newPriority as number });
      return `Updated ${proj.name} priority to ${args.newPriority}`;
    }
    if (name === 'update_project_status') {
      const proj = projects.find((p: any) => p.name.toLowerCase().includes((args.projectName as string).toLowerCase()));
      if (!proj) return `Project "${args.projectName}" not found`;
      await projectService.updateProject(orgId, userId, proj.id, { status: args.status as string });
      return `Updated ${proj.name} status to ${args.status}`;
    }
    if (name === 'create_scenario') {
      const scenario = await scenarioService.createScenario(orgId, userId, { name: args.name as string });
      return `Created scenario "${args.name}" (id: ${scenario?.id})`;
    }
    return 'Unknown tool';
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      response: `**Demo Mode** — Set OPENAI_API_KEY. ${data.projects.length} projects across ${data.teams.length} teams.`,
      suggestions: ['What are the top risks?', 'Show team utilization', 'Which projects are over capacity?']
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const systemMsg = {
      role: 'system' as const,
      content: `You are an expert IT capacity planning analyst. Provide actionable, data-driven insights. Use markdown. Always suggest 2-3 follow-up questions (prefix with "💡 "). You can use tools to modify data.\n\n${contextText}`
    };

    const messages = [systemMsg, ...clientMessages];
    
    let completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools: TOOLS,
      temperature: 0.7,
      max_tokens: 3000,
    });

    let assistantMessage = completion.choices[0].message;
    
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [assistantMessage as any];
      for (const tc of assistantMessage.tool_calls) {
        const tcAny = tc as any;
        const args = JSON.parse(tcAny.function.arguments);
        const result = await executeTool(tcAny.function.name, args);
        toolResults.push({ role: 'tool' as const, tool_call_id: tcAny.id, content: result });
      }
      
      completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [...messages, ...toolResults],
        tools: TOOLS,
        temperature: 0.7,
        max_tokens: 3000,
      });
      assistantMessage = completion.choices[0].message;
    }

    const content = assistantMessage.content || '';
    const suggestions = content.match(/💡\s*(.+)/g)?.map((s: string) => s.replace(/💡\s*/, '').replace(/\*\*/g, '').trim()).slice(0, 3) || [];

    return NextResponse.json({ response: content, suggestions });
  } catch (error: unknown) {
    return safeErrorResponse(error, 'AI chat');
  }
}
