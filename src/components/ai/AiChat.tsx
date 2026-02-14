'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, RotateCcw, Zap } from 'lucide-react';

const QUICK_PROMPTS = [
  { label: 'Top 3 Risks', prompt: 'What are the top 3 risks to our portfolio right now?' },
  { label: 'Defer to Fix Overalloc', prompt: 'Which projects should we defer to reduce over-allocation?' },
  { label: 'Executive Summary', prompt: 'Generate a board-ready executive summary of our IT capacity position.' },
  { label: 'Critical Resource Loss', prompt: 'What would happen if we lost our most critical resource?' },
  { label: 'Maximize Q4 Delivery', prompt: 'How should we staff to deliver the most projects by Q4?' },
  { label: 'Skill Gaps', prompt: 'Where are our biggest skill gaps?' },
  { label: 'Burnout Risk', prompt: 'Which teams are at burnout risk?' },
  { label: 'Current vs Optimized', prompt: 'Compare our current plan vs what an optimized scenario would look like.' },
  { label: 'Contractor Recs', prompt: 'What contractors should we hire and for how long?' },
  { label: 'Monthly Changes', prompt: 'Summarize the current capacity situation and key changes to watch.' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setSuggestions([]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.error || 'No response' }]);
      if (data.suggestions?.length) setSuggestions(data.suggestions);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to AI service.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px]">
      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Quick Prompts</p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            {QUICK_PROMPTS.map(qp => (
              <button key={qp.label} onClick={() => sendMessage(qp.prompt)} disabled={loading}
                className="px-3 py-2 text-xs rounded-lg border border-border bg-muted/30 text-left hover:bg-primary/10 hover:border-primary/30 transition-colors disabled:opacity-50">
                <Sparkles className="inline w-3 h-3 mr-1 text-primary" />{qp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary opacity-60" />
            </div>
            <p className="text-lg font-medium">AI Capacity Analyst</p>
            <p className="text-sm mt-1">Ask anything about your capacity data — or let AI take action</p>
            <p className="text-xs mt-3 text-muted-foreground/60">Powered by GPT-4o · Full dataset context · Tool use enabled</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
              msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
            }`}>
              {msg.role === 'assistant' && <div className="flex items-center gap-1 text-[10px] text-primary mb-1"><Sparkles className="w-3 h-3" /> AI Generated</div>}
              <div className="whitespace-pre-wrap prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
                  .replace(/^- /gm, '• ')
                  .replace(/\|(.+)\|/g, (m: string) => `<code>${m}</code>`)
              }} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground animate-pulse">Analyzing capacity data...</span>
            </div>
          </div>
        )}
      </div>

      {/* Follow-up Suggestions */}
      {suggestions.length > 0 && !loading && (
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => sendMessage(s)}
              className="px-3 py-1.5 text-xs rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
              💡 {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        {messages.length > 0 && (
          <button onClick={() => { setMessages([]); setSuggestions([]); }}
            className="px-3 py-2.5 rounded-xl bg-muted border border-border hover:bg-muted/80 transition-colors" title="New Chat">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about capacity, risks, optimization — or tell me to make changes..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          disabled={loading} />
        <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
