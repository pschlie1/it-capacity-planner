'use client';
import { csrfFetch } from '@/lib/csrf-client';
import { useState } from 'react';
import { Sparkles, Loader2, Zap, Users, UserPlus, DollarSign, Check, ArrowRight } from 'lucide-react';

interface Recommendation {
  id: string; type: string; title: string; description: string;
  impact: string; confidence: string;
  actions?: { label: string; actionType: string; params: Record<string, unknown> }[];
}

const TABS = [
  { id: 'portfolio', label: 'Portfolio', icon: <Zap className="w-4 h-4" />, desc: 'Optimize project priority ordering' },
  { id: 'resource', label: 'Resources', icon: <Users className="w-4 h-4" />, desc: 'Rebalance resource allocations' },
  { id: 'hiring', label: 'Hiring', icon: <UserPlus className="w-4 h-4" />, desc: 'Identify hiring needs' },
  { id: 'cost', label: 'Cost', icon: <DollarSign className="w-4 h-4" />, desc: 'Optimize costs' },
];

export default function AiOptimizer({ onRefresh }: { onRefresh?: () => void }) {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState('');
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const runOptimization = async (type: string) => {
    setActiveTab(type);
    setLoading(true);
    setRecommendations([]);
    setSummary('');
    try {
      const res = await csrfFetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      setRecommendations(data.recommendations || []);
      setSummary(data.summary || '');
    } catch {}
    setLoading(false);
  };

  const CONF_COLORS: Record<string, string> = {
    high: 'bg-green-500/20 text-green-400',
    medium: 'bg-amber-500/20 text-amber-400',
    low: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => runOptimization(tab.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeTab === tab.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30 bg-muted/30'
            }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}>{tab.icon}</span>
              <span className="text-sm font-medium">{tab.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{tab.desc}</p>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground animate-pulse">Running AI optimization analysis...</p>
          </div>
        </div>
      )}

      {!loading && summary && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary font-medium">AI Summary</span>
          </div>
          <p className="text-sm">{summary}</p>
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <div key={rec.id || i} className="border border-border rounded-xl p-4 bg-card hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{rec.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${CONF_COLORS[rec.confidence] || 'bg-muted'}`}>
                      {rec.confidence} confidence
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3 h-3 text-primary" />
                  <span className="text-xs text-primary font-medium">{rec.impact}</span>
                </div>
                {appliedIds.has(rec.id) ? (
                  <span className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs flex items-center gap-1">
                    <Check className="w-3 h-3" /> Applied
                  </span>
                ) : (
                  <button onClick={() => { setAppliedIds(prev => { const n = new Set(Array.from(prev)); n.add(rec.id); return n; }); onRefresh?.(); }}
                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs">
                    Apply Recommendation
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && recommendations.length === 0 && !summary && (
        <div className="text-center py-16 text-muted-foreground">
          <Zap className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">AI Optimization Engine</p>
          <p className="text-sm mt-1">Select an optimization type above to get AI-powered recommendations</p>
        </div>
      )}
    </div>
  );
}
