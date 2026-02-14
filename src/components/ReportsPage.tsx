'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { FileText, Download, TrendingUp, Users, Clock, Target, AlertTriangle, Calendar } from 'lucide-react';

interface TeamEstimate { teamId: string; design: number; development: number; testing: number; deployment: number; postDeploy: number; confidence?: string; team?: { name: string }; }
interface Project {
  id: string; name: string; priority: number; status: string; description: string;
  teamEstimates: TeamEstimate[]; category?: string; sponsor?: string; businessValue?: string;
  quarterTarget?: string; riskLevel?: string; committedDate?: string; dependencies?: string[];
}
interface Allocation {
  projectId: string; projectName: string; priority: number; feasible: boolean;
  startWeek: number; endWeek: number; totalWeeks: number;
  bottleneck: { teamId: string; teamName: string; role: string } | null;
  teamAllocations: { teamId: string; teamName: string; phases: { phase: string; startWeek: number; endWeek: number; hoursPerWeek: number[] }[] }[];
}
interface Team { id: string; name: string; }
interface TeamCapacity { teamId: string; teamName: string; utilization: number; projectCapacityPerWeek: number; allocatedHours: number; }

type ReportType = 'forecast' | 'demand' | 'velocity' | 'accuracy' | 'quarterly' | 'risk';

export default function ReportsPage({ projects, teams, allocations, teamCapacities }: {
  projects: Project[]; teams: Team[]; allocations: Allocation[]; teamCapacities: TeamCapacity[];
}) {
  const [activeReport, setActiveReport] = useState<ReportType>('forecast');

  const reports: { id: ReportType; label: string; desc: string; icon: React.ReactNode }[] = [
    { id: 'forecast', label: 'Capacity Forecast', desc: 'Projected completion dates based on current burn rate', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'demand', label: 'Resource Demand', desc: 'Where will we need more staff in 3-6 months?', icon: <Users className="w-4 h-4" /> },
    { id: 'velocity', label: 'Delivery Velocity', desc: 'Hours delivered per team per week', icon: <Clock className="w-4 h-4" /> },
    { id: 'quarterly', label: 'Quarterly Planning', desc: 'Capacity aligned to fiscal quarters', icon: <Calendar className="w-4 h-4" /> },
    { id: 'risk', label: 'Risk Analysis', desc: 'Projects at risk due to capacity or dependencies', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'accuracy', label: 'Planning Accuracy', desc: 'How close are estimates to actuals? (simulated)', icon: <Target className="w-4 h-4" /> },
  ];

  const exportCSV = () => {
    let csv = 'Priority,Project,Status,Category,Hours,Feasible,Duration Weeks,Bottleneck\n';
    projects.forEach(p => {
      const alloc = allocations.find(a => a.projectId === p.id);
      const hours = p.teamEstimates.reduce((s, te) => s + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0);
      csv += `${p.priority},"${p.name}",${p.status},${p.category || ''},${hours},${alloc?.feasible ?? ''},${alloc?.totalWeeks ?? ''},"${alloc?.bottleneck?.teamName ?? ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'capacity-report.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Reports & Analytics</h2>
          <p className="text-xs text-muted-foreground">Data-driven insights for capacity planning decisions</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Report tabs */}
      <div className="flex gap-2 flex-wrap">
        {reports.map(r => (
          <button key={r.id} onClick={() => setActiveReport(r.id)}
            className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-colors ${activeReport === r.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
            {r.icon} {r.label}
          </button>
        ))}
      </div>

      {activeReport === 'forecast' && <ForecastReport allocations={allocations} projects={projects} teamCapacities={teamCapacities} />}
      {activeReport === 'demand' && <DemandReport allocations={allocations} teamCapacities={teamCapacities} teams={teams} />}
      {activeReport === 'velocity' && <VelocityReport teamCapacities={teamCapacities} allocations={allocations} />}
      {activeReport === 'quarterly' && <QuarterlyReport projects={projects} allocations={allocations} teamCapacities={teamCapacities} />}
      {activeReport === 'risk' && <RiskReport projects={projects} allocations={allocations} />}
      {activeReport === 'accuracy' && <AccuracyReport />}
    </div>
  );
}

function ForecastReport({ allocations, projects, teamCapacities }: { allocations: Allocation[]; projects: Project[]; teamCapacities: TeamCapacity[] }) {
  const totalCapacity = teamCapacities.reduce((s, tc) => s + tc.projectCapacityPerWeek, 0);

  const data = allocations.filter(a => a.feasible).map(a => {
    const proj = projects.find(p => p.id === a.projectId);
    const hours = proj?.teamEstimates.reduce((s, te) => s + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0) || 0;
    return { name: a.projectName.substring(0, 20), start: a.startWeek, end: a.endWeek, hours, weeks: a.totalWeeks };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Capacity Forecast</CardTitle>
        <CardDescription>Based on current allocation, projected completion timeline for feasible projects</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 35)}>
          <BarChart data={data} layout="vertical" margin={{ left: 150 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
            <XAxis type="number" domain={[0, 52]} tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} label={{ value: 'Week', position: 'insideBottom', offset: -5, fill: 'hsl(215 20.2% 65.1%)' }} />
            <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} width={145} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)', borderRadius: '8px', color: 'hsl(210 40% 98%)' }} />
            <Bar dataKey="end" fill="#3b82f6" fillOpacity={0.7} radius={[0, 4, 4, 0]} name="Completion Week" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Total weekly capacity: <span className="font-medium text-foreground">{totalCapacity.toFixed(0)} hours/week</span> across {teamCapacities.length} teams</p>
          <p className="mt-1">{allocations.filter(a => !a.feasible).length} projects exceed the 52-week planning horizon</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DemandReport({ allocations, teamCapacities, teams }: { allocations: Allocation[]; teamCapacities: TeamCapacity[]; teams: Team[] }) {
  // Monthly demand per team
  const teamDemand: Record<string, number[]> = {};
  for (const tc of teamCapacities) teamDemand[tc.teamName] = Array(12).fill(0);

  for (const alloc of allocations) {
    for (const ta of alloc.teamAllocations) {
      if (!teamDemand[ta.teamName]) continue;
      for (const phase of ta.phases) {
        phase.hoursPerWeek.forEach((h, i) => {
          const week = phase.startWeek + i;
          const month = Math.min(Math.floor(week / (52 / 12)), 11);
          teamDemand[ta.teamName][month] += h;
        });
      }
    }
  }

  const data = Array.from({ length: 12 }, (_, i) => {
    const row: Record<string, number | string> = { name: `M${i + 1}` };
    for (const tc of teamCapacities) {
      row[tc.teamName] = Math.round(teamDemand[tc.teamName]?.[i] || 0);
    }
    return row;
  });

  const colors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resource Demand Forecast</CardTitle>
        <CardDescription>Monthly demand by team over the next 12 months. Identify where you&apos;ll need more staff.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: 'hsl(215 20.2% 65.1%)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)', borderRadius: '8px', color: 'hsl(210 40% 98%)' }} />
            <Legend />
            {teamCapacities.map((tc, i) => (
              <Area key={tc.teamId} type="monotone" dataKey={tc.teamName} stackId="1" stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.3} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function VelocityReport({ teamCapacities, allocations }: { teamCapacities: TeamCapacity[]; allocations: Allocation[] }) {
  const data = teamCapacities.map(tc => ({
    name: tc.teamName,
    capacity: Math.round(tc.projectCapacityPerWeek),
    allocated: Math.round(tc.allocatedHours / 52),
    available: Math.max(0, Math.round(tc.projectCapacityPerWeek - tc.allocatedHours / 52)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Delivery Velocity</CardTitle>
        <CardDescription>Weekly capacity vs allocated hours per team. Available = bench capacity for new work.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
            <XAxis dataKey="name" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} />
            <YAxis tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} label={{ value: 'Hours/Week', angle: -90, position: 'insideLeft', fill: 'hsl(215 20.2% 65.1%)' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)', borderRadius: '8px', color: 'hsl(210 40% 98%)' }} />
            <Legend />
            <Bar dataKey="allocated" stackId="a" fill="#3b82f6" name="Allocated" />
            <Bar dataKey="available" stackId="a" fill="#22c55e" name="Available (Bench)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.map(d => (
            <div key={d.name} className="text-xs p-2 rounded bg-muted/50">
              <p className="font-medium">{d.name}</p>
              <p className="text-muted-foreground">Bench: <span className="text-green-400 font-medium">{d.available}h/wk</span></p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuarterlyReport({ projects, allocations, teamCapacities }: { projects: Project[]; allocations: Allocation[]; teamCapacities: TeamCapacity[] }) {
  const quarters = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];
  const totalCapacity = teamCapacities.reduce((s, tc) => s + tc.projectCapacityPerWeek, 0) * 13; // 13 weeks per quarter

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quarterly Planning View</CardTitle>
        <CardDescription>Capacity allocation aligned to fiscal quarters</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {quarters.map((q, qi) => {
            const qProjects = projects.filter(p => p.quarterTarget === q);
            const hours = qProjects.reduce((s, p) => s + p.teamEstimates.reduce((s2, te) => s2 + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0), 0);
            const pct = totalCapacity > 0 ? (hours / totalCapacity * 100) : 0;
            const color = pct > 100 ? 'text-red-400' : pct > 80 ? 'text-amber-400' : 'text-green-400';
            return (
              <div key={q} className="border border-border rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2">{q}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Projects</span>
                    <span className="font-medium">{qProjects.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Est. Hours</span>
                    <span className="font-mono">{hours.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Capacity Used</span>
                    <span className={`font-medium ${color}`}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 100 ? 'bg-red-400' : pct > 80 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="mt-2 space-y-1">
                    {qProjects.slice(0, 5).map(p => (
                      <p key={p.id} className="text-[10px] text-muted-foreground truncate">
                        {p.priority}. {p.name}
                      </p>
                    ))}
                    {qProjects.length > 5 && <p className="text-[10px] text-muted-foreground">+{qProjects.length - 5} more</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function RiskReport({ projects, allocations }: { projects: Project[]; allocations: Allocation[] }) {
  const riskProjects = projects.filter(p => p.riskLevel === 'high' || p.riskLevel === 'medium' || !allocations.find(a => a.projectId === p.id)?.feasible);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Risk Analysis</CardTitle>
        <CardDescription>Projects at risk due to capacity constraints, dependencies, or identified risks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {riskProjects.map(p => {
            const alloc = allocations.find(a => a.projectId === p.id);
            const risks: string[] = [];
            if (p.riskLevel === 'high') risks.push('High risk flagged');
            if (!alloc?.feasible) risks.push('Exceeds capacity window');
            if (alloc?.bottleneck) risks.push(`Bottleneck: ${alloc.bottleneck.teamName}`);
            if (p.dependencies && p.dependencies.length > 0) risks.push(`Has ${p.dependencies.length} dependency(s)`);

            return (
              <div key={p.id} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">{p.priority}</span>
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.riskLevel === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {p.riskLevel || 'unknown'} risk
                    </span>
                  </div>
                  {alloc && (
                    <span className={`text-xs ${alloc.feasible ? 'text-green-400' : 'text-red-400'}`}>
                      {alloc.feasible ? `${alloc.totalWeeks}w` : 'Infeasible'}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {risks.map((r, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">
                      <AlertTriangle className="w-2.5 h-2.5 inline mr-1" />{r}
                    </span>
                  ))}
                </div>
                {p.riskLevel === 'high' && p.committedDate && (
                  <p className="text-[10px] text-muted-foreground mt-1">Committed: {p.committedDate} · Sponsor: {p.sponsor}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AccuracyReport() {
  // Simulated accuracy data
  const data = [
    { name: 'Customer Portal', estimated: 584, actual: 520, variance: -11 },
    { name: 'SAP Migration', estimated: 1360, actual: 1580, variance: 16 },
    { name: 'Zero Trust', estimated: 784, actual: 680, variance: -13 },
    { name: 'Data Lakehouse', estimated: 848, actual: 790, variance: -7 },
  ];

  const trendData = [
    { month: 'Jul', accuracy: 72 }, { month: 'Aug', accuracy: 68 },
    { month: 'Sep', accuracy: 75 }, { month: 'Oct', accuracy: 78 },
    { month: 'Nov', accuracy: 82 }, { month: 'Dec', accuracy: 80 },
    { month: 'Jan', accuracy: 85 }, { month: 'Feb', accuracy: 87 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planning Accuracy</CardTitle>
          <CardDescription>Estimated vs actual hours for completed/active projects (simulated data)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)', borderRadius: '8px', color: 'hsl(210 40% 98%)' }} />
              <Legend />
              <Bar dataKey="estimated" fill="#3b82f6" name="Estimated" fillOpacity={0.7} />
              <Bar dataKey="actual" fill="#22c55e" name="Actual" fillOpacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accuracy Trend</CardTitle>
          <CardDescription>Estimation accuracy trending over time (target: 85%+)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} />
              <YAxis domain={[60, 100]} tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)', borderRadius: '8px', color: 'hsl(210 40% 98%)' }} />
              <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Accuracy %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
