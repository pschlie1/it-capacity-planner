'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import CapacityWaterfall from '@/components/charts/CapacityWaterfall';
import RedLineChart from '@/components/charts/RedLineChart';
import TeamUtilization from '@/components/charts/TeamUtilization';
import GanttChart from '@/components/charts/GanttChart';
import AiAnalyst from '@/components/AiAnalyst';
import {
  BarChart3, Users, FolderKanban, Sparkles, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, Plus, Trash2, Lock, Unlock, ChevronDown, X, Edit2, Save,
  Layers, Brain, ArrowUpDown
} from 'lucide-react';

interface Team {
  id: string; name: string;
  architectFte: number; developerFte: number; qaFte: number; devopsFte: number;
  businessAnalystFte: number; dbaFte: number; pmFte: number; productManagerFte: number;
  kloTlmHoursPerWeek: number; adminPct: number;
}

interface TeamEstimate {
  id: string; teamId: string; design: number; development: number;
  testing: number; deployment: number; postDeploy: number;
  team?: { name: string };
}

interface Project {
  id: string; name: string; priority: number; status: string;
  description: string; startWeekOffset: number; teamEstimates: TeamEstimate[];
}

interface Scenario {
  id: string; name: string; locked: boolean;
  priorityOverrides: { projectId: string; priority: number }[];
  contractors: { id: string; teamId: string; roleKey: string; fte: number; weeks: number; label: string; startWeek: number; team?: { name: string } }[];
}

interface Allocation {
  projectId: string; projectName: string; priority: number; feasible: boolean;
  startWeek: number; endWeek: number; totalWeeks: number;
  bottleneck: { teamId: string; teamName: string; role: string } | null;
  teamAllocations: { teamId: string; teamName: string; phases: { phase: string; startWeek: number; endWeek: number; hoursPerWeek: number[] }[] }[];
}

interface TeamCapacity {
  teamId: string; teamName: string; totalHoursPerWeek: number;
  kloTlmHours: number; adminHours: number; projectCapacityPerWeek: number;
  utilization: number; allocatedHours: number;
}

type Tab = 'dashboard' | 'teams' | 'projects' | 'scenarios' | 'ai';

export default function Home() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [teamCapacities, setTeamCapacities] = useState<TeamCapacity[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [teamsRes, projectsRes, scenariosRes] = await Promise.all([
      fetch('/api/teams'), fetch('/api/projects'), fetch('/api/scenarios'),
    ]);
    const [teamsData, projectsData, scenariosData] = await Promise.all([
      teamsRes.json(), projectsRes.json(), scenariosRes.json(),
    ]);
    setTeams(teamsData);
    setProjects(projectsData);
    setScenarios(scenariosData);

    const allocUrl = selectedScenario ? `/api/allocations?scenarioId=${selectedScenario}` : '/api/allocations';
    const allocRes = await fetch(allocUrl);
    const allocData = await allocRes.json();
    setAllocations(allocData.allocations || []);
    setTeamCapacities(allocData.teamCapacities || []);
    setLoading(false);
  }, [selectedScenario]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const feasible = allocations.filter(a => a.feasible).length;
  const infeasible = allocations.filter(a => !a.feasible).length;
  const avgUtil = teamCapacities.length > 0
    ? teamCapacities.reduce((s, tc) => s + tc.utilization, 0) / teamCapacities.length : 0;
  const totalCapacity = teamCapacities.reduce((s, tc) => s + tc.projectCapacityPerWeek, 0);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'teams', label: 'Teams', icon: <Users className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'scenarios', label: 'Scenarios', icon: <Layers className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Analyst', icon: <Brain className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading capacity data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">IT Capacity Planner</h1>
              <p className="text-[10px] text-muted-foreground">AI-Powered Resource Allocation</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Scenario:</label>
              <select
                value={selectedScenario}
                onChange={e => setSelectedScenario(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Baseline</option>
                {scenarios.map(s => (
                  <option key={s.id} value={s.id}>{s.name} {s.locked ? '🔒' : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* Nav */}
        <div className="max-w-[1600px] mx-auto px-6">
          <nav className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === t.id
                    ? 'bg-background text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6">
        {tab === 'dashboard' && <DashboardTab
          allocations={allocations} teamCapacities={teamCapacities}
          feasible={feasible} infeasible={infeasible} avgUtil={avgUtil} totalCapacity={totalCapacity}
          teams={teams} projects={projects}
        />}
        {tab === 'teams' && <TeamsTab teams={teams} onRefresh={fetchData} />}
        {tab === 'projects' && <ProjectsTab projects={projects} teams={teams} onRefresh={fetchData} />}
        {tab === 'scenarios' && <ScenariosTab scenarios={scenarios} teams={teams} projects={projects} onRefresh={fetchData} />}
        {tab === 'ai' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> AI Capacity Analyst</CardTitle>
              <CardDescription>Natural language analysis of your capacity data powered by AI</CardDescription>
            </CardHeader>
            <CardContent><AiAnalyst /></CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

// Dashboard Tab
function DashboardTab({ allocations, teamCapacities, feasible, infeasible, avgUtil, totalCapacity, teams, projects }: {
  allocations: Allocation[]; teamCapacities: TeamCapacity[];
  feasible: number; infeasible: number; avgUtil: number; totalCapacity: number;
  teams: Team[]; projects: Project[];
}) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Teams</p>
                <p className="text-3xl font-bold">{teams.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Projects Feasible</p>
                <p className="text-3xl font-bold text-green-400">{feasible}<span className="text-lg text-muted-foreground">/{projects.length}</span></p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Utilization</p>
                <p className={`text-3xl font-bold ${avgUtil > 90 ? 'text-red-400' : avgUtil > 70 ? 'text-amber-400' : 'text-blue-400'}`}>
                  {avgUtil.toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-400 opacity-60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Weekly Capacity</p>
                <p className="text-3xl font-bold">{totalCapacity.toFixed(0)}<span className="text-sm text-muted-foreground">h</span></p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capacity Waterfall</CardTitle>
            <CardDescription>How each team&apos;s hours are consumed (per week)</CardDescription>
          </CardHeader>
          <CardContent><CapacityWaterfall data={teamCapacities} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              The Red Line
              {infeasible > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{infeasible} over capacity</span>}
            </CardTitle>
            <CardDescription>Project feasibility within 12-month capacity window</CardDescription>
          </CardHeader>
          <CardContent><RedLineChart data={allocations} /></CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Utilization</CardTitle>
            <CardDescription>Project capacity consumption per team</CardDescription>
          </CardHeader>
          <CardContent><TeamUtilization data={teamCapacities} /></CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Timeline</CardTitle>
            <CardDescription>Phase-level Gantt across 12-month planning window</CardDescription>
          </CardHeader>
          <CardContent><GanttChart data={allocations} /></CardContent>
        </Card>
      </div>

      {/* Bottleneck Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Bottleneck Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allocations.filter(a => a.bottleneck).map(a => (
              <div key={a.projectId} className={`p-3 rounded-lg border ${a.feasible ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{a.projectName}</span>
                  {a.feasible ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Bottleneck: <span className="text-foreground">{a.bottleneck?.teamName}</span> · {a.totalWeeks} weeks
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Teams Tab
function TeamsTab({ teams, onRefresh }: { teams: Team[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Team>>({});
  const [showAdd, setShowAdd] = useState(false);

  const startEdit = (team: Team) => {
    setEditing(team.id);
    setForm(team);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { id: _id, ...data } = form as Team;
    await fetch(`/api/teams/${editing}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setEditing(null);
    onRefresh();
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('Delete this team?')) return;
    await fetch(`/api/teams/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const addTeam = async () => {
    await fetch('/api/teams', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name || 'New Team',
        architectFte: form.architectFte || 0, developerFte: form.developerFte || 0,
        qaFte: form.qaFte || 0, devopsFte: form.devopsFte || 0,
        businessAnalystFte: form.businessAnalystFte || 0, dbaFte: form.dbaFte || 0,
        pmFte: form.pmFte || 0, productManagerFte: form.productManagerFte || 0,
        kloTlmHoursPerWeek: form.kloTlmHoursPerWeek || 0, adminPct: form.adminPct || 25,
      }),
    });
    setShowAdd(false);
    setForm({});
    onRefresh();
  };

  const RoleInput = ({ label, field }: { label: string; field: keyof Team }) => (
    <div>
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <input
        type="number" step="0.5" min="0"
        value={(form as Record<string, number>)[field as string] || 0}
        onChange={e => setForm(f => ({ ...f, [field]: parseFloat(e.target.value) || 0 }))}
        className="w-full px-2 py-1 text-sm rounded bg-muted border border-border"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team Management</h2>
        <button onClick={() => { setShowAdd(true); setForm({}); }} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Team
        </button>
      </div>

      {(showAdd || editing) && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editing ? 'Edit Team' : 'New Team'}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] text-muted-foreground">Team Name</label>
                <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
              </div>
              <RoleInput label="Architects (FTE)" field="architectFte" />
              <RoleInput label="Developers (FTE)" field="developerFte" />
              <RoleInput label="QA (FTE)" field="qaFte" />
              <RoleInput label="DevOps (FTE)" field="devopsFte" />
              <RoleInput label="BA (FTE)" field="businessAnalystFte" />
              <RoleInput label="DBA (FTE)" field="dbaFte" />
              <RoleInput label="PM (FTE)" field="pmFte" />
              <RoleInput label="Product Mgr (FTE)" field="productManagerFte" />
              <RoleInput label="KLO/TLM (hrs/wk)" field="kloTlmHoursPerWeek" />
              <RoleInput label="Admin %" field="adminPct" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={editing ? saveEdit : addTeam} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground">
                <Save className="w-4 h-4" /> Save
              </button>
              <button onClick={() => { setEditing(null); setShowAdd(false); }} className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground">
                Cancel
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {teams.map(team => {
          const totalFte = team.architectFte + team.developerFte + team.qaFte + team.devopsFte + team.businessAnalystFte + team.dbaFte + team.pmFte + team.productManagerFte;
          const totalHours = totalFte * 40;
          const afterKlo = totalHours - team.kloTlmHoursPerWeek;
          const projCap = afterKlo * (1 - team.adminPct / 100);
          return (
            <Card key={team.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {totalFte.toFixed(1)} FTE · {totalHours.toFixed(0)}h/wk total · {projCap.toFixed(0)}h/wk project capacity
                    </p>
                    <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                      {team.architectFte > 0 && <span>Arch: {team.architectFte}</span>}
                      {team.developerFte > 0 && <span>Dev: {team.developerFte}</span>}
                      {team.qaFte > 0 && <span>QA: {team.qaFte}</span>}
                      {team.devopsFte > 0 && <span>DevOps: {team.devopsFte}</span>}
                      {team.businessAnalystFte > 0 && <span>BA: {team.businessAnalystFte}</span>}
                      {team.dbaFte > 0 && <span>DBA: {team.dbaFte}</span>}
                      <span>KLO: {team.kloTlmHoursPerWeek}h</span>
                      <span>Admin: {team.adminPct}%</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(team)} className="p-2 rounded-lg hover:bg-muted"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteTeam(team.id)} className="p-2 rounded-lg hover:bg-muted text-red-400"><Trash2 className="w-4 h-4" /></button>
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

// Projects Tab
function ProjectsTab({ projects, teams, onRefresh }: { projects: Project[]; teams: Team[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; priority: number; status: string; description: string; startWeekOffset: number; teamEstimates: { teamId: string; design: number; development: number; testing: number; deployment: number; postDeploy: number }[] }>({
    name: '', priority: projects.length + 1, status: 'proposed', description: '', startWeekOffset: 0, teamEstimates: [],
  });

  const startEdit = (p: Project) => {
    setEditing(p.id);
    setForm({
      name: p.name, priority: p.priority, status: p.status,
      description: p.description, startWeekOffset: p.startWeekOffset,
      teamEstimates: p.teamEstimates.map(te => ({
        teamId: te.teamId, design: te.design, development: te.development,
        testing: te.testing, deployment: te.deployment, postDeploy: te.postDeploy,
      })),
    });
  };

  const saveProject = async () => {
    if (editing) {
      await fetch(`/api/projects/${editing}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setEditing(null); setShowAdd(false); onRefresh();
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const addTeamEstimate = () => {
    setForm(f => ({
      ...f,
      teamEstimates: [...f.teamEstimates, { teamId: teams[0]?.id || '', design: 0, development: 0, testing: 0, deployment: 0, postDeploy: 0 }],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Project Management</h2>
        <button onClick={() => { setShowAdd(true); setForm({ name: '', priority: projects.length + 1, status: 'proposed', description: '', startWeekOffset: 0, teamEstimates: [] }); }}
          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {(showAdd || editing) && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editing ? 'Edit Project' : 'New Project'}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="col-span-2">
                <label className="text-[10px] text-muted-foreground">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Priority</label>
                <input type="number" min="1" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 1 }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border">
                  <option value="proposed">Proposed</option>
                  <option value="active">Active</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-muted-foreground">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Start Offset (weeks)</label>
                <input type="number" min="0" value={form.startWeekOffset} onChange={e => setForm(f => ({ ...f, startWeekOffset: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
              </div>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium">Team Estimates (hours per phase)</label>
                <button onClick={addTeamEstimate} className="text-xs text-primary hover:underline">+ Add Team</button>
              </div>
              {form.teamEstimates.map((te, i) => (
                <div key={i} className="grid grid-cols-7 gap-2 mb-2 items-end">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Team</label>
                    <select value={te.teamId} onChange={e => {
                      const tes = [...form.teamEstimates]; tes[i].teamId = e.target.value; setForm(f => ({ ...f, teamEstimates: tes }));
                    }} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border">
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  {(['design', 'development', 'testing', 'deployment', 'postDeploy'] as const).map(phase => (
                    <div key={phase}>
                      <label className="text-[10px] text-muted-foreground capitalize">{phase === 'postDeploy' ? 'Post-Deploy' : phase}</label>
                      <input type="number" min="0" value={te[phase]} onChange={e => {
                        const tes = [...form.teamEstimates]; tes[i][phase] = parseFloat(e.target.value) || 0; setForm(f => ({ ...f, teamEstimates: tes }));
                      }} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
                    </div>
                  ))}
                  <button onClick={() => setForm(f => ({ ...f, teamEstimates: f.teamEstimates.filter((_, j) => j !== i) }))}
                    className="p-1 text-red-400 hover:bg-muted rounded self-end mb-1"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={saveProject} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground"><Save className="w-4 h-4" /> Save</button>
              <button onClick={() => { setEditing(null); setShowAdd(false); }} className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground">Cancel</button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {projects.map(p => {
          const totalHours = p.teamEstimates.reduce((s, te) => s + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0);
          return (
            <Card key={p.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-primary bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center">{p.priority}</span>
                      <div>
                        <h3 className="font-semibold">{p.name}</h3>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-2 ml-10 text-[10px] text-muted-foreground">
                      <span className={`px-1.5 py-0.5 rounded ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : p.status === 'complete' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {p.status}
                      </span>
                      <span>{totalHours}h total</span>
                      <span>{p.teamEstimates.length} team(s): {p.teamEstimates.map(te => te.team?.name).join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-muted"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteProject(p.id)} className="p-2 rounded-lg hover:bg-muted text-red-400"><Trash2 className="w-4 h-4" /></button>
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

// Scenarios Tab
function ScenariosTab({ scenarios, teams, onRefresh }: { scenarios: Scenario[]; teams: Team[]; projects: Project[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [contractorForm, setContractorForm] = useState({ teamId: '', roleKey: 'developer', fte: 1, weeks: 12, label: '', startWeek: 0 });

  const createScenario = async () => {
    await fetch('/api/scenarios', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName || 'New Scenario' }),
    });
    setShowAdd(false); setNewName(''); onRefresh();
  };

  const deleteScenario = async (id: string) => {
    if (!confirm('Delete this scenario?')) return;
    await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const toggleLock = async (s: Scenario) => {
    await fetch(`/api/scenarios/${s.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: s.name, locked: !s.locked }),
    });
    onRefresh();
  };

  const addContractor = async (scenarioId: string) => {
    await fetch(`/api/scenarios/${scenarioId}/contractors`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contractorForm),
    });
    setContractorForm({ teamId: teams[0]?.id || '', roleKey: 'developer', fte: 1, weeks: 12, label: '', startWeek: 0 });
    onRefresh();
  };

  const removeContractor = async (scenarioId: string, contractorId: string) => {
    await fetch(`/api/scenarios/${scenarioId}/contractors`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractorId }),
    });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Scenario Modeling</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Scenario
        </button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-2">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Scenario name..."
                className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-muted border border-border" />
              <button onClick={createScenario} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground">Create</button>
              <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground">Cancel</button>
            </div>
          </CardContent>
        </Card>
      )}

      {scenarios.map(s => (
        <Card key={s.id}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {s.locked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {s.contractors.length} contractor(s) · {s.priorityOverrides.length} priority override(s)
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                  className="p-2 rounded-lg hover:bg-muted"><ChevronDown className={`w-4 h-4 transition-transform ${expanded === s.id ? 'rotate-180' : ''}`} /></button>
                <button onClick={() => toggleLock(s)} className="p-2 rounded-lg hover:bg-muted">
                  {s.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteScenario(s.id)} className="p-2 rounded-lg hover:bg-muted text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {expanded === s.id && (
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                {/* Contractors */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Contractors</h4>
                  {s.contractors.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 mb-1">
                      <div className="text-sm">
                        <span className="font-medium">{c.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {c.team?.name} · {c.roleKey} · {c.fte} FTE · {c.weeks}wk
                        </span>
                      </div>
                      <button onClick={() => removeContractor(s.id, c.id)} className="text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                  {!s.locked && (
                    <div className="grid grid-cols-7 gap-2 mt-2 items-end">
                      <div>
                        <label className="text-[10px] text-muted-foreground">Team</label>
                        <select value={contractorForm.teamId || teams[0]?.id} onChange={e => setContractorForm(f => ({ ...f, teamId: e.target.value }))}
                          className="w-full px-2 py-1 text-xs rounded bg-muted border border-border">
                          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Role</label>
                        <select value={contractorForm.roleKey} onChange={e => setContractorForm(f => ({ ...f, roleKey: e.target.value }))}
                          className="w-full px-2 py-1 text-xs rounded bg-muted border border-border">
                          {['architect', 'developer', 'qa', 'devops', 'dba', 'businessAnalyst'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">FTE</label>
                        <input type="number" step="0.5" min="0.5" value={contractorForm.fte} onChange={e => setContractorForm(f => ({ ...f, fte: parseFloat(e.target.value) || 1 }))}
                          className="w-full px-2 py-1 text-xs rounded bg-muted border border-border" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Weeks</label>
                        <input type="number" min="1" value={contractorForm.weeks} onChange={e => setContractorForm(f => ({ ...f, weeks: parseInt(e.target.value) || 12 }))}
                          className="w-full px-2 py-1 text-xs rounded bg-muted border border-border" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-muted-foreground">Label</label>
                        <input value={contractorForm.label} onChange={e => setContractorForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Contract QA"
                          className="w-full px-2 py-1 text-xs rounded bg-muted border border-border" />
                      </div>
                      <button onClick={() => addContractor(s.id)} className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">Add</button>
                    </div>
                  )}
                </div>

                {/* Priority Overrides */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><ArrowUpDown className="w-4 h-4" /> Priority Overrides</h4>
                  <p className="text-xs text-muted-foreground">Select this scenario from the header dropdown to see its impact on capacity allocation.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
