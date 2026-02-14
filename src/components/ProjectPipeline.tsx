'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight, DollarSign, User, Clock, Filter,
  RefreshCw, ChevronRight,
} from 'lucide-react';

interface PipelineProject {
  id: string;
  name: string;
  priority: number;
  workflowStatus: string;
  sponsor: string | null;
  estimatedCost: number | null;
  estimatedWeeks: number | null;
  teamSizeRecommended: number | null;
  capexAmount: number | null;
  opexAmount: number | null;
  testingModel: string | null;
  category: string | null;
  teamEstimates: Array<{ team: { name: string }; devHours: number }>;
}

const STAGES = [
  { key: 'submitted', label: 'Submitted', color: 'border-slate-500' },
  { key: 'estimating', label: 'Estimating', color: 'border-blue-500' },
  { key: 'estimated', label: 'Estimated', color: 'border-purple-500' },
  { key: 'cost_review', label: 'Cost Review', color: 'border-amber-500' },
  { key: 'approved', label: 'Approved', color: 'border-green-500' },
  { key: 'prioritized', label: 'Prioritized', color: 'border-cyan-500' },
  { key: 'in_progress', label: 'In Progress', color: 'border-emerald-500' },
  { key: 'completed', label: 'Completed', color: 'border-green-600' },
];

const NEXT_STATUS: Record<string, string> = {
  submitted: 'estimating',
  estimating: 'estimated',
  estimated: 'cost_review',
  cost_review: 'approved',
  approved: 'prioritized',
  prioritized: 'in_progress',
  in_progress: 'completed',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

interface Props {
  onSelectProject: (id: string) => void;
}

export default function ProjectPipeline({ onSelectProject }: Props) {
  const [projects, setProjects] = useState<PipelineProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterSponsor, setFilterSponsor] = useState('all');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/projects');
    if (res.ok) {
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const advanceWorkflow = async (projectId: string, currentStatus: string) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    if (!confirm(`Advance to "${STAGES.find(s => s.key === next)?.label}"?`)) return;

    const res = await fetch(`/api/projects/${projectId}/workflow`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });

    if (res.ok) {
      fetchProjects();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to advance workflow');
    }
  };

  const sponsors = Array.from(new Set(projects.map(p => p.sponsor).filter(Boolean))) as string[];
  const teamNames = Array.from(new Set(projects.flatMap(p => p.teamEstimates.map(te => te.team.name))));

  const filtered = projects.filter(p => {
    if (filterSponsor !== 'all' && p.sponsor !== filterSponsor) return false;
    if (filterTeam !== 'all' && !p.teamEstimates.some(te => te.team.name === filterTeam)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Filter className="w-3 h-3" /> Filters:
        </div>
        <select value={filterSponsor} onChange={e => setFilterSponsor(e.target.value)}
          className="px-2 py-1.5 text-xs rounded-lg bg-muted border border-border">
          <option value="all">All Sponsors</option>
          {sponsors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
          className="px-2 py-1.5 text-xs rounded-lg bg-muted border border-border">
          <option value="all">All Teams</option>
          {teamNames.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} projects</span>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map(stage => {
            const stageProjects = filtered
              .filter(p => p.workflowStatus === stage.key)
              .sort((a, b) => a.priority - b.priority);

            return (
              <div key={stage.key} className="w-64 flex-shrink-0">
                <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${stage.color}`}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider">{stage.label}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted">{stageProjects.length}</span>
                </div>

                <div className="space-y-2">
                  {stageProjects.map(project => (
                    <Card key={project.id} className="hover:border-primary/30 transition-colors cursor-pointer">
                      <CardContent className="pt-3 pb-3 px-3">
                        <div onClick={() => onSelectProject(project.id)}>
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                                  {project.priority}
                                </span>
                                <h4 className="text-xs font-medium truncate">{project.name}</h4>
                              </div>
                            </div>
                          </div>

                          {project.sponsor && (
                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                              <User className="w-3 h-3" /> {project.sponsor}
                            </div>
                          )}

                          {project.estimatedCost != null && (
                            <div className="flex items-center gap-1 mt-1 text-[10px]">
                              <DollarSign className="w-3 h-3 text-green-400" />
                              <span className="text-green-400 font-medium">{fmt(project.estimatedCost)}</span>
                            </div>
                          )}

                          {project.estimatedWeeks != null && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3" /> {project.estimatedWeeks}w
                              {project.teamSizeRecommended && ` · ${project.teamSizeRecommended} devs`}
                            </div>
                          )}

                          {project.category && (
                            <span className="inline-block mt-1.5 text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {project.category}
                            </span>
                          )}
                        </div>

                        {/* Advance button */}
                        {NEXT_STATUS[stage.key] && (
                          <button
                            onClick={(e) => { e.stopPropagation(); advanceWorkflow(project.id, stage.key); }}
                            className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <ArrowRight className="w-3 h-3" />
                            {STAGES.find(s => s.key === NEXT_STATUS[stage.key])?.label}
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {stageProjects.length === 0 && (
                    <div className="text-center py-8 text-[10px] text-muted-foreground border border-dashed border-border rounded-lg">
                      No projects
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
