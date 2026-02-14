'use client';
import { useState } from 'react';
import { Sparkles, Loader2, FileText, Download, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface BriefingSection {
  title: string;
  content: string;
}

interface KeyMetric {
  label: string; value: string; trend: string; status: string;
}

interface Briefing {
  generatedAt: string;
  sections: BriefingSection[];
  keyMetrics?: KeyMetric[];
}

export default function AiBriefing() {
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/briefing', { method: 'POST' });
      const data = await res.json();
      setBriefing(data.briefing);
    } catch {}
    setLoading(false);
  };

  const STATUS_COLORS: Record<string, string> = {
    good: 'text-green-400 border-green-500/30',
    warning: 'text-amber-400 border-amber-500/30',
    critical: 'text-red-400 border-red-500/30',
  };

  const TREND_ICONS: Record<string, JSX.Element> = {
    up: <ArrowUp className="w-3 h-3" />,
    down: <ArrowDown className="w-3 h-3" />,
    stable: <Minus className="w-3 h-3" />,
  };

  return (
    <div className="space-y-6">
      {!briefing && !loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary opacity-60" />
          </div>
          <p className="text-lg font-medium">Executive Capacity Briefing</p>
          <p className="text-sm text-muted-foreground mt-1">AI generates a board-ready briefing from your live capacity data</p>
          <button onClick={generate}
            className="mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto">
            <Sparkles className="w-4 h-4" /> Generate Briefing
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground animate-pulse">Generating executive briefing...</p>
          </div>
        </div>
      )}

      {briefing && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary">AI-Generated Briefing</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Generated {new Date(briefing.generatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={generate}
                className="px-3 py-1.5 rounded-lg bg-muted border border-border hover:bg-muted/80 transition-colors text-xs">
                Regenerate
              </button>
              <button onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs flex items-center gap-1">
                <Download className="w-3 h-3" /> Export
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          {briefing.keyMetrics && briefing.keyMetrics.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {briefing.keyMetrics.map((m, i) => (
                <div key={i} className={`p-3 rounded-xl border ${STATUS_COLORS[m.status] || 'border-border'} bg-card`}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-bold">{m.value}</span>
                    {TREND_ICONS[m.trend]}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sections */}
          {briefing.sections.map((section, i) => (
            <div key={i} className="border border-border rounded-xl p-5 bg-card">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                {section.title}
              </h3>
              <div className="prose prose-sm prose-invert max-w-none text-sm text-muted-foreground" dangerouslySetInnerHTML={{
                __html: section.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                  .replace(/\n/g, '<br/>')
                  .replace(/^- /gm, '• ')
              }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
