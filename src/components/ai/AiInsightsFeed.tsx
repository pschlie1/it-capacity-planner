'use client';
import { useState, useEffect } from 'react';
import { Sparkles, Loader2, ChevronRight, RefreshCw } from 'lucide-react';

interface Insight {
  id: string; type: string; icon: string; title: string; description: string;
  actionable?: boolean; actionLabel?: string;
}

export default function AiInsightsFeed({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/insights');
      const data = await res.json();
      setInsights(data.insights || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchInsights(); }, []);

  const TYPE_STYLES: Record<string, string> = {
    critical: 'border-red-500/30 bg-red-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    opportunity: 'border-green-500/30 bg-green-500/5',
    info: 'border-blue-500/30 bg-blue-500/5',
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading insights...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI Insights</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{insights.length}</span>
        </div>
        <button onClick={fetchInsights} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {insights.slice(0, 8).map(insight => (
          <div key={insight.id} className={`border rounded-lg p-3 ${TYPE_STYLES[insight.type] || 'border-border bg-card'}`}>
            <div className="flex items-start gap-2">
              <span className="text-sm">{insight.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{insight.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>
                {insight.actionable && insight.actionLabel && (
                  <button onClick={() => onNavigate?.('ai')}
                    className="mt-1 text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    {insight.actionLabel} <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
