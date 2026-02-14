'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import {
  ArrowLeft, Edit2, Trash2, Users, Clock, MapPin, Building2, User,
  AlertTriangle, FolderKanban, ChevronRight, Save, X, Info
} from 'lucide-react';

interface Team {
  id: string; name: string; description: string; department: string; costCenter: string;
  managerName: string; location: string; timezone: string;
  pmFte: number; productManagerFte: number; uxDesignerFte: number | null;
  businessAnalystFte: number; scrumMasterFte: number; architectFte: number;
  developerFte: number; qaFte: number; devopsFte: number; dbaFte: number;
  kloTlmHoursPerWeek: number; adminPct: number; skills: string[];
}

interface Resource {
  id: string; name: string; title: string; roleType: string; seniority: string;
  baseHoursPerWeek: number; isContractor: boolean; avatarColor: string;
}

interface ProjectAlloc {
  projectId: string; projectName: string; totalHours: number; status: string;
}

const ROLE_COLORS: Record<string, string> = {
  PM: '#3b82f6', 'Product Manager': '#8b5cf6', 'UX Designer': '#ec4899',
  BA: '#f59e0b', 'Scrum Master': '#06b6d4', Architect: '#ef4444',
  Developer: '#10b981', QA: '#f97316', DevOps: '#6366f1', DBA: '#14b8a6',
};

export default function TeamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<ProjectAlloc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Team>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/teams/${id}`).then(r => r.json()),
      fetch('/api/resources').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([teamData, allResources, allProjects]) => {
      setTeam(teamData);
      setForm(teamData);
      setResources(allResources.filter((r: any) => r.teamId === id));
      // Find projects that have team estimates for this team
      const teamProjects = allProjects
        .filter((p: any) => p.teamEstimates?.some((te: any) => te.teamId === id))
        .map((p: any) => {
          const te = p.teamEstimates.find((te: any) => te.teamId === id);
          return {
            projectId: p.id,
            projectName: p.name,
            totalHours: te ? te.design + te.development + te.testing + te.deployment + te.postDeploy : 0,
            status: p.status,
          };
        });
      setProjects(teamProjects);
      setLoading(false);
    });
  }, [id]);

  const saveEdit = async () => {
    const { id: _id, ...data } = form as Team;
    await fetch(`/api/teams/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const updated = await fetch(`/api/teams/${id}`).then(r => r.json());
    setTeam(updated);
    setForm(updated);
    setEditing(false);
  };

  const deleteTeam = async () => {
    if (!confirm('Delete this team? This action cannot be undone.')) return;
    await fetch(`/api/teams/${id}`, { method: 'DELETE' });
    router.push('/');
  };

  if (loading || !team) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const roles = [
    { name: 'PM', fte: team.pmFte },
    { name: 'Product Manager', fte: team.productManagerFte },
    { name: 'UX Designer', fte: team.uxDesignerFte || 0 },
    { name: 'BA', fte: team.businessAnalystFte },
    { name: 'Scrum Master', fte: team.scrumMasterFte },
    { name: 'Architect', fte: team.architectFte },
    { name: 'Developer', fte: team.developerFte },
    { name: 'QA', fte: team.qaFte },
    { name: 'DevOps', fte: team.devopsFte },
    { name: 'DBA', fte: team.dbaFte },
  ].filter(r => r.fte > 0);

  const totalFte = roles.reduce((s, r) => s + r.fte, 0);
  const totalHours = totalFte * 40;
  const afterKlo = totalHours - team.kloTlmHoursPerWeek;
  const adminHours = afterKlo * (team.adminPct / 100);
  const projectCap = afterKlo - adminHours;

  const capacityData = [
    { name: 'KLO/TLM', hours: team.kloTlmHoursPerWeek, fill: '#ef4444' },
    { name: 'Admin Overhead', hours: adminHours, fill: '#f59e0b' },
    { name: 'Project Capacity', hours: projectCap, fill: '#10b981' },
  ];

  const STATUS_LABELS: Record<string, string> = {
    not_started: 'Not Started', in_planning: 'In Planning', active: 'Active',
    on_hold: 'On Hold', complete: 'Complete', cancelled: 'Cancelled',
  };
  const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400', in_planning: 'bg-blue-500/20 text-blue-400',
    not_started: 'bg-slate-500/20 text-slate-400', on_hold: 'bg-amber-500/20 text-amber-400',
    complete: 'bg-emerald-500/20 text-emerald-400', cancelled: 'bg-red-500/20 text-red-400',
  };

  const RoleInput = ({ label, field }: { label: string; field: keyof Team }) => (
    <div>
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <input type="number" step="0.5" min="0" value={(form as any)[field] || 0}
        onChange={e => setForm(f => ({ ...f, [field]: parseFloat(e.target.value) || 0 }))}
        className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
          <button onClick={() => router.push('/')} className="hover:text-foreground">Dashboard</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => router.push('/')} className="hover:text-foreground">Teams</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{team.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              {team.description && <p className="text-sm text-muted-foreground mt-1">{team.description}</p>}
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                {team.department && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{team.department}</span>}
                {team.managerName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{team.managerName}</span>}
                {team.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{team.location}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(!editing)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted">
              <Edit2 className="w-3 h-3" /> Edit
            </button>
            <button onClick={deleteTeam} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">Edit Team</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div className="col-span-2">
                  <label className="text-[10px] text-muted-foreground">Team Name</label>
                  <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] text-muted-foreground">Description</label>
                  <input value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Department</label>
                  <input value={form.department || ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Cost Center</label>
                  <input value={form.costCenter || ''} onChange={e => setForm(f => ({ ...f, costCenter: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Manager</label>
                  <input value={form.managerName || ''} onChange={e => setForm(f => ({ ...f, managerName: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Location</label>
                  <input value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Timezone</label>
                  <input value={form.timezone || ''} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
                </div>
              </div>
              <p className="text-xs font-medium mb-2">Role Template (FTE)</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <RoleInput label="PM" field="pmFte" />
                <RoleInput label="Product Manager" field="productManagerFte" />
                <RoleInput label="BA" field="businessAnalystFte" />
                <RoleInput label="Scrum Master" field="scrumMasterFte" />
                <RoleInput label="Architect" field="architectFte" />
                <RoleInput label="Developers" field="developerFte" />
                <RoleInput label="QA" field="qaFte" />
                <RoleInput label="DevOps" field="devopsFte" />
                <RoleInput label="DBA" field="dbaFte" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <RoleInput label="KLO/TLM (hrs/wk)" field="kloTlmHoursPerWeek" />
                <div>
                  <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                    Admin % <span className="cursor-help" title="Percentage of time spent on administrative tasks, meetings, email, etc."><Info className="w-3 h-3" /></span>
                  </label>
                  <input type="number" step="1" min="0" max="100" value={(form as any).adminPct || 25}
                    onChange={e => setForm(f => ({ ...f, adminPct: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground"><Save className="w-4 h-4" /> Save</button>
                <button onClick={() => { setEditing(false); setForm(team); }} className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground">Cancel</button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Total FTE</p>
            <p className="text-2xl font-bold text-blue-400">{totalFte.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">{resources.length} people</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Total Hours/wk</p>
            <p className="text-2xl font-bold text-purple-400">{totalHours.toFixed(0)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Project Capacity</p>
            <p className="text-2xl font-bold text-green-400">{projectCap.toFixed(0)}h/wk</p>
            <p className="text-[10px] text-muted-foreground">{(projectCap / totalHours * 100).toFixed(0)}% of total</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Active Projects</p>
            <p className="text-2xl font-bold text-amber-400">{projects.filter(p => p.status === 'active').length}</p>
            <p className="text-[10px] text-muted-foreground">{projects.length} total</p>
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Role Composition Donut */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Role Composition</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roles} dataKey="fte" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {roles.map(r => <Cell key={r.name} fill={ROLE_COLORS[r.name] || '#6b7280'} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${v} FTE`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Capacity Breakdown */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Capacity Breakdown (hrs/wk)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={capacityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                      {capacityData.map(d => <Cell key={d.name} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>{totalHours.toFixed(0)}h total → {team.kloTlmHoursPerWeek}h KLO/TLM → {adminHours.toFixed(0)}h admin ({team.adminPct}%) → <strong className="text-green-400">{projectCap.toFixed(0)}h project capacity</strong></p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resources */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Team Members ({resources.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {resources.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No resources assigned to this team yet.</p>
            ) : (
              <div className="space-y-2">
                {resources.map(r => (
                  <button key={r.id} onClick={() => router.push(`/resources/${r.id}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: r.avatarColor }}>
                      {r.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.title} · {r.roleType} · {r.seniority}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {r.isContractor && <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">Contractor</span>}
                      <span>{r.baseHoursPerWeek}h/wk</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><FolderKanban className="w-4 h-4" /> Projects ({projects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No projects allocated to this team.</p>
            ) : (
              <div className="space-y-2">
                {projects.map(p => (
                  <button key={p.projectId} onClick={() => router.push(`/projects/${p.projectId}`)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
                    <div>
                      <p className="text-sm font-medium">{p.projectName}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[p.status] || ''}`}>{STATUS_LABELS[p.status] || p.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{p.totalHours.toLocaleString()}h estimated</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
