'use client';

interface Team { id: string; name: string; architectFte: number; developerFte: number; qaFte: number; devopsFte: number; businessAnalystFte: number; dbaFte: number; pmFte: number; }
interface TeamCapacity { teamId: string; teamName: string; roles?: Record<string, { fte: number; hoursPerWeek: number }>; }
interface Allocation {
  teamAllocations: { teamId: string; phases: { phase: string; startWeek: number; endWeek: number; hoursPerWeek: number[] }[] }[];
}

const PHASE_ROLE: Record<string, string> = { design: 'architect', development: 'developer', testing: 'qa', deployment: 'devops', postDeploy: 'devops' };
const ROLE_LABELS: Record<string, string> = { architect: 'Architect', developer: 'Developer', qa: 'QA', devops: 'DevOps', businessAnalyst: 'BA', dba: 'DBA', pm: 'PM' };
const ROLES = ['architect', 'developer', 'qa', 'devops', 'businessAnalyst', 'dba'];

function getColor(pct: number) {
  if (pct < 50) return 'bg-blue-500/20 text-blue-300';
  if (pct < 70) return 'bg-blue-500/40 text-blue-200';
  if (pct < 85) return 'bg-amber-500/30 text-amber-300';
  if (pct < 95) return 'bg-amber-500/50 text-amber-200';
  return 'bg-red-500/50 text-red-200';
}

export default function RoleHeatmap({ teams, teamCapacities, allocations }: { teams: Team[]; teamCapacities: TeamCapacity[]; allocations: Allocation[] }) {
  // Calculate role utilization per team
  const roleUtil: Record<string, Record<string, number>> = {};

  for (const team of teams) {
    roleUtil[team.id] = {};
    const roleFte: Record<string, number> = {
      architect: team.architectFte, developer: team.developerFte, qa: team.qaFte,
      devops: team.devopsFte, businessAnalyst: team.businessAnalystFte, dba: team.dbaFte,
    };

    // Total allocated hours per role
    const roleAllocated: Record<string, number> = {};
    for (const alloc of allocations) {
      for (const ta of alloc.teamAllocations) {
        if (ta.teamId !== team.id) continue;
        for (const phase of ta.phases) {
          const role = PHASE_ROLE[phase.phase] || 'developer';
          const total = phase.hoursPerWeek.reduce((s, h) => s + h, 0);
          roleAllocated[role] = (roleAllocated[role] || 0) + total;
        }
      }
    }

    for (const role of ROLES) {
      const fte = roleFte[role] || 0;
      const capacity = fte * 40 * 52 * 0.75; // rough: 75% project time
      const allocated = roleAllocated[role] || 0;
      roleUtil[team.id][role] = capacity > 0 ? (allocated / capacity * 100) : 0;
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left py-2 px-2 text-muted-foreground font-medium">Team</th>
            {ROLES.map(r => (
              <th key={r} className="text-center py-2 px-2 text-muted-foreground font-medium">{ROLE_LABELS[r]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map(team => (
            <tr key={team.id} className="border-t border-border/50">
              <td className="py-2 px-2 font-medium">{team.name}</td>
              {ROLES.map(role => {
                const pct = roleUtil[team.id]?.[role] || 0;
                const fte = role === 'architect' ? team.architectFte : role === 'developer' ? team.developerFte : role === 'qa' ? team.qaFte : role === 'devops' ? team.devopsFte : role === 'businessAnalyst' ? team.businessAnalystFte : team.dbaFte;
                return (
                  <td key={role} className="py-1 px-1 text-center">
                    {fte > 0 ? (
                      <div className={`rounded px-2 py-1 ${getColor(pct)}`}>
                        {pct.toFixed(0)}%
                        <div className="text-[9px] opacity-70">{fte} FTE</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500/20" />&lt;70%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/30" />70-85%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/50" />85-95%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/50" />&gt;95%</span>
      </div>
    </div>
  );
}
