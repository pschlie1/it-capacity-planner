'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, Cell, Legend } from 'recharts';
import { ArrowLeft, AlertTriangle, Calendar, Clock, TrendingUp, Zap, Mail, DollarSign, User } from 'lucide-react';

interface ResourceDetail {
  id: string; name: string; title: string; teamId: string; teamName: string;
  roleType: string; seniority: string; hireDate: string; hourlyCostRate: number;
  baseHoursPerWeek: number; skills: { name: string; proficiency: number }[];
  avatarColor: string; email: string;
  assignments: { id: string; projectId: string; projectName: string; projectStatus?: string; role: string; allocationPct: number; startWeek: number; endWeek: number }[];
  utilization: number[]; avgUtilization: number; maxUtilization: number;
  ptoBlocks: { startWeek: number; endWeek: number; reason: string }[];
}

const SENIORITY_COLORS: Record<string, string> = {
  Junior: 'bg-green-500/20 text-green-400', Mid: 'bg-blue-500/20 text-blue-400',
  Senior: 'bg-purple-500/20 text-purple-400', Lead: 'bg-amber-500/20 text-amber-400', Principal: 'bg-red-500/20 text-red-400',
};

export default function ResourceDetail({ resourceId, onBack }: { resourceId: string; onBack: () => void }) {
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/resources/${resourceId}`).then(r => r.json()).then(d => { setResource(d); setLoading(false); });
  }, [resourceId]);

  if (loading || !resource) return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const radarData = resource.skills.map(s => ({ skill: s.name, proficiency: s.proficiency, fullMark: 5 }));

  // Weekly utilization data for area chart
  const utilData = resource.utilization.map((u, i) => ({
    week: `W${i + 1}`,
    utilization: u,
    weekNum: i,
  }));

  // Assignment timeline data
  const assignmentBars = resource.assignments.map(a => ({
    name: a.projectName,
    role: a.role,
    allocation: a.allocationPct,
    start: a.startWeek,
    end: a.endWeek,
    duration: a.endWeek - a.startWeek + 1,
    status: a.projectStatus,
  }));

  // Burnout check
  let maxConsecutiveHigh = 0;
  let curr = 0;
  for (const u of resource.utilization) {
    if (u >= 85) { curr++; maxConsecutiveHigh = Math.max(maxConsecutiveHigh, curr); }
    else { curr = 0; }
  }
  const burnoutRisk = maxConsecutiveHigh >= 4;

  // Cost calculation
  const totalAllocatedWeeks = resource.assignments.reduce((s, a) => s + (a.endWeek - a.startWeek + 1) * (a.allocationPct / 100), 0);
  const estimatedCost = totalAllocatedWeeks * resource.baseHoursPerWeek * resource.hourlyCostRate;

  return (
    <div className="space-y-4">
      {/* Back button + Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: resource.avatarColor }}>
            {resource.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-xl font-bold">{resource.name}</h2>
            <p className="text-sm text-muted-foreground">{resource.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded bg-muted">{resource.teamName}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded ${SENIORITY_COLORS[resource.seniority]}`}>{resource.seniority}</span>
              <span className="text-[10px] text-muted-foreground">{resource.roleType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Avg Utilization</p>
          <p className={`text-2xl font-bold ${resource.avgUtilization > 90 ? 'text-red-400' : resource.avgUtilization > 75 ? 'text-amber-400' : 'text-green-400'}`}>{resource.avgUtilization.toFixed(0)}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><Zap className="w-3 h-3" /> Peak</p>
          <p className={`text-2xl font-bold ${resource.maxUtilization > 100 ? 'text-red-400' : 'text-blue-400'}`}>{resource.maxUtilization.toFixed(0)}%</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Projects</p>
          <p className="text-2xl font-bold text-purple-400">{resource.assignments.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><DollarSign className="w-3 h-3" /> Rate</p>
          <p className="text-2xl font-bold text-cyan-400">${resource.hourlyCostRate}/hr</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Hours/Wk</p>
          <p className="text-2xl font-bold text-blue-400">{resource.baseHoursPerWeek}h</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 pb-3">
          <p className="text-[10px] text-muted-foreground uppercase">Est. Cost (YTD)</p>
          <p className="text-2xl font-bold text-amber-400">${(estimatedCost / 1000).toFixed(0)}K</p>
        </CardContent></Card>
      </div>

      {/* Alerts */}
      {(resource.maxUtilization > 100 || burnoutRisk) && (
        <div className="space-y-2">
          {resource.maxUtilization > 100 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">Over-allocated</p>
                <p className="text-xs text-muted-foreground">Peak utilization of {resource.maxUtilization.toFixed(0)}% — assignments exceed available time</p>
              </div>
            </div>
          )}
          {burnoutRisk && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-400">Burnout Risk</p>
                <p className="text-xs text-muted-foreground">{maxConsecutiveHigh} consecutive weeks at 85%+ utilization</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Skills Profile</CardTitle>
            <CardDescription>{resource.skills.length} skills</CardDescription>
          </CardHeader>
          <CardContent>
            {radarData.length > 2 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9, fill: '#64748b' }} />
                  <Radar name="Proficiency" dataKey="proficiency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="space-y-2">
                {resource.skills.map(s => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="text-xs w-24">{s.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(s.proficiency / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{s.proficiency}/5</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Utilization Timeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Utilization Timeline</CardTitle>
            <CardDescription>Weekly allocation percentage over 52 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={utilData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#64748b' }} interval={7} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} domain={[0, 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number | undefined) => [`${(v ?? 0).toFixed(0)}%`, 'Utilization']} />
                <defs>
                  <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="utilization" stroke="#3b82f6" fill="url(#utilGrad)" strokeWidth={2} />
                {/* 100% line */}
                <Area type="monotone" dataKey={() => 100} stroke="#ef4444" strokeDasharray="4 4" fill="none" strokeWidth={1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project Assignments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Project Assignments</CardTitle>
          <CardDescription>{resource.assignments.length} active assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {resource.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No current assignments</p>
          ) : (
            <div className="space-y-2">
              {resource.assignments.map(a => {
                const width = ((a.endWeek - a.startWeek + 1) / 52) * 100;
                const left = (a.startWeek / 52) * 100;
                return (
                  <div key={a.id} className="p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium">{a.projectName}</span>
                        <span className="text-xs text-muted-foreground ml-2">as {a.role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${a.allocationPct > 80 ? 'text-amber-400' : 'text-blue-400'}`}>{a.allocationPct}%</span>
                        <span className="text-[10px] text-muted-foreground">Wk {a.startWeek}-{a.endWeek}</span>
                      </div>
                    </div>
                    {/* Timeline bar */}
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div className="absolute h-full rounded-full bg-primary/60" style={{ left: `${left}%`, width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PTO */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Time Off</CardTitle>
          </CardHeader>
          <CardContent>
            {resource.ptoBlocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scheduled time off</p>
            ) : (
              <div className="space-y-2">
                {resource.ptoBlocks.map((pto, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-xs">{pto.reason}</span>
                    <span className="text-xs text-muted-foreground">Week {pto.startWeek} - {pto.endWeek}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact & Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{resource.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Hire Date</span><span>{resource.hireDate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Hourly Rate</span><span>${resource.hourlyCostRate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Base Hours</span><span>{resource.baseHoursPerWeek}h/week</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Seniority</span><span>{resource.seniority}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
