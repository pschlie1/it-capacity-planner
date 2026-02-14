'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Target, AlertTriangle, Calendar, Zap, Filter, ArrowUp, ArrowDown, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';

interface TeamEstimate { teamId: string; design: number; development: number; testing: number; deployment: number; postDeploy: number; confidence?: string; team?: { name: string }; }
interface Milestone { id: string; name: string; targetWeek: number; status: string; }
interface Project {
  id: string; name: string; priority: number; status: string; description: string;
  teamEstimates: TeamEstimate[]; tshirtSize?: string; category?: string; sponsor?: string;
  businessValue?: string; quarterTarget?: string; riskLevel?: string; committedDate?: string;
  milestones?: Milestone[];
}
interface Allocation {
  projectId: string; projectName: string; priority: number; feasible: boolean;
  startWeek: number; endWeek: number; totalWeeks: number;
  bottleneck: { teamId: string; teamName: string; role: string } | null;
  teamAllocations: { teamId: string; teamName: string; phases: { phase: string; startWeek: number; endWeek: number; hoursPerWeek: number[] }[] }[];
}
interface Team { id: string; name: string; }
interface TeamCapacity { teamId: string; teamName: string; utilization: number; projectCapacityPerWeek: number; allocatedHours: number; }

const STATUS_COLORS: Record<string, string> = {
  not_started: '#64748b', in_planning: '#3b82f6', active: '#22c55e',
  on_hold: '#f59e0b', complete: '#10b981', cancelled: '#ef4444', proposed: '#8b5cf6',
};

const Q_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function PortfolioDashboard({ projects, allocations, teams, teamCapacities }: {
  projects: Project[]; allocations: Allocation[]; teams: Team[]; teamCapacities: TeamCapacity[];
}) {
  const [quarterFilter, setQuarterFilter] = useState('all');

  const quarters = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];
  const filtered = quarterFilter === 'all' ? projects : projects.filter(p => p.quarterTarget === quarterFilter);

  // Category breakdown
  const categories: Record<string, { count: number; hours: number }> = {};
  filtered.forEach(p => {
    const cat = p.category || 'Uncategorized';
    const hours = p.teamEstimates.reduce((s, te) => s + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0);
    if (!categories[cat]) categories[cat] = { count: 0, hours: 0 };
    categories[cat].count++;
    categories[cat].hours += hours;
  });

  const categoryData = Object.entries(categories).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.hours - a.hours);
  const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  filtered.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Quarterly capacity
  const quarterData = quarters.map((q, qi) => {
    const qProjects = projects.filter(p => p.quarterTarget === q);
    const hours = qProjects.reduce((s, p) => s + p.teamEstimates.reduce((s2, te) => s2 + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0), 0);
    return { name: q, projects: qProjects.length, hours: Math.round(hours / 100) * 100 };
  });

  // Team radar data
  const radarData = teamCapacities.map(tc => ({
    team: tc.teamName.split(' ')[0],
    utilization: Math.min(tc.utilization, 100),
    capacity: Math.round(tc.projectCapacityPerWeek),
    allocated: Math.round(tc.allocatedHours / 52),
  }));

  // Business value breakdown
  const bvCounts: Record<string, number> = {};
  filtered.forEach(p => { bvCounts[p.businessValue || 'unrated'] = (bvCounts[p.businessValue || 'unrated'] || 0) + 1; });

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Portfolio Overview</h2>
        <div className="flex gap-1">
          <button onClick={() => setQuarterFilter('all')} className={`px-2 py-1 text-xs rounded ${quarterFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>All</button>
          {quarters.map(q => (
            <button key={q} onClick={() => setQuarterFilter(q)} className={`px-2 py-1 text-xs rounded ${quarterFilter === q ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>{q}</button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniKPI label="Total Projects" value={`${filtered.length}`} />
        <MiniKPI label="Active" value={`${filtered.filter(p => p.status === 'active').length}`} color="text-green-400" />
        <MiniKPI label="Critical" value={`${filtered.filter(p => p.businessValue === 'critical').length}`} color="text-red-400" />
        <MiniKPI label="High Risk" value={`${filtered.filter(p => p.riskLevel === 'high').length}`} color="text-amber-400" />
        <MiniKPI label="Feasible" value={`${allocations.filter(a => a.feasible).length}/${allocations.length}`} color="text-blue-400" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
                <XAxis type="number" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} width={95} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)', borderRadius: '8px', color: 'hsl(210 40% 98%)' }} />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} name="Total Hours">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.7} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {statusData.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.name] || '#6b7280'} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)', borderRadius: '8px', color: 'hsl(210 40% 98%)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quarterly capacity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quarterly Demand</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={quarterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)', borderRadius: '8px', color: 'hsl(210 40% 98%)' }} />
                <Bar dataKey="hours" name="Est. Hours" radius={[4, 4, 0, 0]}>
                  {quarterData.map((_, i) => <Cell key={i} fill={Q_COLORS[i]} fillOpacity={0.7} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Full project table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All Projects</CardTitle>
          <CardDescription>{filtered.length} projects · {filtered.reduce((s, p) => s + p.teamEstimates.reduce((s2, te) => s2 + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0), 0).toLocaleString()} total hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-2 font-medium">#</th>
                  <th className="text-left py-2 px-2 font-medium">Project</th>
                  <th className="text-left py-2 px-2 font-medium">Category</th>
                  <th className="text-left py-2 px-2 font-medium">Status</th>
                  <th className="text-left py-2 px-2 font-medium">Size</th>
                  <th className="text-left py-2 px-2 font-medium">Value</th>
                  <th className="text-left py-2 px-2 font-medium">Risk</th>
                  <th className="text-left py-2 px-2 font-medium">Quarter</th>
                  <th className="text-left py-2 px-2 font-medium">Hours</th>
                  <th className="text-left py-2 px-2 font-medium">Teams</th>
                  <th className="text-left py-2 px-2 font-medium">Feasible</th>
                  <th className="text-left py-2 px-2 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const alloc = allocations.find(a => a.projectId === p.id);
                  const hours = p.teamEstimates.reduce((s, te) => s + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0);
                  const SL: Record<string, string> = { not_started: 'Not Started', in_planning: 'In Planning', active: 'Active', on_hold: 'On Hold', complete: 'Complete', cancelled: 'Cancelled', proposed: 'Proposed' };
                  const SC: Record<string, string> = { not_started: 'bg-slate-500/20 text-slate-400', in_planning: 'bg-blue-500/20 text-blue-400', active: 'bg-green-500/20 text-green-400', on_hold: 'bg-amber-500/20 text-amber-400', complete: 'bg-emerald-500/20 text-emerald-400', cancelled: 'bg-red-500/20 text-red-400', proposed: 'bg-purple-500/20 text-purple-400' };
                  const BVC: Record<string, string> = { critical: 'text-red-400', high: 'text-amber-400', medium: 'text-blue-400', low: 'text-slate-400' };
                  const RC: Record<string, string> = { high: 'text-red-400', medium: 'text-amber-400', low: 'text-green-400' };
                  return (
                    <tr key={p.id} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="py-2 px-2 text-primary font-bold">{p.priority}</td>
                      <td className="py-2 px-2 font-medium max-w-[200px] truncate">{p.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{p.category || '-'}</td>
                      <td className="py-2 px-2"><span className={`px-1.5 py-0.5 rounded text-[10px] ${SC[p.status]}`}>{SL[p.status]}</span></td>
                      <td className="py-2 px-2">{p.tshirtSize || '-'}</td>
                      <td className="py-2 px-2"><span className={BVC[p.businessValue || ''] || ''}>{p.businessValue || '-'}</span></td>
                      <td className="py-2 px-2"><span className={RC[p.riskLevel || ''] || ''}>{p.riskLevel || '-'}</span></td>
                      <td className="py-2 px-2">{p.quarterTarget || '-'}</td>
                      <td className="py-2 px-2 font-mono">{hours.toLocaleString()}</td>
                      <td className="py-2 px-2">{p.teamEstimates.length}</td>
                      <td className="py-2 px-2">{alloc ? (alloc.feasible ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <XCircle className="w-3 h-3 text-red-400" />) : '-'}</td>
                      <td className="py-2 px-2">{alloc ? `${alloc.totalWeeks}w` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MiniKPI({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold ${color || ''}`}>{value}</p>
    </div>
  );
}
