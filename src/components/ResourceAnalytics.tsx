'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { AlertTriangle, Shield, TrendingUp, Users, Zap, Target, Brain, Clock } from 'lucide-react';

interface Analytics {
  totalResources: number; totalTeams: number;
  resourceUtilization: { id: string; name: string; teamName: string; avgUtilization: number; maxUtilization: number; seniority: string; roleType: string }[];
  mostContested: { id: string; name: string; projectCount: number; teamName: string }[];
  overallocatedCount: number;
  singlePointsOfFailure: { skillName: string; resource: { name: string }; projects: string[] }[];
  seniorityByTeam: { teamId: string; teamName: string; total: number; Junior: number; Mid: number; Senior: number; Lead: number; Principal: number }[];
  burnoutRisk: { id: string; name: string; maxConsecutiveHighWeeks: number; teamName: string }[];
  roleNeeds: Record<string, { current: number; avgUtil: number }>;
  productivity: Record<string, number>;
}

const SENIORITY_COLORS_MAP = { Junior: '#22c55e', Mid: '#3b82f6', Senior: '#a855f7', Lead: '#f59e0b', Principal: '#ef4444' };
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function ResourceAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/resources/analytics').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const topUtilized = data.resourceUtilization.slice(0, 10);
  const seniorityData = data.seniorityByTeam;
  const roleData = Object.entries(data.roleNeeds).map(([role, d]) => ({ role, ...d })).sort((a, b) => b.avgUtil - a.avgUtil);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">People</p>
          <p className="text-2xl font-bold text-blue-400">{data.totalResources}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Over-allocated</p>
          <p className={`text-2xl font-bold ${data.overallocatedCount > 0 ? 'text-red-400' : 'text-green-400'}`}>{data.overallocatedCount}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">SPOFs</p>
          <p className={`text-2xl font-bold ${data.singlePointsOfFailure.length > 0 ? 'text-red-400' : 'text-green-400'}`}>{data.singlePointsOfFailure.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Burnout Risk</p>
          <p className={`text-2xl font-bold ${data.burnoutRisk.length > 0 ? 'text-amber-400' : 'text-green-400'}`}>{data.burnoutRisk.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Most Contested</p>
          <p className="text-2xl font-bold text-purple-400">{data.mostContested[0]?.projectCount || 0} proj</p>
          <p className="text-[10px] text-muted-foreground truncate">{data.mostContested[0]?.name}</p>
        </CardContent></Card>
      </div>

      {/* Alerts */}
      {data.burnoutRisk.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">Burnout Risk ({data.burnoutRisk.length} people)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {data.burnoutRisk.map(r => (
              <div key={r.id} className="text-xs">
                <span className="font-medium">{r.name}</span>
                <span className="text-muted-foreground"> ({r.teamName}) — {r.maxConsecutiveHighWeeks} consecutive weeks at 85%+</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Utilized */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" /> Most Utilized People</CardTitle>
            <CardDescription>Highest average utilization across 52 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topUtilized} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" domain={[0, 120]} tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(0)}%`, 'Avg Utilization']} />
                <Bar dataKey="avgUtilization" radius={[0, 4, 4, 0]}>
                  {topUtilized.map((entry, i) => (
                    <Cell key={i} fill={entry.avgUtilization > 90 ? '#ef4444' : entry.avgUtilization > 75 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resource Contention */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-purple-400" /> Resource Contention</CardTitle>
            <CardDescription>People assigned to the most projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.mostContested.map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <span className="text-xs font-bold text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{r.teamName}</span>
                  </div>
                  <span className="text-sm font-bold text-purple-400">{r.projectCount} projects</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seniority by Team */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Seniority Distribution</CardTitle>
            <CardDescription>Team composition by experience level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={seniorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="teamName" tick={{ fontSize: 8, fill: '#94a3b8' }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="Principal" stackId="a" fill={SENIORITY_COLORS_MAP.Principal} />
                <Bar dataKey="Lead" stackId="a" fill={SENIORITY_COLORS_MAP.Lead} />
                <Bar dataKey="Senior" stackId="a" fill={SENIORITY_COLORS_MAP.Senior} />
                <Bar dataKey="Mid" stackId="a" fill={SENIORITY_COLORS_MAP.Mid} />
                <Bar dataKey="Junior" stackId="a" fill={SENIORITY_COLORS_MAP.Junior} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hiring Forecast by Role */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Brain className="w-4 h-4 text-cyan-400" /> Hiring Forecast</CardTitle>
            <CardDescription>Roles with highest utilization need reinforcement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roleData.map(r => {
                const needsHire = r.avgUtil > 75;
                const urgentHire = r.avgUtil > 90;
                return (
                  <div key={r.role} className="flex items-center gap-3">
                    <span className="text-xs w-28 truncate">{r.role}</span>
                    <span className="text-[10px] text-muted-foreground w-8">{r.current}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${urgentHire ? 'bg-red-400' : needsHire ? 'bg-amber-400' : 'bg-green-400'}`}
                        style={{ width: `${Math.min(r.avgUtil, 100)}%` }} />
                    </div>
                    <span className={`text-xs font-medium w-12 text-right ${urgentHire ? 'text-red-400' : needsHire ? 'text-amber-400' : 'text-green-400'}`}>{r.avgUtil.toFixed(0)}%</span>
                    {urgentHire && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">Hire Now</span>}
                    {needsHire && !urgentHire && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Plan Hire</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Single Points of Failure */}
      {data.singlePointsOfFailure.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-red-400" /> Single Points of Failure</CardTitle>
            <CardDescription>Critical skills held by only one person</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Skill</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Only Person</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Affected Projects</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {data.singlePointsOfFailure.map((s, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="py-2 px-2 font-medium">{s.skillName}</td>
                      <td className="py-2 px-2">{s.resource.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{s.projects.join(', ')}</td>
                      <td className="py-2 px-2"><span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px]">Critical</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
