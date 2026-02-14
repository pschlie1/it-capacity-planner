'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {
  ArrowLeft, Edit2, Trash2, ChevronRight, Save, Clock, Calendar, Mail,
  DollarSign, User, AlertTriangle, Building2, Shield, Plus, X, UserPlus, FolderKanban
} from 'lucide-react';

interface Skill { name: string; proficiency: number; }
interface Assignment {
  id: string; projectId: string; projectName: string; role: string;
  allocationPct: number; startWeek: number; endWeek: number;
}
interface PTOBlock { startWeek: number; endWeek: number; reason: string; }

interface ResourceData {
  id: string; name: string; title: string; teamId: string; teamName: string;
  roleType: string; seniority: string; hireDate: string; employeeId: string;
  isContractor: boolean; endDate: string | null; annualSalary: number | null;
  hourlyCostRate: number; baseHoursPerWeek: number; trainingPct: number;
  onCallPct: number; rampUpWeeks: number; rampUpStart: string | null;
  notes: string; skills: Skill[]; ptoBlocks: PTOBlock[]; avatarColor: string;
  email: string; assignments: Assignment[]; utilization: number[];
  avgUtilization: number; maxUtilization: number;
}

const SENIORITY_COLORS: Record<string, string> = {
  Junior: 'bg-green-500/20 text-green-400', Mid: 'bg-blue-500/20 text-blue-400',
  Senior: 'bg-purple-500/20 text-purple-400', Lead: 'bg-amber-500/20 text-amber-400',
  Principal: 'bg-red-500/20 text-red-400',
};
const MEETING_OVERHEAD: Record<string, number> = {
  Junior: 10, Mid: 15, Senior: 20, Lead: 25, Principal: 30,
};

export default function ResourceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [resource, setResource] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [showPtoForm, setShowPtoForm] = useState(false);
  const [ptoForm, setPtoForm] = useState({ startWeek: 1, endWeek: 1, reason: 'Vacation' });

  useEffect(() => {
    Promise.all([
      fetch(`/api/resources/${id}`).then(r => r.json()),
      fetch('/api/teams').then(r => r.json()),
    ]).then(([res, ts]) => {
      setResource(res);
      setForm(res);
      setTeams(ts.map((t: any) => ({ id: t.id, name: t.name })));
      setLoading(false);
    });
  }, [id]);

  const saveEdit = async () => {
    await fetch(`/api/resources/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, title: form.title, roleType: form.roleType,
        seniority: form.seniority, teamId: form.teamId, email: form.email,
        employeeId: form.employeeId, isContractor: form.isContractor,
        endDate: form.endDate || null, annualSalary: form.annualSalary || null,
        hourlyCostRate: form.hourlyCostRate, baseHoursPerWeek: form.baseHoursPerWeek,
        trainingPct: form.trainingPct, onCallPct: form.onCallPct,
        rampUpWeeks: form.rampUpWeeks, notes: form.notes, skills: form.skills,
        ptoBlocks: form.ptoBlocks,
      }),
    });
    const updated = await fetch(`/api/resources/${id}`).then(r => r.json());
    setResource(updated);
    setForm(updated);
    setEditing(false);
  };

  const addPto = () => {
    const updatedBlocks = [...(form.ptoBlocks || []), ptoForm];
    setForm((f: any) => ({ ...f, ptoBlocks: updatedBlocks }));
    setShowPtoForm(false);
    setPtoForm({ startWeek: 1, endWeek: 1, reason: 'Vacation' });
  };

  const removePto = (index: number) => {
    setForm((f: any) => ({
      ...f,
      ptoBlocks: f.ptoBlocks.filter((_: any, i: number) => i !== index),
    }));
  };

  const addSkill = () => {
    setForm((f: any) => ({ ...f, skills: [...(f.skills || []), { name: '', proficiency: 3 }] }));
  };

  const removeSkill = (index: number) => {
    setForm((f: any) => ({ ...f, skills: f.skills.filter((_: any, i: number) => i !== index) }));
  };

  if (loading || !resource) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const meetingPct = MEETING_OVERHEAD[resource.seniority] || 15;
  const baseHrs = resource.baseHoursPerWeek;
  const meetingHrs = baseHrs * (meetingPct / 100);
  const trainingHrs = baseHrs * (resource.trainingPct / 100);
  const onCallHrs = baseHrs * (resource.onCallPct / 100);
  const netAvailable = baseHrs - meetingHrs - trainingHrs - onCallHrs;

  const radarData = resource.skills.map(s => ({ skill: s.name, proficiency: s.proficiency, fullMark: 5 }));
  const utilData = (resource.utilization || []).map((u, i) => ({ week: `W${i + 1}`, utilization: u }));
  const overAllocWeeks = (resource.utilization || []).filter(u => u > 100).length;

  const PTO_COLORS: Record<string, string> = {
    Vacation: 'bg-blue-500/20 text-blue-400', Sick: 'bg-red-500/20 text-red-400',
    Training: 'bg-purple-500/20 text-purple-400', 'Parental Leave': 'bg-pink-500/20 text-pink-400',
    Personal: 'bg-amber-500/20 text-amber-400', Sabbatical: 'bg-cyan-500/20 text-cyan-400',
    Conference: 'bg-green-500/20 text-green-400',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
          <button onClick={() => router.push('/')} className="hover:text-foreground">Dashboard</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => router.push('/')} className="hover:text-foreground">Resources</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{resource.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
          <div className="flex items-start gap-3">
            <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-muted mt-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: resource.avatarColor }}>
              {resource.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{resource.name}</h1>
              <p className="text-sm text-muted-foreground">{resource.title}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs ${SENIORITY_COLORS[resource.seniority]}`}>{resource.seniority}</span>
                <span className="text-xs text-muted-foreground">{resource.roleType}</span>
                <button onClick={() => router.push(`/teams/${resource.teamId}`)} className="text-xs text-primary hover:underline">{resource.teamName}</button>
                {resource.isContractor && <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">Contractor</span>}
                {resource.endDate && <span className="text-xs text-red-400">Ends: {resource.endDate}</span>}
              </div>
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                {resource.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{resource.email}</span>}
                {resource.employeeId && <span>ID: {resource.employeeId}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setEditing(!editing)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted">
              <Edit2 className="w-3 h-3" /> Edit
            </button>
            <button onClick={async () => { if (!confirm('Delete?')) return; await fetch(`/api/resources/${id}`, { method: 'DELETE' }); router.push('/'); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-base">Edit Resource</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div><label className="text-[10px] text-muted-foreground">Name</label>
                  <input value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" /></div>
                <div><label className="text-[10px] text-muted-foreground">Email</label>
                  <input value={form.email || ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" /></div>
                <div><label className="text-[10px] text-muted-foreground">Title</label>
                  <input value={form.title || ''} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" /></div>
                <div><label className="text-[10px] text-muted-foreground">Employee ID</label>
                  <input value={form.employeeId || ''} onChange={e => setForm((f: any) => ({ ...f, employeeId: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" /></div>
                <div><label className="text-[10px] text-muted-foreground">Role Type</label>
                  <select value={form.roleType || ''} onChange={e => setForm((f: any) => ({ ...f, roleType: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border">
                    {['Developer', 'Architect', 'QA', 'DevOps', 'Business Analyst', 'DBA', 'PM', 'Product Manager', 'UX Designer', 'Scrum Master'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select></div>
                <div><label className="text-[10px] text-muted-foreground">Seniority</label>
                  <select value={form.seniority || ''} onChange={e => setForm((f: any) => ({ ...f, seniority: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border">
                    {['Junior', 'Mid', 'Senior', 'Lead', 'Principal'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select></div>
                <div><label className="text-[10px] text-muted-foreground">Team</label>
                  <select value={form.teamId || ''} onChange={e => setForm((f: any) => ({ ...f, teamId: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border">
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select></div>
                <div><label className="text-[10px] text-muted-foreground">Base Hours/Week</label>
                  <input type="number" value={form.baseHoursPerWeek || 40} onChange={e => setForm((f: any) => ({ ...f, baseHoursPerWeek: parseFloat(e.target.value) || 40 }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" /></div>
                <div><label className="text-[10px] text-muted-foreground">Hourly Rate</label>
                  <input type="number" value={form.hourlyCostRate || 0} onChange={e => setForm((f: any) => ({ ...f, hourlyCostRate: parseFloat(e.target.value) || 0 }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" /></div>
                <div><label className="text-[10px] text-muted-foreground">Annual Salary</label>
                  <input type="number" value={form.annualSalary || ''} onChange={e => setForm((f: any) => ({ ...f, annualSalary: parseFloat(e.target.value) || null }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" placeholder="Optional" /></div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-muted-foreground">Contractor?</label>
                  <input type="checkbox" checked={form.isContractor || false} onChange={e => setForm((f: any) => ({ ...f, isContractor: e.target.checked }))} />
                </div>
                {form.isContractor && <div><label className="text-[10px] text-muted-foreground">End Date</label>
                  <input type="date" value={form.endDate || ''} onChange={e => setForm((f: any) => ({ ...f, endDate: e.target.value }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" /></div>}
                <div><label className="text-[10px] text-muted-foreground">Training %</label>
                  <input type="number" min="0" max="100" value={form.trainingPct || 0} onChange={e => setForm((f: any) => ({ ...f, trainingPct: parseFloat(e.target.value) || 0 }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" /></div>
                <div><label className="text-[10px] text-muted-foreground">On-Call %</label>
                  <input type="number" min="0" max="100" value={form.onCallPct || 0} onChange={e => setForm((f: any) => ({ ...f, onCallPct: parseFloat(e.target.value) || 0 }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" /></div>
                <div><label className="text-[10px] text-muted-foreground">Ramp-Up Weeks</label>
                  <input type="number" min="0" value={form.rampUpWeeks || 0} onChange={e => setForm((f: any) => ({ ...f, rampUpWeeks: parseInt(e.target.value) || 0 }))} className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" /></div>
              </div>

              {/* Skills Editor */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium">Skills</label>
                  <button onClick={addSkill} className="text-xs text-primary hover:underline">+ Add Skill</button>
                </div>
                {(form.skills || []).map((s: Skill, i: number) => (
                  <div key={i} className="flex gap-2 mb-1 items-center">
                    <input value={s.name} onChange={e => { const sk = [...form.skills]; sk[i] = { ...sk[i], name: e.target.value }; setForm((f: any) => ({ ...f, skills: sk })); }}
                      placeholder="Skill name" className="flex-1 px-2 py-1 text-xs rounded bg-muted border border-border" />
                    <select value={s.proficiency} onChange={e => { const sk = [...form.skills]; sk[i] = { ...sk[i], proficiency: parseInt(e.target.value) }; setForm((f: any) => ({ ...f, skills: sk })); }}
                      className="px-2 py-1 text-xs rounded bg-muted border border-border">
                      <option value={1}>1 - Beginner</option><option value={2}>2 - Basic</option>
                      <option value={3}>3 - Intermediate</option><option value={4}>4 - Advanced</option>
                      <option value={5}>5 - Expert</option>
                    </select>
                    <button onClick={() => removeSkill(i)} className="p-1 text-red-400"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="text-[10px] text-muted-foreground">Notes</label>
                <textarea value={form.notes || ''} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-2 py-1 text-sm rounded bg-muted border border-border" rows={2} />
              </div>

              <div className="flex gap-2">
                <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground"><Save className="w-4 h-4" /> Save</button>
                <button onClick={() => { setEditing(false); setForm(resource); }} className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground">Cancel</button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Base Hours</p>
            <p className="text-2xl font-bold text-blue-400">{baseHrs}h/wk</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Net Available</p>
            <p className="text-2xl font-bold text-green-400">{netAvailable.toFixed(1)}h/wk</p>
            <p className="text-[10px] text-muted-foreground">After meetings, training, on-call</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Avg Utilization</p>
            <p className={`text-2xl font-bold ${(resource.avgUtilization || 0) > 100 ? 'text-red-400' : 'text-purple-400'}`}>
              {(resource.avgUtilization || 0).toFixed(0)}%
            </p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Active Projects</p>
            <p className="text-2xl font-bold text-amber-400">{(resource.assignments || []).length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase">Hourly Rate</p>
            <p className="text-2xl font-bold text-cyan-400">${resource.hourlyCostRate}</p>
          </CardContent></Card>
        </div>

        {overAllocWeeks > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">Over-allocated in {overAllocWeeks} weeks. Consider redistributing workload.</p>
          </div>
        )}

        {resource.isContractor && resource.endDate && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-400">Contractor engagement ends {resource.endDate}. Plan for transition.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Skills Radar */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Skills</CardTitle></CardHeader>
            <CardContent>
              {radarData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#333" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#666', fontSize: 9 }} />
                      <Radar dataKey="proficiency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="text-sm text-muted-foreground py-8 text-center">No skills recorded</p>}
            </CardContent>
          </Card>

          {/* Availability Breakdown */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Availability Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span>Base hours</span><span className="font-medium">{baseHrs}h/wk</span></div>
                <div className="flex justify-between text-sm text-amber-400"><span>Meeting overhead ({meetingPct}%)</span><span>-{meetingHrs.toFixed(1)}h</span></div>
                {resource.trainingPct > 0 && <div className="flex justify-between text-sm text-purple-400"><span>Training ({resource.trainingPct}%)</span><span>-{trainingHrs.toFixed(1)}h</span></div>}
                {resource.onCallPct > 0 && <div className="flex justify-between text-sm text-cyan-400"><span>On-call ({resource.onCallPct}%)</span><span>-{onCallHrs.toFixed(1)}h</span></div>}
                <div className="border-t border-border pt-2 flex justify-between text-sm font-bold"><span>Net available</span><span className="text-green-400">{netAvailable.toFixed(1)}h/wk</span></div>
                {resource.rampUpWeeks > 0 && (
                  <div className="text-xs text-muted-foreground mt-2 p-2 rounded bg-muted/30">
                    <p className="font-medium text-foreground">Ramp-up: {resource.rampUpWeeks} weeks</p>
                    <p>Wk 1-2: 25% → Wk 3-4: 50% → Wk 5-8: 75% → Wk 9+: 100%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Utilization Timeline */}
        {utilData.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2"><CardTitle className="text-base">Utilization Over Time (52 weeks)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={utilData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 9 }} interval={7} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} domain={[0, 150]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="utilization" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* PTO */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> PTO Blocks</CardTitle>
                <button onClick={() => setShowPtoForm(true)} className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary text-primary-foreground">
                  <Plus className="w-3 h-3" /> Add PTO
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {showPtoForm && (
                <div className="grid grid-cols-3 gap-2 mb-3 p-2 rounded bg-muted/30 border border-border">
                  <div><label className="text-[10px] text-muted-foreground">Start Week</label>
                    <input type="number" min="1" value={ptoForm.startWeek} onChange={e => setPtoForm(f => ({ ...f, startWeek: parseInt(e.target.value) || 1 }))} className="w-full px-2 py-1 text-xs rounded bg-muted border border-border" /></div>
                  <div><label className="text-[10px] text-muted-foreground">End Week</label>
                    <input type="number" min="1" value={ptoForm.endWeek} onChange={e => setPtoForm(f => ({ ...f, endWeek: parseInt(e.target.value) || 1 }))} className="w-full px-2 py-1 text-xs rounded bg-muted border border-border" /></div>
                  <div><label className="text-[10px] text-muted-foreground">Reason</label>
                    <select value={ptoForm.reason} onChange={e => setPtoForm(f => ({ ...f, reason: e.target.value }))} className="w-full px-2 py-1 text-xs rounded bg-muted border border-border">
                      {['Vacation', 'Sick', 'Personal', 'Training', 'Parental Leave', 'Sabbatical', 'Jury Duty', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select></div>
                  <div className="col-span-3 flex gap-1">
                    <button onClick={addPto} className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">Add</button>
                    <button onClick={() => setShowPtoForm(false)} className="px-2 py-1 text-xs rounded border border-border">Cancel</button>
                    <span className="text-[10px] text-muted-foreground self-center ml-2">Save resource to persist changes</span>
                  </div>
                </div>
              )}
              {(!form.ptoBlocks || form.ptoBlocks.length === 0) ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No PTO blocks</p>
              ) : (
                <div className="space-y-2">
                  {form.ptoBlocks.map((pto: PTOBlock, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${PTO_COLORS[pto.reason] || 'bg-muted text-muted-foreground'}`}>{pto.reason}</span>
                        <span className="text-xs">Wk {pto.startWeek} - {pto.endWeek}</span>
                        <span className="text-[10px] text-muted-foreground">({pto.endWeek - pto.startWeek + 1} wk)</span>
                      </div>
                      {editing && <button onClick={() => removePto(i)} className="p-1 text-red-400"><X className="w-3 h-3" /></button>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Assignments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><FolderKanban className="w-4 h-4" /> Project Assignments ({(resource.assignments || []).length})</CardTitle>
            </CardHeader>
            <CardContent>
              {(!resource.assignments || resource.assignments.length === 0) ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No active assignments</p>
              ) : (
                <div className="space-y-2">
                  {resource.assignments.map(a => (
                    <button key={a.id} onClick={() => router.push(`/projects/${a.projectId}`)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-left">
                      <div>
                        <p className="text-sm font-medium">{a.projectName}</p>
                        <p className="text-xs text-muted-foreground">{a.role} · Wk {a.startWeek}-{a.endWeek}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${a.allocationPct > 80 ? 'text-red-400' : 'text-green-400'}`}>{a.allocationPct}%</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {resource.notes && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{resource.notes}</p></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
