'use client';
import { useState } from 'react';
import { Sparkles, Loader2, Plus, Edit2, Check } from 'lucide-react';

interface TeamEstimate {
  teamId: string; teamName: string;
  design: number; development: number; testing: number; deployment: number; postDeploy: number;
}

interface GeneratedProject {
  name: string; description: string; category: string; tshirtSize: string;
  businessValue: string; riskLevel: string; riskNotes: string; sponsor: string;
  quarterTarget: string; requiredSkills: string[]; teamEstimates: TeamEstimate[];
  suggestedPriority: number; estimatedDuration: string; riskAssessment: string;
  resourceRecommendations: { resourceName: string; role: string; reason: string; allocationPct: number }[];
}

export default function AiIntake({ onProjectAdded }: { onProjectAdded?: () => void }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<GeneratedProject | null>(null);
  const [added, setAdded] = useState(false);

  const generate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setProject(null);
    setAdded(false);
    try {
      const res = await fetch('/api/ai/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      setProject(data.project);
    } catch {
      setProject(null);
    }
    setLoading(false);
  };

  const addToPortfolio = async () => {
    if (!project) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          category: project.category,
          tshirtSize: project.tshirtSize,
          businessValue: project.businessValue,
          riskLevel: project.riskLevel,
          riskNotes: project.riskNotes,
          sponsor: project.sponsor,
          quarterTarget: project.quarterTarget,
          requiredSkills: project.requiredSkills,
          priority: project.suggestedPriority,
          status: 'in_planning',
          startWeekOffset: 0,
          teamEstimates: project.teamEstimates?.map(te => ({
            teamId: te.teamId,
            design: te.design, development: te.development,
            testing: te.testing, deployment: te.deployment, postDeploy: te.postDeploy,
          })),
        }),
      });
      if (res.ok) {
        setAdded(true);
        onProjectAdded?.();
      }
    } catch {}
  };

  const BV_COLORS: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400', high: 'bg-amber-500/20 text-amber-400',
    medium: 'bg-blue-500/20 text-blue-400', low: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="w-4 h-4 text-primary" /> Describe your project in natural language
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="We need to migrate our on-prem data warehouse to Snowflake. It'll involve the Data team heavily, some InfraOps work, and Security review. Medium complexity, targeting Q3."
          className="w-full h-32 px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          disabled={loading} />
        <button onClick={generate} disabled={loading || !description.trim()}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Project</>}
        </button>
      </div>

      {/* Generated Project */}
      {project && (
        <div className="space-y-4 border border-primary/20 rounded-xl p-5 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs text-primary">AI-Generated Project</span>
            </div>
            {!added ? (
              <button onClick={addToPortfolio}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Add to Portfolio
              </button>
            ) : (
              <span className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 flex items-center gap-2 text-sm">
                <Check className="w-4 h-4" /> Added!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{project.name}</h3>
              <p className="text-sm text-muted-foreground">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded text-xs bg-muted">{project.category}</span>
                <span className="px-2 py-1 rounded text-xs bg-muted">Size: {project.tshirtSize}</span>
                <span className={`px-2 py-1 rounded text-xs ${BV_COLORS[project.businessValue] || 'bg-muted'}`}>Value: {project.businessValue}</span>
                <span className={`px-2 py-1 rounded text-xs ${project.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' : project.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>Risk: {project.riskLevel}</span>
              </div>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p><strong>Sponsor:</strong> {project.sponsor}</p>
                <p><strong>Target:</strong> {project.quarterTarget}</p>
                <p><strong>Duration:</strong> {project.estimatedDuration}</p>
                <p><strong>Suggested Priority:</strong> #{project.suggestedPriority}</p>
                <p><strong>Skills:</strong> {project.requiredSkills?.join(', ')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Team Hour Estimates</h4>
              <div className="space-y-2">
                {project.teamEstimates?.map((te, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-2 text-xs">
                    <p className="font-medium mb-1">{te.teamName}</p>
                    <div className="grid grid-cols-5 gap-1 text-muted-foreground">
                      <span>Design: {te.design}h</span>
                      <span>Dev: {te.development}h</span>
                      <span>Test: {te.testing}h</span>
                      <span>Deploy: {te.deployment}h</span>
                      <span>Post: {te.postDeploy}h</span>
                    </div>
                    <p className="text-muted-foreground mt-1">Total: {te.design + te.development + te.testing + te.deployment + te.postDeploy}h</p>
                  </div>
                ))}
              </div>
              
              {project.riskAssessment && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Risk Assessment</h4>
                  <p className="text-xs text-muted-foreground">{project.riskAssessment}</p>
                </div>
              )}

              {project.resourceRecommendations?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Recommended Resources</h4>
                  {project.resourceRecommendations.map((r, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      • <strong>{r.resourceName}</strong> as {r.role} ({r.allocationPct}%) — {r.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
