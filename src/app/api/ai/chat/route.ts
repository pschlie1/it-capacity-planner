import { NextResponse } from 'next/server';
import { buildAIContext } from '@/lib/ai-context';
import { createProject, getTeams, getTeamEstimates, updateProject, createScenario, setPriorityOverrides, addContractor, getProjects } from '@/lib/store';
import { createAssignment, getResources } from '@/lib/resource-store';
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

function executeTool(name: string, args: Record<string, unknown>): string {
  const projects = getProjects();
  if (name === 'adjust_project_priority') {
    const proj = projects.find(p => p.name.toLowerCase().includes((args.projectName as string).toLowerCase()));
    if (!proj) return `Project "${args.projectName}" not found`;
    updateProject(proj.id, { priority: args.newPriority as number });
    return `Updated ${proj.name} priority to ${args.newPriority}`;
  }
  if (name === 'update_project_status') {
    const proj = projects.find(p => p.name.toLowerCase().includes((args.projectName as string).toLowerCase()));
    if (!proj) return `Project "${args.projectName}" not found`;
    updateProject(proj.id, { status: args.status as string } as any);
    return `Updated ${proj.name} status to ${args.status}`;
  }
  if (name === 'create_scenario') {
    const scenario = createScenario({ name: args.name as string });
    return `Created scenario "${args.name}" (id: ${scenario.id})`;
  }
  return 'Unknown tool';
}

export async function POST(req: Request) {
  const { messages: clientMessages } = await req.json();
  const { contextText } = buildAIContext();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      response: '**Demo Mode** — Set OPENAI_API_KEY to enable full AI analysis. Current data shows ' +
        buildAIContext().data.projects.length + ' projects across ' + buildAIContext().data.teams.length + ' teams.',
      suggestions: ['What are the top risks?', 'Show team utilization', 'Which projects are over capacity?']
    });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const systemMsg = {
      role: 'system' as const,
      content: `You are an expert IT capacity planning analyst with deep knowledge of project management, resource allocation, and portfolio optimization. You have access to the organization's complete capacity planning data below. 

INSTRUCTIONS:
- Provide actionable, data-driven insights using specific numbers, names, and dates
- Format responses with markdown for readability
- When showing data, use tables or structured lists
- Always suggest 2-3 follow-up questions at the end (prefix with "💡 ")
- You can use tools to modify data when the user asks you to make changes
- Be concise but thorough

${contextText}`
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
    
    // Handle tool calls
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [assistantMessage as any];
      for (const tc of assistantMessage.tool_calls) {
        const tcAny = tc as any;
        const args = JSON.parse(tcAny.function.arguments);
        const result = executeTool(tcAny.function.name, args);
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

    // Extract suggestions from the response
    const content = assistantMessage.content || '';
    const suggestions = content.match(/💡\s*(.+)/g)?.map((s: string) => s.replace(/💡\s*/, '').replace(/\*\*/g, '').trim()).slice(0, 3) || [];

    return NextResponse.json({ response: content, suggestions });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'AI service error', details: (error as Error).message }, { status: 500 });
  }
}
