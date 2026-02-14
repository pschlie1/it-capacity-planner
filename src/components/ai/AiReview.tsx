'use client';
import { csrfFetch } from '@/lib/csrf-client';
import { useState } from 'react';
import { Sparkles, Loader2, PlayCircle, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

interface ReviewItem {
  text: string; severity: string; project?: string; resource?: string; impact?: string;
}

interface ActionItem {
  text: string; owner: string; priority: string; dueBy: string;
}

interface Decision {
  text: string; context: string; options: string[];
}

interface ReviewSection {
  title: string;
  items: ReviewItem[];
}

interface Review {
  generatedAt: string; summary: string;
  sections: ReviewSection[];
  actionItems: ActionItem[];
  decisionsNeeded: Decision[];
}

export default function AiReview() {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<Review | null>(null);

  const runReview = async () => {
    setLoading(true);
    try {
      const res = await csrfFetch('/api/ai/review', { method: 'POST' });
      const data = await res.json();
      setReview(data.review);
    } catch {}
    setLoading(false);
  };

  const SEV_ICONS: Record<string, JSX.Element> = {
    good: <CheckCircle2 className="w-4 h-4 text-green-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    critical: <XCircle className="w-4 h-4 text-red-400" />,
    info: <Info className="w-4 h-4 text-blue-400" />,
  };

  const PRIO_COLORS: Record<string, string> = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-amber-500/20 text-amber-400',
    low: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className="space-y-6">
      {!review && !loading && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="w-8 h-8 text-primary opacity-60" />
          </div>
          <p className="text-lg font-medium">Weekly Capacity Review</p>
          <p className="text-sm text-muted-foreground mt-1">AI scans all projects, resources, and risks to generate a comprehensive review</p>
          <button onClick={runReview}
            className="mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto">
            <Sparkles className="w-4 h-4" /> Run Weekly Review
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground animate-pulse">Running comprehensive capacity review...</p>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground/60">
              <p>• Scanning project status and delays...</p>
              <p>• Checking resource utilization...</p>
              <p>• Identifying optimization opportunities...</p>
              <p>• Generating action items...</p>
            </div>
          </div>
        </div>
      )}

      {review && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary">AI-Generated Review</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(review.generatedAt).toLocaleString()}
              </p>
            </div>
            <button onClick={runReview}
              className="px-3 py-1.5 rounded-lg bg-muted border border-border hover:bg-muted/80 transition-colors text-xs">
              Re-run
            </button>
          </div>

          {/* Summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm font-medium mb-1">Executive Summary</p>
            <p className="text-sm text-muted-foreground">{review.summary}</p>
          </div>

          {/* Sections */}
          {review.sections.map((section, i) => (
            <div key={i} className="border border-border rounded-xl p-4 bg-card">
              <h3 className="text-sm font-semibold mb-3">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    {SEV_ICONS[item.severity] || SEV_ICONS.info}
                    <span className="text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Action Items */}
          {review.actionItems?.length > 0 && (
            <div className="border border-border rounded-xl p-4 bg-card">
              <h3 className="text-sm font-semibold mb-3">📋 Action Items</h3>
              <div className="space-y-2">
                {review.actionItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${PRIO_COLORS[item.priority] || 'bg-muted'}`}>
                        {item.priority}
                      </span>
                      <span className="text-xs">{item.text}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {item.owner} · {item.dueBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decisions Needed */}
          {review.decisionsNeeded?.length > 0 && (
            <div className="border border-amber-500/20 rounded-xl p-4 bg-amber-500/5">
              <h3 className="text-sm font-semibold mb-3 text-amber-400">🤔 Decisions Needed</h3>
              <div className="space-y-3">
                {review.decisionsNeeded.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <p className="text-sm font-medium">{d.text}</p>
                    <p className="text-xs text-muted-foreground">{d.context}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {d.options?.map((opt, j) => (
                        <button key={j} className="px-3 py-1 rounded-lg border border-border hover:border-primary/30 text-xs bg-muted/30">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
