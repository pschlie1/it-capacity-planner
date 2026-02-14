'use client';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Search, Users, Filter, AlertTriangle, ChevronRight, TrendingUp,
  Zap, Clock, UserPlus, ArrowUpDown, ChevronDown, X
} from 'lucide-react';

interface ResourceSkill { name: string; proficiency: number; }
interface Assignment { id: string; projectId: string; projectName: string; role: string; allocationPct: number; startWeek: number; endWeek: number; }
interface Resource {
  id: string; name: string; title: string; teamId: string; teamName: string;
  roleType: string; seniority: string; hireDate: string; hourlyCostRate: number;
  baseHoursPerWeek: number; skills: ResourceSkill[]; avatarColor: string; email: string;
  assignments: Assignment[]; utilization: number[]; avgUtilization: number;
  maxUtilization: number; currentWeekUtil: number; ptoBlocks: { startWeek: number; endWeek: number; reason: string }[];
}

const SENIORITY_COLORS: Record<string, string> = {
  Junior: 'bg-green-500/20 text-green-400',
  Mid: 'bg-blue-500/20 text-blue-400',
  Senior: 'bg-purple-500/20 text-purple-400',
  Lead: 'bg-amber-500/20 text-amber-400',
  Principal: 'bg-red-500/20 text-red-400',
};

export default function ResourceDirectory({ onSelectResource }: { onSelectResource: (id: string) => void }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [seniorityFilter, setSeniorityFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'utilization' | 'seniority' | 'team'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [view, setView] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    fetch('/api/resources').then(r => r.json()).then(d => { setResources(d); setLoading(false); });
  }, []);

  const teams = useMemo(() => Array.from(new Set(resources.map(r => r.teamName))).sort(), [resources]);
  const roles = useMemo(() => Array.from(new Set(resources.map(r => r.roleType))).sort(), [resources]);
  const allSkills = useMemo(() => {
    const s = new Set<string>();
    resources.forEach(r => r.skills.forEach(sk => s.add(sk.name)));
    return Array.from(s).sort();
  }, [resources]);

  const filtered = useMemo(() => {
    let result = resources.filter(r => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (teamFilter !== 'all' && r.teamName !== teamFilter) return false;
      if (roleFilter !== 'all' && r.roleType !== roleFilter) return false;
      if (seniorityFilter !== 'all' && r.seniority !== seniorityFilter) return false;
      if (skillFilter !== 'all' && !r.skills.some(s => s.name === skillFilter)) return false;
      return true;
    });

    const seniorityOrder = { Junior: 0, Mid: 1, Senior: 2, Lead: 3, Principal: 4 };
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'utilization') cmp = a.avgUtilization - b.avgUtilization;
      else if (sortBy === 'seniority') cmp = (seniorityOrder[a.seniority as keyof typeof seniorityOrder] || 0) - (seniorityOrder[b.seniority as keyof typeof seniorityOrder] || 0);
      else if (sortBy === 'team') cmp = a.teamName.localeCompare(b.teamName);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [resources, search, teamFilter, roleFilter, seniorityFilter, skillFilter, sortBy, sortDir]);

  const avgUtil = resources.length > 0 ? resources.reduce((s, r) => s + r.avgUtilization, 0) / resources.length : 0;
  const overalloc = resources.filter(r => r.maxUtilization > 100).length;

  if (loading) return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Total People</p>
          <p className="text-2xl font-bold text-blue-400">{resources.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Avg Utilization</p>
          <p className={`text-2xl font-bold ${avgUtil > 85 ? 'text-red-400' : avgUtil > 70 ? 'text-amber-400' : 'text-green-400'}`}>{avgUtil.toFixed(0)}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Over-allocated</p>
          <p className={`text-2xl font-bold ${overalloc > 0 ? 'text-red-400' : 'text-green-400'}`}>{overalloc}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Teams</p>
          <p className="text-2xl font-bold text-purple-400">{teams.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Unique Skills</p>
          <p className="text-2xl font-bold text-cyan-400">{allSkills.length}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, title, email..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-muted border border-border" />
        </div>
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="px-2 py-1.5 text-xs rounded-lg bg-muted border border-border">
          <option value="all">All Teams</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-2 py-1.5 text-xs rounded-lg bg-muted border border-border">
          <option value="all">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={seniorityFilter} onChange={e => setSeniorityFilter(e.target.value)} className="px-2 py-1.5 text-xs rounded-lg bg-muted border border-border">
          <option value="all">All Seniority</option>
          {['Junior', 'Mid', 'Senior', 'Lead', 'Principal'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={skillFilter} onChange={e => setSkillFilter(e.target.value)} className="px-2 py-1.5 text-xs rounded-lg bg-muted border border-border">
          <option value="all">All Skills</option>
          {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => { setSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }} className="p-1.5 rounded hover:bg-muted">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="px-2 py-1.5 text-xs rounded-lg bg-muted border border-border">
            <option value="name">Name</option>
            <option value="utilization">Utilization</option>
            <option value="seniority">Seniority</option>
            <option value="team">Team</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} of {resources.length} people</p>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(r => {
          const utilColor = r.avgUtilization > 90 ? 'text-red-400' : r.avgUtilization > 75 ? 'text-amber-400' : r.avgUtilization > 40 ? 'text-green-400' : 'text-slate-400';
          const barColor = r.avgUtilization > 90 ? 'bg-red-400' : r.avgUtilization > 75 ? 'bg-amber-400' : 'bg-green-400';

          return (
            <Card key={r.id} className="cursor-pointer hover:border-primary/40 transition-all group" onClick={() => onSelectResource(r.id)}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: r.avatarColor }}>
                    {r.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{r.name}</h3>
                      <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{r.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{r.teamName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${SENIORITY_COLORS[r.seniority] || 'bg-muted'}`}>{r.seniority}</span>
                      <span className="text-[10px] text-muted-foreground">{r.roleType}</span>
                    </div>
                    {/* Skills */}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {r.skills.slice(0, 4).map(s => (
                        <span key={s.name} className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary">
                          {s.name} <span className="opacity-60">({s.proficiency})</span>
                        </span>
                      ))}
                      {r.skills.length > 4 && <span className="text-[9px] text-muted-foreground">+{r.skills.length - 4}</span>}
                    </div>
                    {/* Utilization bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${barColor} transition-all`} style={{ width: `${Math.min(r.avgUtilization, 100)}%` }} />
                      </div>
                      <span className={`text-[10px] font-medium ${utilColor}`}>{r.avgUtilization.toFixed(0)}%</span>
                    </div>
                    {/* Assignments count */}
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>{r.assignments.length} project{r.assignments.length !== 1 ? 's' : ''}</span>
                      <span>${r.hourlyCostRate}/hr</span>
                      {r.baseHoursPerWeek < 40 && <span className="text-amber-400">Part-time ({r.baseHoursPerWeek}h/wk)</span>}
                      {r.maxUtilization > 100 && <span className="text-red-400 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Over-allocated</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
