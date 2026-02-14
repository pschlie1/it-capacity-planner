'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertTriangle, Search, Shield, Users, Zap, Target } from 'lucide-react';

interface SkillTeamData { count: number; maxProficiency: number; avgProficiency: number; people: string[] }
interface SkillRow { skill: string; teams: Record<string, SkillTeamData> }
interface SPOF { skillName: string; resource: { name: string; id: string }; projects: string[] }
interface TeamInfo { id: string; name: string }

export default function SkillsMatrix() {
  const [matrix, setMatrix] = useState<SkillRow[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [spof, setSpof] = useState<SPOF[]>([]);
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/resources/skills').then(r => r.json()).then(d => {
      setMatrix(d.matrix || []);
      setTeams(d.teams || []);
      setSpof(d.singlePointsOfFailure || []);
      setAllSkills(d.skills || []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return matrix;
    return matrix.filter(r => r.skill.toLowerCase().includes(search.toLowerCase()));
  }, [matrix, search]);

  const getProficiencyColor = (avg: number) => {
    if (avg >= 4.5) return 'bg-green-500';
    if (avg >= 3.5) return 'bg-green-400';
    if (avg >= 2.5) return 'bg-amber-400';
    if (avg >= 1.5) return 'bg-amber-500';
    return 'bg-red-400';
  };

  const getProficiencyBg = (avg: number) => {
    if (avg >= 4.5) return 'bg-green-500/20';
    if (avg >= 3.5) return 'bg-green-500/10';
    if (avg >= 2.5) return 'bg-amber-500/10';
    if (avg >= 1.5) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  // Total people per skill
  const skillTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    matrix.forEach(row => {
      totals[row.skill] = Object.values(row.teams).reduce((s, t) => s + t.count, 0);
    });
    return totals;
  }, [matrix]);

  if (loading) return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><Target className="w-3 h-3" /> Unique Skills</p>
          <p className="text-2xl font-bold text-blue-400">{allSkills.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><Users className="w-3 h-3" /> Teams Covered</p>
          <p className="text-2xl font-bold text-purple-400">{teams.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><Shield className="w-3 h-3" /> Single Points of Failure</p>
          <p className={`text-2xl font-bold ${spof.length > 0 ? 'text-red-400' : 'text-green-400'}`}>{spof.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><Zap className="w-3 h-3" /> Rare Skills (≤2)</p>
          <p className="text-2xl font-bold text-amber-400">{Object.values(skillTotals).filter(t => t <= 2).length}</p>
        </CardContent></Card>
      </div>

      {/* SPOF Alert */}
      {spof.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Single Points of Failure</span>
          </div>
          <div className="space-y-1">
            {spof.map((s, i) => (
              <div key={i} className="text-xs">
                <span className="font-medium text-red-300">{s.skillName}</span>
                <span className="text-muted-foreground"> — Only </span>
                <span className="font-medium">{s.resource.name}</span>
                <span className="text-muted-foreground"> has this skill. Affects: {s.projects.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search skills..."
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-muted border border-border" />
      </div>

      {/* Matrix Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Skill Coverage Matrix</CardTitle>
          <CardDescription>Skills across teams — hover for details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium sticky left-0 bg-card z-10 min-w-[140px]">Skill</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium w-12">Total</th>
                  {teams.map(t => (
                    <th key={t.id} className="text-center py-2 px-2 text-muted-foreground font-medium min-w-[100px]">
                      <span className="block truncate">{t.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const total = skillTotals[row.skill] || 0;
                  const isRare = total <= 2;
                  return (
                    <tr key={row.skill} className={`border-b border-border/30 hover:bg-muted/30 ${isRare ? 'bg-amber-500/5' : ''}`}>
                      <td className="py-2 px-2 font-medium sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-1.5">
                          {row.skill}
                          {isRare && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        </div>
                      </td>
                      <td className="text-center py-2 px-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${isRare ? 'bg-amber-500/20 text-amber-400' : 'bg-muted'}`}>{total}</span>
                      </td>
                      {teams.map(t => {
                        const cell = row.teams[t.id];
                        const cellKey = `${row.skill}-${t.id}`;
                        if (!cell) return <td key={t.id} className="text-center py-2 px-2 text-muted-foreground/30">—</td>;
                        return (
                          <td key={t.id} className="text-center py-2 px-2 relative"
                            onMouseEnter={() => setHoveredCell(cellKey)} onMouseLeave={() => setHoveredCell(null)}>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${getProficiencyBg(cell.avgProficiency)}`}>
                              <div className={`w-2 h-2 rounded-full ${getProficiencyColor(cell.avgProficiency)}`} />
                              <span className="font-medium">{cell.count}</span>
                              <span className="text-muted-foreground text-[9px]">avg {cell.avgProficiency.toFixed(1)}</span>
                            </div>
                            {/* Tooltip */}
                            {hoveredCell === cellKey && (
                              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-lg bg-popover border border-border shadow-lg min-w-[160px]">
                                <p className="text-[10px] font-medium mb-1">{row.skill} in {t.name}</p>
                                <div className="space-y-0.5">
                                  {cell.people.map(p => (
                                    <p key={p} className="text-[10px] text-muted-foreground">• {p}</p>
                                  ))}
                                </div>
                                <p className="text-[9px] text-muted-foreground mt-1">Max: {cell.maxProficiency}/5 · Avg: {cell.avgProficiency.toFixed(1)}/5</p>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="font-medium">Proficiency:</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> 1-1.5 Beginner</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 1.5-2.5 Basic</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> 2.5-3.5 Intermediate</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> 3.5-4.5 Advanced</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 4.5-5 Expert</span>
      </div>
    </div>
  );
}
