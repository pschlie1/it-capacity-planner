'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronRight, DollarSign, Clock, Users, ArrowRight } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  priority: number;
  workflowStatus?: string;
  sponsor?: string;
  category?: string;
  estimatedCost?: number | null;
  estimatedWeeks?: number | null;
  teamSizeRecommended?: number | null;
  tshirtSize?: string | null;
}

const WORKFLOW_STAGES = [
  { key: 'submitted', label: 'Submitted', color: 'border-slate-500', bg: 'bg-slate-500/10', badge: 'bg-slate-600' },
  { key: 'estimating', label: 'Estimating', color: 'border-amber-500', bg: 'bg-amber-500/10', badge: 'bg-amber-600' },
  { key: 'estimated', label: 'Estimated', color: 'border-blue-500', bg: 'bg-blue-500/10', badge: 'bg-blue-600' },
  { key: 'cost_review', label: 'Cost Review', color: 'border-purple-500', bg: 'bg-purple-500/10', badge: 'bg-purple-600' },
  { key: 'approved', label: 'Approved', color: 'border-emerald-500', bg: 'bg-emerald-500/10', badge: 'bg-emerald-600' },
  { key: 'prioritized', label: 'Prioritized', color: 'border-cyan-500', bg: 'bg-cyan-500/10', badge: 'bg-cyan-600' },
  { key: 'in_progress', label: 'In Progress', color: 'border-orange-500', bg: 'bg-orange-500/10', badge: 'bg-orange-600' },
  { key: 'completed', label: 'Completed', color: 'border-green-500', bg: 'bg-green-500/10', badge: 'bg-green-600' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export default function ProjectPipeline({
  projects,
  onSelectProject,
  onAdvanceWorkflow,
}: {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onAdvanceWorkflow: (id: string, newStatus: string) => void;
}) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const getNextStatus = (current: string): string | null => {
    const idx = WORKFLOW_STAGES.findIndex((s) => s.key === current);
    if (idx >= 0 && idx < WORKFLOW_STAGES.length - 1) return WORKFLOW_STAGES[idx + 1].key;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 overflow-x-auto pb-2">
        {WORKFLOW_STAGES.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-1 shrink-0">
            <span className={`px-2 py-0.5 rounded text-white text-xs ${stage.badge}`}>{stage.label}</span>
            {i < WORKFLOW_STAGES.length - 1 && <ChevronRight className="h-3 w-3" />}
          </div>
        ))}
      </div>

      {WORKFLOW_STAGES.map((stage) => {
        const stageProjects = projects.filter((p) => (p.workflowStatus || 'submitted') === stage.key);
        if (stageProjects.length === 0) return null;

        return (
          <Card key={stage.key} className={`border-l-4 ${stage.color}`}>
            <CardHeader
              className="cursor-pointer py-3"
              onClick={() => setExpandedStage(expandedStage === stage.key ? null : stage.key)}
            >
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{stage.label} ({stageProjects.length})</span>
                {stageProjects.length > 0 && stage.key !== 'submitted' && (
                  <span className="text-xs text-muted-foreground font-normal">
                    {formatCurrency(stageProjects.reduce((s, p) => s + (p.estimatedCost || 0), 0))} total
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {stageProjects.sort((a, b) => a.priority - b.priority).map((project) => {
                  const nextStatus = getNextStatus(stage.key);
                  return (
                    <div
                      key={project.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${stage.bg} hover:opacity-90 transition-opacity cursor-pointer`}
                      onClick={() => onSelectProject(project.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">P{project.priority}</span>
                          <span className="font-medium text-sm truncate">{project.name}</span>
                          {project.tshirtSize && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">{project.tshirtSize}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {project.sponsor && <span>{project.sponsor}</span>}
                          {project.estimatedCost != null && project.estimatedCost > 0 && (
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(project.estimatedCost)}</span>
                          )}
                          {project.estimatedWeeks != null && project.estimatedWeeks > 0 && (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{project.estimatedWeeks}w</span>
                          )}
                          {project.teamSizeRecommended != null && project.teamSizeRecommended > 0 && (
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{project.teamSizeRecommended}</span>
                          )}
                        </div>
                      </div>
                      {nextStatus && (
                        <button
                          className="ml-2 p-1.5 rounded hover:bg-white/10 transition-colors shrink-0"
                          title={`Advance to ${WORKFLOW_STAGES.find((s) => s.key === nextStatus)?.label}`}
                          onClick={(e) => { e.stopPropagation(); onAdvanceWorkflow(project.id, nextStatus); }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {projects.length === 0 && (
        <div className="text-center text-muted-foreground py-12">No projects in pipeline</div>
      )}
    </div>
  );
}
