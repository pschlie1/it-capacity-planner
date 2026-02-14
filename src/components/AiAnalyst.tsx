'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

const QUICK_PROMPTS = [
  { label: 'Bottleneck Analysis', prompt: 'What are the current capacity bottlenecks across all teams? Identify the most constrained teams and roles.' },
  { label: 'Red Line Analysis', prompt: 'Which projects fall below the red line and why? What would it take to make them feasible?' },
  { label: 'Executive Summary', prompt: 'Generate a board-ready executive summary of our IT capacity position for the next 12 months.' },
  { label: 'Optimization', prompt: 'How should we staff to maximize the number of projects delivered within the 12-month window?' },
  { label: 'Risk Assessment', prompt: 'What are the biggest capacity risks? Which teams are at risk of burnout or overcommitment?' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiAnalyst() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.error || 'No response' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to AI service. Please check your API key configuration.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_PROMPTS.map(qp => (
          <button
            key={qp.label}
            onClick={() => sendMessage(qp.prompt)}
            disabled={loading}
            className="px-3 py-1.5 text-xs rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <Sparkles className="inline w-3 h-3 mr-1" />
            {qp.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Sparkles className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">AI Capacity Analyst</p>
            <p className="text-sm mt-1">Ask questions about your IT capacity data</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}>
              <div className="whitespace-pre-wrap prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{
                __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
                  .replace(/- /g, '• ')
              }} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about capacity, bottlenecks, scenarios..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
