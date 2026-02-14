'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import CapacityWaterfall from '@/components/charts/CapacityWaterfall';
import RedLineChart from '@/components/charts/RedLineChart';
import TeamUtilization from '@/components/charts/TeamUtilization';
import GanttChart from '@/components/charts/GanttChart';
import DemandSupplyChart from '@/components/charts/DemandSupplyChart';
import RoleHeatmap from '@/components/charts/RoleHeatmap';
import AiAnalyst from '@/components/AiAnalyst';
import PortfolioDashboard from '@/components/PortfolioDashboard';
import ReportsPage from '@/components/ReportsPage';
import SettingsPage from '@/components/SettingsPage';
import ResourceDirectory from '@/components/ResourceDirectory';
import ResourceDetail from '@/components/ResourceDetail';
import SkillsMatrix from '@/components/SkillsMatrix';
import ResourceAnalytics from '@/components/ResourceAnalytics';
import {
  BarChart3, Users, FolderKanban, Sparkles, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, Plus, Trash2, Lock, Unlock, ChevronDown, X, Edit2, Save,
  Layers, Brain, ArrowUpDown, LayoutDashboard, FileText, Settings, Search,
  ChevronRight, Calendar, Clock, Target, Zap, Shield, DollarSign,
  Activity, PieChart, ArrowUp, ArrowDown, Filter, Download, Upload,
  UserPlus, UserMinus, Eye, MoreHorizontal, Flag, Hash, Gauge,
  UserCheck, Grid3X3, BarChart2
} from 'lucide-react';

interface Team {
  id: string; name: string;
  architectFte: number; developerFte: number; qaFte: number; devopsFte: number;
  businessAnalystFte: number; dbaFte: number; pmFte: number; productManagerFte: number;
  kloTlmHoursPerWeek: number; adminPct: number; skills?: string[];
}

interface TeamEstimate {
  id: string; teamId: string; design: number; development: number;
  testing: number; deployment: number; postDeploy: number;
  confidence?: string;
  team?: { name: string };
}

interface Milestone {
  id: string; name: string; targetWeek: number; status: string;
}

interface Project {
  id: string; name: string; priority: number; status: string;
  description: string; startWeekOffset: number; teamEstimates: TeamEstimate[];
  tshirtSize?: string; category?: string; sponsor?: string; businessValue?: string;
  requiredSkills?: string[]; dependencies?: string[]; milestones?: Milestone[];
  quarterTarget?: string; riskLevel?: string; riskNotes?: string; committedDate?: string;
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
  roles?: Record<string, { fte: number; hoursPerWeek: number }>;
}

type Tab = 'dashboard' | 'portfolio' | 'teams' | 'resources' | 'skills' | 'projects' | 'scenarios' | 'ai' | 'reports' | 'resource-analytics' | 'settings';

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-slate-500/20 text-slate-400',
  in_planning: 'bg-blue-500/20 text-blue-400',
  active: 'bg-green-500/20 text-green-400',
  on_hold: 'bg-amber-500/20 text-amber-400',
  complete: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
  proposed: 'bg-purple-500/20 text-purple-400',
};

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started', in_planning: 'In Planning', active: 'Active',
  on_hold: 'On Hold', complete: 'Complete', cancelled: 'Cancelled', proposed: 'Proposed',
};

const RISK_COLORS: Record<string, string> = {
  high: 'text-red-400', medium: 'text-amber-400', low: 'text-green-400',
};

const BV_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400', high: 'bg-amber-500/20 text-amber-400',
  medium: 'bg-blue-500/20 text-blue-400', low: 'bg-slate-500/20 text-slate-400',
};

export default function Home() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [teamCapacities, setTeamCapacities] = useState<TeamCapacity[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === '1') setTab('dashboard');
      if (e.key === '2') setTab('portfolio');
      if (e.key === '3') setTab('teams');
      if (e.key === '4') setTab('projects');
      if (e.key === '5') setTab('scenarios');
      if (e.key === '6') setTab('ai');
      if (e.key === '7') setTab('reports');
      if (e.key === '8') setTab('settings');
      if (e.key === '[') setSidebarCollapsed(c => !c);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const feasible = allocations.filter(a => a.feasible).length;
  const infeasible = allocations.filter(a => !a.feasible).length;
  const avgUtil = teamCapacities.length > 0
    ? teamCapacities.reduce((s, tc) => s + tc.utilization, 0) / teamCapacities.length : 0;
  const totalCapacity = teamCapacities.reduce((s, tc) => s + tc.projectCapacityPerWeek, 0);
  const totalFte = teams.reduce((s, t) => s + t.architectFte + t.developerFte + t.qaFte + t.devopsFte + t.businessAnalystFte + t.dbaFte + t.pmFte + t.productManagerFte, 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const atRiskProjects = projects.filter(p => p.riskLevel === 'high').length;

  const navSections = [
    { label: 'Overview', items: [
      { id: 'dashboard' as Tab, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, badge: null },
      { id: 'portfolio' as Tab, label: 'Portfolio', icon: <PieChart className="w-4 h-4" />, badge: `${projects.length}` },
    ]},
    { label: 'Planning', items: [
      { id: 'teams' as Tab, label: 'Teams', icon: <Users className="w-4 h-4" />, badge: `${teams.length}` },
      { id: 'resources' as Tab, label: 'Resources', icon: <UserCheck className="w-4 h-4" />, badge: null },
      { id: 'skills' as Tab, label: 'Skills Matrix', icon: <Grid3X3 className="w-4 h-4" />, badge: null },
      { id: 'projects' as Tab, label: 'Projects', icon: <FolderKanban className="w-4 h-4" />, badge: `${projects.length}` },
      { id: 'scenarios' as Tab, label: 'Scenarios', icon: <Layers className="w-4 h-4" />, badge: `${scenarios.length}` },
    ]},
    { label: 'Intelligence', items: [
      { id: 'ai' as Tab, label: 'AI Analyst', icon: <Brain className="w-4 h-4" />, badge: null },
      { id: 'reports' as Tab, label: 'Reports', icon: <FileText className="w-4 h-4" />, badge: null },
      { id: 'resource-analytics' as Tab, label: 'People Analytics', icon: <BarChart2 className="w-4 h-4" />, badge: null },
    ]},
    { label: 'System', items: [
      { id: 'settings' as Tab, label: 'Settings', icon: <Settings className="w-4 h-4" />, badge: null },
    ]},
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-56'} flex-shrink-0 border-r border-border bg-card/30 flex flex-col transition-all duration-200 sticky top-0 h-screen`}>
        {/* Logo */}
        <div className="p-3 border-b border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">IT Capacity Planner</h1>
              <p className="text-[9px] text-muted-foreground">Enterprise Resource Planning</p>
            </div>
          )}
        </div>

        {/* Scenario Selector */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2 border-b border-border">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Scenario</label>
            <select
              value={selectedScenario}
              onChange={e => setSelectedScenario(e.target.value)}
              className="w-full mt-1 px-2 py-1 text-xs rounded bg-muted border border-border focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <option value="">Baseline</option>
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>{s.name} {s.locked ? '🔒' : ''}</option>
              ))}
            </select>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navSections.map(section => (
            <div key={section.label} className="mb-2">
              {!sidebarCollapsed && (
                <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{section.label}</p>
              )}
              {section.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); if (item.id !== 'resources') setSelectedResourceId(null); }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                    tab === item.id
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted">{item.badge}</span>}
                    </>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(c => !c)}
          className="p-2 border-t border-border text-muted-foreground hover:text-foreground text-xs flex items-center justify-center gap-1"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronDown className="w-3 h-3 -rotate-90" /> <span>Collapse</span></>}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{navSections.flatMap(s => s.items).find(i => i.id === tab)?.label}</h2>
            {tab !== 'dashboard' && (
              <span className="text-xs text-muted-foreground">/ {navSections.find(s => s.items.some(i => i.id === tab))?.label}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{totalFte.toFixed(0)} FTE</span>
            <span className="flex items-center gap-1"><FolderKanban className="w-3 h-3" />{activeProjects} Active</span>
            {atRiskProjects > 0 && <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="w-3 h-3" />{atRiskProjects} At Risk</span>}
            <span className="hidden md:inline text-[10px] text-muted-foreground/50">Press 1-8 for nav · [ toggle sidebar</span>
          </div>
        </header>

        <div className="p-6">
          {tab === 'dashboard' && <DashboardTab
            allocations={allocations} teamCapacities={teamCapacities}
            feasible={feasible} infeasible={infeasible} avgUtil={avgUtil} totalCapacity={totalCapacity}
            teams={teams} projects={projects} totalFte={totalFte}
          />}
          {tab === 'portfolio' && <PortfolioDashboard projects={projects} allocations={allocations} teams={teams} teamCapacities={teamCapacities} />}
          {tab === 'resources' && (
            selectedResourceId
              ? <ResourceDetail resourceId={selectedResourceId} onBack={() => setSelectedResourceId(null)} />
              : <ResourceDirectory onSelectResource={(id) => setSelectedResourceId(id)} />
          )}
          {tab === 'skills' && <SkillsMatrix />}
          {tab === 'resource-analytics' && <ResourceAnalytics />}
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
          {tab === 'reports' && <ReportsPage projects={projects} teams={teams} allocations={allocations} teamCapacities={teamCapacities} />}
          {tab === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}

// Dashboard Tab
function DashboardTab({ allocations, teamCapacities, feasible, infeasible, avgUtil, totalCapacity, teams, projects, totalFte }: {
  allocations: Allocation[]; teamCapacities: TeamCapacity[];
  feasible: number; infeasible: number; avgUtil: number; totalCapacity: number;
  teams: Team[]; projects: Project[]; totalFte: number;
}) {
  const criticalProjects = projects.filter(p => p.businessValue === 'critical');
  const totalEstimatedHours = projects.reduce((s, p) => s + p.teamEstimates.reduce((s2, te) => s2 + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0), 0);

  return (
    <div className="space-y-6">
      {/* KPIs Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KPICard label="Total FTE" value={totalFte.toFixed(0)} icon={<Users className="w-5 h-5" />} color="text-blue-400" />
        <KPICard label="Active Teams" value={`${teams.length}`} icon={<Target className="w-5 h-5" />} color="text-purple-400" />
        <KPICard label="Projects" value={`${projects.length}`} sub={`${feasible} feasible`} icon={<FolderKanban className="w-5 h-5" />} color="text-green-400" />
        <KPICard label="Avg Utilization" value={`${avgUtil.toFixed(0)}%`} icon={<Gauge className="w-5 h-5" />}
          color={avgUtil > 90 ? 'text-red-400' : avgUtil > 75 ? 'text-amber-400' : 'text-blue-400'} />
        <KPICard label="Weekly Capacity" value={`${totalCapacity.toFixed(0)}h`} icon={<Clock className="w-5 h-5" />} color="text-cyan-400" />
        <KPICard label="Total Demand" value={`${(totalEstimatedHours/1000).toFixed(1)}K h`} icon={<TrendingUp className="w-5 h-5" />} color="text-amber-400" />
      </div>

      {/* Risk / At-a-glance */}
      {infeasible > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">{infeasible} project{infeasible > 1 ? 's' : ''} exceed capacity within the 12-month planning window</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {allocations.filter(a => !a.feasible).map(a => a.projectName).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Capacity Waterfall</CardTitle>
            <CardDescription>How each team&apos;s hours are consumed (per week)</CardDescription>
          </CardHeader>
          <CardContent><CapacityWaterfall data={teamCapacities} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              The Red Line
              {infeasible > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{infeasible} over</span>}
            </CardTitle>
            <CardDescription>Project feasibility within 12-month window</CardDescription>
          </CardHeader>
          <CardContent><RedLineChart data={allocations} /></CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Demand vs Supply</CardTitle>
            <CardDescription>Projected demand against available capacity over 12 months</CardDescription>
          </CardHeader>
          <CardContent><DemandSupplyChart allocations={allocations} teamCapacities={teamCapacities} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Team Utilization</CardTitle>
            <CardDescription>Project capacity consumption per team</CardDescription>
          </CardHeader>
          <CardContent><TeamUtilization data={teamCapacities} /></CardContent>
        </Card>
      </div>

      {/* Gantt */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Project Timeline</CardTitle>
          <CardDescription>Phase-level Gantt across 12-month planning window</CardDescription>
        </CardHeader>
        <CardContent><GanttChart data={allocations} /></CardContent>
      </Card>

      {/* Role Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Role Utilization Heatmap</CardTitle>
          <CardDescription>Identify role-level bottlenecks across teams</CardDescription>
        </CardHeader>
        <CardContent><RoleHeatmap teams={teams} teamCapacities={teamCapacities} allocations={allocations} /></CardContent>
      </Card>

      {/* Bottleneck & Risk Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Bottleneck Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allocations.filter(a => a.bottleneck).slice(0, 8).map(a => (
                <div key={a.projectId} className={`p-2 rounded-lg border ${a.feasible ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{a.priority}. {a.projectName}</span>
                    {a.feasible ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <XCircle className="w-3 h-3 text-red-400" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Bottleneck: {a.bottleneck?.teamName} · {a.totalWeeks}w · Wk {a.startWeek}-{a.endWeek}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" /> Risk Register
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects.filter(p => p.riskLevel === 'high' || p.riskLevel === 'medium').sort((a,b) => (a.riskLevel === 'high' ? 0 : 1) - (b.riskLevel === 'high' ? 0 : 1)).slice(0, 8).map(p => (
                <div key={p.id} className="p-2 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{p.name}</span>
                    <span className={`text-[10px] font-medium ${RISK_COLORS[p.riskLevel || 'low']}`}>{p.riskLevel?.toUpperCase()}</span>
                  </div>
                  {p.riskNotes && <p className="text-[10px] text-muted-foreground mt-0.5">{p.riskNotes}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Projects & Commitments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-400" /> Commitment Tracker
          </CardTitle>
          <CardDescription>Business-critical commitments and delivery status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Project</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Sponsor</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Committed</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Quarter</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Delivery</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {projects.filter(p => p.committedDate || p.businessValue === 'critical').map(p => {
                  const alloc = allocations.find(a => a.projectId === p.id);
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-2 font-medium">{p.priority}. {p.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{p.sponsor || '-'}</td>
                      <td className="py-2 px-2 text-muted-foreground">{p.committedDate || '-'}</td>
                      <td className="py-2 px-2"><span className="px-1.5 py-0.5 rounded bg-muted">{p.quarterTarget || '-'}</span></td>
                      <td className="py-2 px-2"><span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status] || p.status}</span></td>
                      <td className="py-2 px-2">
                        {alloc ? (
                          <span className={alloc.feasible ? 'text-green-400' : 'text-red-400'}>
                            {alloc.feasible ? `Wk ${alloc.endWeek}` : 'Over capacity'}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-2 px-2"><span className={RISK_COLORS[p.riskLevel || 'low']}>{p.riskLevel || 'low'}</span></td>
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

function KPICard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
          </div>
          <div className={`${color} opacity-40`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Teams Tab
function TeamsTab({ teams, onRefresh }: { teams: Team[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Team>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  const startEdit = (team: Team) => { setEditing(team.id); setForm(team); };

  const saveEdit = async () => {
    if (!editing) return;
    const { id: _id, ...data } = form as Team;
    await fetch(`/api/teams/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setEditing(null); onRefresh();
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
        name: form.name || 'New Team', architectFte: form.architectFte || 0, developerFte: form.developerFte || 0,
        qaFte: form.qaFte || 0, devopsFte: form.devopsFte || 0, businessAnalystFte: form.businessAnalystFte || 0,
        dbaFte: form.dbaFte || 0, pmFte: form.pmFte || 0, productManagerFte: form.productManagerFte || 0,
        kloTlmHoursPerWeek: form.kloTlmHoursPerWeek || 0, adminPct: form.adminPct || 25,
      }),
    });
    setShowAdd(false); setForm({}); onRefresh();
  };

  const RoleInput = ({ label, field }: { label: string; field: keyof Team }) => (
    <div>
      <label className="text-[10px] text-muted-foreground">{label}</label>
      <input type="number" step="0.5" min="0" value={(form as Record<string, number>)[field as string] || 0}
        onChange={e => setForm(f => ({ ...f, [field]: parseFloat(e.target.value) || 0 }))}
        className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <h2 className="text-lg font-semibold">Team Management</h2>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams..."
              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-muted border border-border" />
          </div>
        </div>
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
              <RoleInput label="Architects" field="architectFte" />
              <RoleInput label="Developers" field="developerFte" />
              <RoleInput label="QA" field="qaFte" />
              <RoleInput label="DevOps" field="devopsFte" />
              <RoleInput label="BA" field="businessAnalystFte" />
              <RoleInput label="DBA" field="dbaFte" />
              <RoleInput label="PM" field="pmFte" />
              <RoleInput label="Product Mgr" field="productManagerFte" />
              <RoleInput label="KLO/TLM (hrs/wk)" field="kloTlmHoursPerWeek" />
              <RoleInput label="Admin %" field="adminPct" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={editing ? saveEdit : addTeam} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground"><Save className="w-4 h-4" /> Save</button>
              <button onClick={() => { setEditing(null); setShowAdd(false); }} className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground">Cancel</button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {filtered.map(team => {
          const totalFte = team.architectFte + team.developerFte + team.qaFte + team.devopsFte + team.businessAnalystFte + team.dbaFte + team.pmFte + team.productManagerFte;
          const totalHours = totalFte * 40;
          const afterKlo = totalHours - team.kloTlmHoursPerWeek;
          const projCap = afterKlo * (1 - team.adminPct / 100);
          return (
            <Card key={team.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{team.name}</h3>
                      {team.skills && team.skills.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {team.skills.slice(0, 4).map(s => (
                            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                          ))}
                          {team.skills.length > 4 && <span className="text-[9px] text-muted-foreground">+{team.skills.length - 4}</span>}
                        </div>
                      )}
                    </div>
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
                      {team.pmFte > 0 && <span>PM: {team.pmFte}</span>}
                      <span>KLO: {team.kloTlmHoursPerWeek}h</span>
                      <span>Admin: {team.adminPct}%</span>
                    </div>
                    {/* Capacity bar */}
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div className="bg-red-400 h-full" style={{ width: `${(team.kloTlmHoursPerWeek / totalHours * 100).toFixed(0)}%` }} />
                        <div className="bg-amber-400 h-full" style={{ width: `${(team.adminPct * (1 - team.kloTlmHoursPerWeek / totalHours)).toFixed(0)}%` }} />
                        <div className="bg-green-400 h-full" style={{ width: `${(projCap / totalHours * 100).toFixed(0)}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-1 text-[9px] text-muted-foreground">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />KLO/TLM</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Admin</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />Project</span>
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [view, setView] = useState<'list' | 'board'>('list');

  const categories = Array.from(new Set(projects.map(p => p.category).filter(Boolean))) as string[];

  type FormType = {
    name: string; priority: number; status: string; description: string; startWeekOffset: number;
    tshirtSize?: string; category?: string; sponsor?: string; businessValue?: string; quarterTarget?: string;
    riskLevel?: string; riskNotes?: string; committedDate?: string;
    teamEstimates: { teamId: string; design: number; development: number; testing: number; deployment: number; postDeploy: number; confidence?: string }[];
  };
  const [form, setForm] = useState<FormType>({
    name: '', priority: projects.length + 1, status: 'not_started', description: '', startWeekOffset: 0,
    teamEstimates: [],
  });

  // T-shirt size templates
  const TSHIRT_TEMPLATES: Record<string, { design: number; development: number; testing: number; deployment: number; postDeploy: number }> = {
    S: { design: 8, development: 20, testing: 8, deployment: 4, postDeploy: 4 },
    M: { design: 32, development: 120, testing: 40, deployment: 16, postDeploy: 16 },
    L: { design: 60, development: 280, testing: 100, deployment: 32, postDeploy: 40 },
    XL: { design: 120, development: 560, testing: 200, deployment: 80, postDeploy: 80 },
  };

  const applyTemplate = (size: string) => {
    const tmpl = TSHIRT_TEMPLATES[size];
    if (!tmpl) return;
    if (form.teamEstimates.length === 0 && teams.length > 0) {
      setForm(f => ({ ...f, tshirtSize: size, teamEstimates: [{ teamId: teams[0].id, design: tmpl.design, development: tmpl.development, testing: tmpl.testing, deployment: tmpl.deployment, postDeploy: tmpl.postDeploy, confidence: 'medium' }] }));
    } else {
      setForm(f => ({
        ...f, tshirtSize: size,
        teamEstimates: f.teamEstimates.map(te => ({ ...te, design: tmpl.design, development: tmpl.development, testing: tmpl.testing, deployment: tmpl.deployment, postDeploy: tmpl.postDeploy })),
      }));
    }
  };

  const startEdit = (p: Project) => {
    setEditing(p.id);
    setForm({
      name: p.name, priority: p.priority, status: p.status, description: p.description,
      startWeekOffset: p.startWeekOffset, tshirtSize: p.tshirtSize, category: p.category,
      sponsor: p.sponsor, businessValue: p.businessValue, quarterTarget: p.quarterTarget,
      riskLevel: p.riskLevel, riskNotes: p.riskNotes, committedDate: p.committedDate,
      teamEstimates: p.teamEstimates.map(te => ({
        teamId: te.teamId, design: te.design, development: te.development,
        testing: te.testing, deployment: te.deployment, postDeploy: te.postDeploy,
        confidence: te.confidence,
      })),
    });
  };

  const saveProject = async () => {
    if (editing) {
      await fetch(`/api/projects/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setEditing(null); setShowAdd(false); onRefresh();
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const filtered = projects.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <h2 className="text-lg font-semibold">Projects</h2>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
              className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-muted border border-border" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-2 py-1.5 text-xs rounded-lg bg-muted border border-border">
            <option value="all">All Status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-2 py-1.5 text-xs rounded-lg bg-muted border border-border">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c!}>{c}</option>)}
          </select>
          <button onClick={() => { setShowAdd(true); setForm({ name: '', priority: projects.length + 1, status: 'not_started', description: '', startWeekOffset: 0, teamEstimates: [] }); }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Add Project
          </button>
        </div>
      </div>

      {(showAdd || editing) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editing ? 'Edit Project' : 'New Project'}</CardTitle>
            <CardDescription>
              {!editing && (
                <span className="flex items-center gap-2 mt-1">
                  Quick size:
                  {['S', 'M', 'L', 'XL'].map(s => (
                    <button key={s} onClick={() => applyTemplate(s)}
                      className={`px-2 py-0.5 rounded text-xs border ${form.tshirtSize === s ? 'border-primary bg-primary/20 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                      {s} ({s === 'S' ? '~40h' : s === 'M' ? '~200h' : s === 'L' ? '~500h' : '~1000h'})
                    </button>
                  ))}
                </span>
              )}
            </CardDescription>
          </CardHeader>
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
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-muted-foreground">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Category</label>
                <input value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" placeholder="e.g. Digital Transformation" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Sponsor</label>
                <input value={form.sponsor || ''} onChange={e => setForm(f => ({ ...f, sponsor: e.target.value }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" placeholder="e.g. VP Sales" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Business Value</label>
                <select value={form.businessValue || ''} onChange={e => setForm(f => ({ ...f, businessValue: e.target.value }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border">
                  <option value="">Select...</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Quarter Target</label>
                <select value={form.quarterTarget || ''} onChange={e => setForm(f => ({ ...f, quarterTarget: e.target.value }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border">
                  <option value="">Select...</option>
                  <option value="Q1 2026">Q1 2026</option>
                  <option value="Q2 2026">Q2 2026</option>
                  <option value="Q3 2026">Q3 2026</option>
                  <option value="Q4 2026">Q4 2026</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Risk Level</label>
                <select value={form.riskLevel || ''} onChange={e => setForm(f => ({ ...f, riskLevel: e.target.value }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border">
                  <option value="">Select...</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Start Offset (weeks)</label>
                <input type="number" min="0" value={form.startWeekOffset} onChange={e => setForm(f => ({ ...f, startWeekOffset: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Committed Date</label>
                <input type="date" value={form.committedDate || ''} onChange={e => setForm(f => ({ ...f, committedDate: e.target.value }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" />
              </div>
            </div>

            {/* Team Estimates */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium">Team Estimates (hours per phase)</label>
                <button onClick={() => setForm(f => ({ ...f, teamEstimates: [...f.teamEstimates, { teamId: teams[0]?.id || '', design: 0, development: 0, testing: 0, deployment: 0, postDeploy: 0, confidence: 'medium' }] }))}
                  className="text-xs text-primary hover:underline">+ Add Team</button>
              </div>
              {form.teamEstimates.map((te, i) => (
                <div key={i} className="grid grid-cols-8 gap-2 mb-2 items-end">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Team</label>
                    <select value={te.teamId} onChange={e => { const tes = [...form.teamEstimates]; tes[i].teamId = e.target.value; setForm(f => ({ ...f, teamEstimates: tes })); }}
                      className="w-full px-2 py-1 text-xs rounded bg-muted border border-border">
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  {(['design', 'development', 'testing', 'deployment', 'postDeploy'] as const).map(phase => (
                    <div key={phase}>
                      <label className="text-[10px] text-muted-foreground capitalize">{phase === 'postDeploy' ? 'Post-Deploy' : phase}</label>
                      <input type="number" min="0" value={te[phase]} onChange={e => { const tes = [...form.teamEstimates]; tes[i][phase] = parseFloat(e.target.value) || 0; setForm(f => ({ ...f, teamEstimates: tes })); }}
                        className="w-full px-2 py-1 text-xs rounded bg-muted border border-border" />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] text-muted-foreground">Confidence</label>
                    <select value={te.confidence || 'medium'} onChange={e => { const tes = [...form.teamEstimates]; tes[i].confidence = e.target.value; setForm(f => ({ ...f, teamEstimates: tes })); }}
                      className="w-full px-2 py-1 text-xs rounded bg-muted border border-border">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
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

      {/* Project list */}
      <div className="space-y-2">
        {filtered.map(p => {
          const totalHours = p.teamEstimates.reduce((s, te) => s + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0);
          const phaseBreakdown = { design: 0, development: 0, testing: 0, deployment: 0, postDeploy: 0 };
          p.teamEstimates.forEach(te => { phaseBreakdown.design += te.design; phaseBreakdown.development += te.development; phaseBreakdown.testing += te.testing; phaseBreakdown.deployment += te.deployment; phaseBreakdown.postDeploy += te.postDeploy; });

          return (
            <Card key={p.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-primary bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">{p.priority}</span>
                      <h3 className="font-semibold text-sm">{p.name}</h3>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status] || p.status}</span>
                      {p.tshirtSize && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{p.tshirtSize}</span>}
                      {p.businessValue && <span className={`text-[10px] px-1.5 py-0.5 rounded ${BV_COLORS[p.businessValue]}`}>{p.businessValue}</span>}
                      {p.riskLevel && <span className={`text-[10px] ${RISK_COLORS[p.riskLevel]}`}>● {p.riskLevel} risk</span>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{p.description}</p>
                    <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                      <span>{totalHours}h total</span>
                      <span>{p.teamEstimates.length} team(s)</span>
                      {p.category && <span>{p.category}</span>}
                      {p.sponsor && <span>Sponsor: {p.sponsor}</span>}
                      {p.quarterTarget && <span>{p.quarterTarget}</span>}
                    </div>
                    {/* Phase bars */}
                    {totalHours > 0 && (
                      <div className="flex mt-2 h-1.5 rounded-full overflow-hidden bg-muted">
                        <div className="bg-violet-500 h-full" style={{ width: `${phaseBreakdown.design / totalHours * 100}%` }} title={`Design: ${phaseBreakdown.design}h`} />
                        <div className="bg-blue-500 h-full" style={{ width: `${phaseBreakdown.development / totalHours * 100}%` }} title={`Dev: ${phaseBreakdown.development}h`} />
                        <div className="bg-amber-500 h-full" style={{ width: `${phaseBreakdown.testing / totalHours * 100}%` }} title={`Test: ${phaseBreakdown.testing}h`} />
                        <div className="bg-green-500 h-full" style={{ width: `${phaseBreakdown.deployment / totalHours * 100}%` }} title={`Deploy: ${phaseBreakdown.deployment}h`} />
                        <div className="bg-cyan-500 h-full" style={{ width: `${phaseBreakdown.postDeploy / totalHours * 100}%` }} title={`Post: ${phaseBreakdown.postDeploy}h`} />
                      </div>
                    )}
                    {/* Milestones */}
                    {p.milestones && p.milestones.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {p.milestones.map(m => (
                          <span key={m.id} className={`text-[9px] px-1.5 py-0.5 rounded ${m.status === 'complete' ? 'bg-green-500/20 text-green-400' : m.status === 'at_risk' ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                            {m.name} (Wk {m.targetWeek})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-muted"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteProject(p.id)} className="p-1.5 rounded-lg hover:bg-muted text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
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
function ScenariosTab({ scenarios, teams, projects, onRefresh }: { scenarios: Scenario[]; teams: Team[]; projects: Project[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [contractorForm, setContractorForm] = useState({ teamId: '', roleKey: 'developer', fte: 1, weeks: 12, label: '', startWeek: 0 });

  const createScenario = async () => {
    await fetch('/api/scenarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName || 'New Scenario' }) });
    setShowAdd(false); setNewName(''); onRefresh();
  };

  const deleteScenario = async (id: string) => {
    if (!confirm('Delete this scenario?')) return;
    await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const toggleLock = async (s: Scenario) => {
    await fetch(`/api/scenarios/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: s.name, locked: !s.locked }) });
    onRefresh();
  };

  const addContractor = async (scenarioId: string) => {
    await fetch(`/api/scenarios/${scenarioId}/contractors`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contractorForm) });
    setContractorForm({ teamId: teams[0]?.id || '', roleKey: 'developer', fte: 1, weeks: 12, label: '', startWeek: 0 });
    onRefresh();
  };

  const removeContractor = async (scenarioId: string, contractorId: string) => {
    await fetch(`/api/scenarios/${scenarioId}/contractors`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contractorId }) });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Scenario Modeling</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Create what-if scenarios to model different staffing and prioritization strategies</p>
        </div>
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
                <button onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="p-2 rounded-lg hover:bg-muted">
                  <ChevronDown className={`w-4 h-4 transition-transform ${expanded === s.id ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => toggleLock(s)} className="p-2 rounded-lg hover:bg-muted">
                  {s.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
                <button onClick={() => deleteScenario(s.id)} className="p-2 rounded-lg hover:bg-muted text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            {expanded === s.id && (
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Contractors</h4>
                  {s.contractors.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 mb-1">
                      <div className="text-sm">
                        <span className="font-medium">{c.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{c.team?.name} · {c.roleKey} · {c.fte} FTE · {c.weeks}wk from wk {c.startWeek}</span>
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
                          {['architect', 'developer', 'qa', 'devops', 'dba', 'businessAnalyst', 'pm'].map(r => <option key={r} value={r}>{r}</option>)}
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
                      <div>
                        <label className="text-[10px] text-muted-foreground">Start Wk</label>
                        <input type="number" min="0" value={contractorForm.startWeek} onChange={e => setContractorForm(f => ({ ...f, startWeek: parseInt(e.target.value) || 0 }))}
                          className="w-full px-2 py-1 text-xs rounded bg-muted border border-border" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Label</label>
                        <input value={contractorForm.label} onChange={e => setContractorForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Contract QA"
                          className="w-full px-2 py-1 text-xs rounded bg-muted border border-border" />
                      </div>
                      <button onClick={() => addContractor(s.id)} className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">Add</button>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><ArrowUpDown className="w-4 h-4" /> Priority Overrides</h4>
                  {s.priorityOverrides.length > 0 ? (
                    <div className="space-y-1">
                      {s.priorityOverrides.map(po => {
                        const proj = projects.find(p => p.id === po.projectId);
                        return (
                          <div key={po.projectId} className="text-xs p-2 rounded bg-muted/50">
                            {proj?.name}: Priority → {po.priority}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Select this scenario from the sidebar to see its impact.</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
