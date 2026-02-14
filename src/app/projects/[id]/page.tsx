'use client';
import { csrfFetch } from '@/lib/csrf-client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell, Legend } from 'recharts';
import {
  ArrowLeft, Edit2, Trash2, ChevronRight, Save, Clock, Target, Shield,
  AlertTriangle, Users, Calendar, DollarSign, FolderKanban, Flag,
  CheckCircle2, XCircle, TrendingUp, UserPlus, X, Plus
} from 'lucide-react';

interface TeamEstimate {
  id: string; teamId: string; design: number; development: number; testing: number;
  deployment: number; postDeploy: number; confidence?: string; team?: { name: string };
}

interface Milestone { id: string; name: string; targetWeek: number; status: string; }

interface Project {
  id: string; name: string; priority: number; status: string; description: string;
  startWeekOffset: number; teamEstimates: TeamEstimate[]; tshirtSize?: string;
  category?: string; sponsor?: string; businessValue?: string; estimatedRoi?: string;
  strategicNotes?: string; targetStartDate?: string; targetEndDate?: string;
  requiredSkills: string[]; dependencies: string[]; milestones: Milestone[];
  quarterTarget?: string; riskLevel?: string; riskNotes?: string; riskMitigation?: string;
  committedDate?: string; statusHistory: any[];
}

interface ActualEntry { id: string; phase: string; week: number; hours: number; teamId: string; }

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started', in_planning: 'In Planning', active: 'Active',
  on_hold: 'On Hold', complete: 'Complete', cancelled: 'Cancelled', proposed: 'Proposed',
};
const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-slate-500/20 text-slate-400', in_planning: 'bg-blue-500/20 text-blue-400',
  active: 'bg-green-500/20 text-green-400', on_hold: 'bg-amber-500/20 text-amber-400',
  complete: 'bg-emerald-500/20 text-emerald-400', cancelled: 'bg-red-500/20 text-red-400',
  proposed: 'bg-purple-500/20 text-purple-400',
};
const BV_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400', high: 'bg-amber-500/20 text-amber-400',
  medium: 'bg-blue-500/20 text-blue-400', low: 'bg-slate-500/20 text-slate-400',
};
const RISK_COLORS: Record<string, string> = { high: 'text-red-400', medium: 'text-amber-400', low: 'text-green-400' };
const PHASE_COLORS: Record<string, string> = {
  design: '#8b5cf6', development: '#3b82f6', testing: '#f59e0b', deployment: '#10b981', postDeploy: '#06b6d4',
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [actuals, setActuals] = useState<ActualEntry[]>([]);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActualForm, setShowActualForm] = useState(false);
  const [actualForm, setActualForm] = useState({ teamId: '', phase: 'design', week: 1, hours: 0 });

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then(r => r.json()),
      fetch(`/api/actuals?projectId=${id}`).then(r => r.ok ? r.json() : []),
      fetch('/api/projects').then(r => r.json()),
      fetch(`/api/resources/assignments?projectId=${id}`).then(r => r.ok ? r.json() : []),
    ]).then(([proj, acts, allP, assigns]) => {
      setProject(proj);
      setActuals(acts);
      setAllProjects(allP.map((p: any) => ({ id: p.id, name: p.name })));
      setAssignments(assigns);
      setLoading(false);
    });
  }, [id]);

  const saveActual = async () => {
    await csrfFetch('/api/actuals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...actualForm, projectId: id }),
    });
    const acts = await csrfFetch(`/api/actuals?projectId=${id}`).then(r => r.ok ? r.json() : []);
    setActuals(acts);
    setShowActualForm(false);
    setActualForm({ teamId: '', phase: 'design', week: 1, hours: 0 });
  };

  if (loading || !project) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalEstimated = project.teamEstimates.reduce((s, te) => s + te.design + te.development + te.testing + te.deployment + te.postDeploy, 0);
  const totalActual = actuals.reduce((s, a) => s + a.hours, 0);
  const variance = totalEstimated > 0 ? ((totalActual - totalEstimated) / totalEstimated * 100) : 0;
  const depProjects = project.dependencies.map(depId => allProjects.find(p => p.id === depId)).filter(Boolean);

  // Phase breakdown per team
  const phaseData = ['design', 'development', 'testing', 'deployment', 'postDeploy'].map(phase => {
    const row: any = { phase: phase === 'postDeploy' ? 'Post-Deploy' : phase.charAt(0).toUpperCase() + phase.slice(1) };
    project.teamEstimates.forEach(te => {
      row[te.team?.name || te.teamId] = (te as any)[phase] || 0;
    });
    return row;
  });

  // Actuals by phase
  const actualsByPhase: Record<string, number> = {};
  actuals.forEach(a => { actualsByPhase[a.phase] = (actualsByPhase[a.phase] || 0) + a.hours; });

  const estimatesByPhase = {
    design: project.teamEstimates.reduce((s, te) => s + te.design, 0),
    development: project.teamEstimates.reduce((s, te) => s + te.development, 0),
    testing: project.teamEstimates.reduce((s, te) => s + te.testing, 0),
    deployment: project.teamEstimates.reduce((s, te) => s + te.deployment, 0),
    postDeploy: project.teamEstimates.reduce((s, te) => s + te.postDeploy, 0),
  };

  const varianceData = Object.entries(estimatesByPhase).map(([phase, est]) => ({
    phase: phase === 'postDeploy' ? 'Post-Deploy' : phase.charAt(0).toUpperCase() + phase.slice(1),
    estimated: est,
    actual: actualsByPhase[phase] || 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
          <button onClick={() => router.push('/')} className="hover:text-foreground">Dashboard</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => router.push('/')} className="hover:text-foreground">Projects</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{project.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
          <div className="flex items-start gap-3">
            <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-muted mt-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-primary bg-primary/10 w-7 h-7 rounded-full flex items-center justify-center">#{project.priority}</span>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[project.status]}`}>{STATUS_LABELS[project.status]}</span>
                {project.businessValue && <span className={`px-2 py-0.5 rounded text-xs ${BV_COLORS[project.businessValue]}`}>{project.businessValue}</span>}
                {project.tshirtSize && <span className="px-2 py-0.5 rounded text-xs bg-muted">{project.tshirtSize}</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                {project.category && <span><FolderKanban className="w-3 h-3 inline mr-1" />{project.category}</span>}
                {project.sponsor && <span><Users className="w-3 h-3 inline mr-1" />Sponsor: {project.sponsor}</span>}
                {project.quarterTarget && <span><Calendar className="w-3 h-3 inline mr-1" />{project.quarterTarget}</span>}
                {project.committedDate && <span><Target className="w-3 h-3 inline mr-1" />Due: {project.committedDate}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => router.push('/')} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted">
              <Edit2 className="w-3 h-3" /> Edit
            </button>
            <button onClick={async () => { if (!confirm('Delete?')) return; await csrfFetch(`/api/projects/${id}`, { method: 'DELETE' }); router.push('/'); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Estimated Hours</p>
            <p className="text-2xl font-bold text-blue-400">{totalEstimated.toLocaleString()}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Actual Hours</p>
            <p className="text-2xl font-bold text-purple-400">{totalActual.toLocaleString()}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Variance</p>
            <p className={`text-2xl font-bold ${variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
            </p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Teams</p>
            <p className="text-2xl font-bold text-amber-400">{project.teamEstimates.length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Risk</p>
            <p className={`text-2xl font-bold ${RISK_COLORS[project.riskLevel || 'low']}`}>
              {(project.riskLevel || 'low').toUpperCase()}
            </p>
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Business Case */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Business Case</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[10px] text-muted-foreground uppercase">Sponsor</p><p>{project.sponsor || '-'}</p></div>
                  <div><p className="text-[10px] text-muted-foreground uppercase">Business Value</p><p className="capitalize">{project.businessValue || '-'}</p></div>
                  <div><p className="text-[10px] text-muted-foreground uppercase">Estimated ROI</p><p>{project.estimatedRoi || '-'}</p></div>
                  <div><p className="text-[10px] text-muted-foreground uppercase">Committed Date</p><p>{project.committedDate || '-'}</p></div>
                </div>
                {project.strategicNotes && (
                  <div><p className="text-[10px] text-muted-foreground uppercase">Strategic Alignment</p><p className="text-muted-foreground">{project.strategicNotes}</p></div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Risk */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4" /> Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${RISK_COLORS[project.riskLevel || 'low']}`}>
                    {(project.riskLevel || 'low').toUpperCase()} RISK
                  </span>
                </div>
                {project.riskNotes && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Risk Notes</p>
                    <p className="text-muted-foreground">{project.riskNotes}</p>
                  </div>
                )}
                {project.riskMitigation && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase mb-1">Mitigation Plan</p>
                    <p className="text-muted-foreground">{project.riskMitigation}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase Estimate Matrix */}
        <Card className="mb-6">
          <CardHeader className="pb-2"><CardTitle className="text-base">Phase Estimates by Team (hours)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Team</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Design</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Development</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Testing</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Deploy</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Post-Deploy</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium">Total</th>
                    <th className="text-center py-2 px-2 text-muted-foreground font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {project.teamEstimates.map(te => {
                    const total = te.design + te.development + te.testing + te.deployment + te.postDeploy;
                    const confColor = te.confidence === 'high' ? 'text-green-400' : te.confidence === 'low' ? 'text-red-400' : 'text-amber-400';
                    return (
                      <tr key={te.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2 font-medium">
                          <button onClick={() => router.push(`/teams/${te.teamId}`)} className="hover:text-primary">{te.team?.name || te.teamId}</button>
                        </td>
                        <td className="py-2 px-2 text-right">{te.design}</td>
                        <td className="py-2 px-2 text-right">{te.development}</td>
                        <td className="py-2 px-2 text-right">{te.testing}</td>
                        <td className="py-2 px-2 text-right">{te.deployment}</td>
                        <td className="py-2 px-2 text-right">{te.postDeploy}</td>
                        <td className="py-2 px-2 text-right font-bold">{total}</td>
                        <td className={`py-2 px-2 text-center capitalize ${confColor}`}>{te.confidence || 'medium'}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold">
                    <td className="py-2 px-2">Total</td>
                    <td className="py-2 px-2 text-right">{estimatesByPhase.design}</td>
                    <td className="py-2 px-2 text-right">{estimatesByPhase.development}</td>
                    <td className="py-2 px-2 text-right">{estimatesByPhase.testing}</td>
                    <td className="py-2 px-2 text-right">{estimatesByPhase.deployment}</td>
                    <td className="py-2 px-2 text-right">{estimatesByPhase.postDeploy}</td>
                    <td className="py-2 px-2 text-right">{totalEstimated}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Actuals vs Estimates */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Actuals vs Estimates</CardTitle>
              <button onClick={() => { setShowActualForm(true); if (project.teamEstimates.length) setActualForm(f => ({ ...f, teamId: project.teamEstimates[0].teamId })); }}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary text-primary-foreground">
                <Plus className="w-3 h-3" /> Log Hours
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {showActualForm && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 p-3 rounded-lg bg-muted/30 border border-border">
                <div>
                  <label className="text-[10px] text-muted-foreground">Team</label>
                  <select value={actualForm.teamId} onChange={e => setActualForm(f => ({ ...f, teamId: e.target.value }))}
                    className="w-full px-2 py-1 text-xs rounded bg-muted border border-border">
                    {project.teamEstimates.map(te => <option key={te.teamId} value={te.teamId}>{te.team?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Phase</label>
                  <select value={actualForm.phase} onChange={e => setActualForm(f => ({ ...f, phase: e.target.value }))}
                    className="w-full px-2 py-1 text-xs rounded bg-muted border border-border">
                    {['design', 'development', 'testing', 'deployment', 'postDeploy'].map(p => (
                      <option key={p} value={p}>{p === 'postDeploy' ? 'Post-Deploy' : p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Week #</label>
                  <input type="number" min="1" value={actualForm.week} onChange={e => setActualForm(f => ({ ...f, week: parseInt(e.target.value) || 1 }))}
                    className="w-full px-2 py-1 text-xs rounded bg-muted border border-border" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Hours</label>
                  <input type="number" min="0" step="0.5" value={actualForm.hours} onChange={e => setActualForm(f => ({ ...f, hours: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-xs rounded bg-muted border border-border" />
                </div>
                <div className="flex items-end gap-1">
                  <button onClick={saveActual} className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">Save</button>
                  <button onClick={() => setShowActualForm(false)} className="px-2 py-1 text-xs rounded border border-border">Cancel</button>
                </div>
              </div>
            )}
            {varianceData.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={varianceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="phase" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="estimated" name="Estimated" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Dependencies */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Dependencies</CardTitle></CardHeader>
            <CardContent>
              {depProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No dependencies</p>
              ) : (
                <div className="space-y-2">
                  {depProjects.map(dp => dp && (
                    <button key={dp.id} onClick={() => router.push(`/projects/${dp.id}`)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-left text-sm">
                      <span>{dp.name}</span>
                      <span className="text-xs text-muted-foreground">Finish-to-Start</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Milestones</CardTitle></CardHeader>
            <CardContent>
              {(!project.milestones || project.milestones.length === 0) ? (
                <p className="text-sm text-muted-foreground">No milestones defined</p>
              ) : (
                <div className="space-y-2">
                  {project.milestones.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        {m.status === 'complete' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> :
                          m.status === 'at_risk' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                          <Clock className="w-4 h-4 text-muted-foreground" />}
                        <span className="text-sm">{m.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Week {m.targetWeek}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assigned Resources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4" /> Assigned Resources ({assignments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No resources assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{a.resourceName || a.resourceId}</p>
                      <p className="text-xs text-muted-foreground">{a.role} · Wk {a.startWeek}-{a.endWeek}</p>
                    </div>
                    <span className="text-sm font-medium">{a.allocationPct}%</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
