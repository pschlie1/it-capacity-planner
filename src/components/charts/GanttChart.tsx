'use client';

interface Allocation {
  projectName: string;
  priority: number;
  feasible: boolean;
  startWeek: number;
  endWeek: number;
  teamAllocations: {
    teamName: string;
    phases: { phase: string; startWeek: number; endWeek: number }[];
  }[];
}

const PHASE_COLORS: Record<string, string> = {
  design: '#8b5cf6',
  development: '#3b82f6',
  testing: '#f59e0b',
  deployment: '#22c55e',
  postDeploy: '#06b6d4',
};

const PHASE_LABELS: Record<string, string> = {
  design: 'Design',
  development: 'Dev',
  testing: 'Test',
  deployment: 'Deploy',
  postDeploy: 'Post',
};

export default function GanttChart({ data }: { data: Allocation[] }) {
  const maxWeek = 52;
  const sorted = [...data].sort((a, b) => a.priority - b.priority);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="flex items-center border-b border-border pb-2 mb-2">
          <div className="w-48 flex-shrink-0 text-xs font-medium text-muted-foreground px-2">Project / Team</div>
          <div className="flex-1 relative">
            <div className="flex">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground border-l border-border/50">
                  M{i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rows */}
        {sorted.map((alloc) => (
          <div key={alloc.projectName} className="mb-3">
            <div className="flex items-center mb-1">
              <div className="w-48 flex-shrink-0 px-2">
                <span className={`text-xs font-semibold ${alloc.feasible ? 'text-green-400' : 'text-red-400'}`}>
                  {alloc.priority}. {alloc.projectName}
                </span>
              </div>
              <div className="flex-1 relative h-1 bg-border/30 rounded">
                {/* 12-month boundary */}
                <div className="absolute right-0 top-0 bottom-0 w-px bg-red-500/50" />
              </div>
            </div>
            {alloc.teamAllocations.map((ta) => (
              <div key={ta.teamName} className="flex items-center mb-0.5">
                <div className="w-48 flex-shrink-0 px-2 pl-6">
                  <span className="text-[10px] text-muted-foreground">{ta.teamName}</span>
                </div>
                <div className="flex-1 relative h-5 bg-border/10 rounded">
                  {ta.phases.map((phase) => {
                    const left = (phase.startWeek / maxWeek) * 100;
                    const width = Math.max(((phase.endWeek - phase.startWeek + 1) / maxWeek) * 100, 1);
                    return (
                      <div
                        key={phase.phase}
                        className="absolute top-0.5 bottom-0.5 rounded-sm flex items-center justify-center overflow-hidden"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          backgroundColor: PHASE_COLORS[phase.phase] || '#6b7280',
                          opacity: 0.85,
                        }}
                        title={`${PHASE_LABELS[phase.phase]}: Week ${phase.startWeek}-${phase.endWeek}`}
                      >
                        <span className="text-[8px] text-white font-medium truncate px-0.5">
                          {width > 3 ? PHASE_LABELS[phase.phase] : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-3 border-t border-border">
          {Object.entries(PHASE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PHASE_COLORS[key] }} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
