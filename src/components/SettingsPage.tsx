'use client';
import { csrfFetch } from '@/lib/csrf-client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Save, Calendar, Clock, AlertTriangle, Users, Upload, Download, Shield, UserPlus, Trash2, History } from 'lucide-react';

interface Settings {
  fiscalYearStartMonth: number;
  defaultHoursPerWeek: number;
  blendedRate: number;
  holidays: { name: string; week: number }[];
  capacityThresholds: { amber: number; red: number };
  roleTemplates: { name: string; roles: Record<string, number> }[];
  estimationConfig?: {
    percentages?: {
      requirements?: number;
      technicalDesign?: number;
      testing?: number;
      support?: number;
    };
    sprintConsolidation?: { enabled?: boolean };
  };
}

function UserManagement() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'MEMBER', password: 'changeme123' });

  const isAdmin = session?.user?.role === 'OWNER' || session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) fetch('/api/users').then(r => r.ok ? r.json() : []).then(setUsers).catch(() => {});
  }, [isAdmin]);

  if (!isAdmin) return null;

  const addUser = async () => {
    const res = await csrfFetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
    if (res.ok) { setShowAdd(false); setNewUser({ email: '', name: '', role: 'MEMBER', password: 'changeme123' }); fetch('/api/users').then(r => r.json()).then(setUsers); }
  };

  const changeRole = async (id: string, role: string) => {
    await csrfFetch(`/api/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    fetch('/api/users').then(r => r.json()).then(setUsers);
  };

  const removeUser = async (id: string) => {
    if (!confirm('Remove this user?')) return;
    await csrfFetch(`/api/users/${id}`, { method: 'DELETE' });
    fetch('/api/users').then(r => r.json()).then(setUsers);
  };

  const ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
  const ROLE_COLORS: Record<string, string> = { OWNER: 'text-red-400', ADMIN: 'text-amber-400', MEMBER: 'text-blue-400', VIEWER: 'text-slate-400' };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> User Management</CardTitle>
        <CardDescription>Manage team members and their access levels</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
              <div>
                <p className="text-sm font-medium">{u.name || u.email}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                  disabled={u.id === session?.user?.id}
                  className="px-2 py-1 text-xs rounded bg-muted border border-border">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <span className={`text-xs font-medium ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                {u.id !== session?.user?.id && session?.user?.role === 'OWNER' && (
                  <button onClick={() => removeUser(u.id)} className="p-1 text-red-400 hover:bg-muted rounded"><Trash2 className="w-3 h-3" /></button>
                )}
              </div>
            </div>
          ))}
        </div>

        {showAdd ? (
          <div className="mt-4 p-3 rounded-lg border border-border bg-muted/20">
            <div className="grid grid-cols-4 gap-2">
              <input value={newUser.email} onChange={e => setNewUser(n => ({ ...n, email: e.target.value }))} placeholder="Email" className="px-2 py-1 text-xs rounded bg-muted border border-border" />
              <input value={newUser.name} onChange={e => setNewUser(n => ({ ...n, name: e.target.value }))} placeholder="Name" className="px-2 py-1 text-xs rounded bg-muted border border-border" />
              <select value={newUser.role} onChange={e => setNewUser(n => ({ ...n, role: e.target.value }))} className="px-2 py-1 text-xs rounded bg-muted border border-border">
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="flex gap-1">
                <button onClick={addUser} className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground">Add</button>
                <button onClick={() => setShowAdd(false)} className="px-3 py-1 text-xs rounded border border-border text-muted-foreground">Cancel</button>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline">
            <UserPlus className="w-3 h-3" /> Add User
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function AuditLogViewer() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const isAdmin = session?.user?.role === 'OWNER' || session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      fetch('/api/audit?limit=30').then(r => r.ok ? r.json() : { logs: [], total: 0 }).then(d => { setLogs(d.logs); setTotal(d.total); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [isAdmin]);

  if (!isAdmin) return null;

  const ACTION_COLORS: Record<string, string> = { CREATE: 'text-green-400', UPDATE: 'text-blue-400', DELETE: 'text-red-400' };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" /> Audit Log</CardTitle>
        <CardDescription>Recent changes ({total} total entries)</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-xs text-muted-foreground">Loading...</p> : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {logs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-border/50">
                <span className={`font-mono font-medium ${ACTION_COLORS[log.action] || ''}`}>{log.action}</span>
                <span className="text-muted-foreground">{log.entity}</span>
                <span className="flex-1 text-muted-foreground truncate">{log.user?.name || log.user?.email}</span>
                <span className="text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-xs text-muted-foreground">No audit entries yet.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings);
  }, []);

  const save = async () => {
    if (!settings) return;
    await csrfFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) return <p className="text-muted-foreground">Loading settings...</p>;

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-xs text-muted-foreground">Configure capacity planning parameters</p>
        </div>
        <button onClick={save} className={`flex items-center gap-1 px-4 py-2 text-sm rounded-lg transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
          <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> General</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Fiscal Year Start Month</label>
              <select value={settings.fiscalYearStartMonth} onChange={e => setSettings(s => s ? { ...s, fiscalYearStartMonth: parseInt(e.target.value) } : s)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border">
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Default Hours Per Week</label>
              <input type="number" min="20" max="60" value={settings.defaultHoursPerWeek}
                onChange={e => setSettings(s => s ? { ...s, defaultHoursPerWeek: parseInt(e.target.value) || 40 } : s)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border" />
            </div>
            <div>
              <label className="block text-sm font-medium">Blended Rate ($/hr)</label>
              <p className="text-xs text-muted-foreground mb-1">Used for project cost estimation</p>
              <input type="number" min="25" max="500" value={settings.blendedRate}
                onChange={e => setSettings(s => s ? { ...s, blendedRate: parseFloat(e.target.value) || 95 } : s)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimation Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Estimation Defaults</CardTitle>
          <CardDescription>Configure the project estimation engine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Blended Rate ($/hr)</label>
              <input type="number" min="50" max="300" step="5" value={settings.blendedRate ?? 95}
                onChange={e => setSettings(s => s ? { ...s, blendedRate: parseFloat(e.target.value) || 95 } : s)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Requirements %</label>
              <input type="number" min="0" max="30" value={settings.estimationConfig?.percentages?.requirements ?? 5}
                onChange={e => setSettings(s => s ? { ...s, estimationConfig: { ...s.estimationConfig, percentages: { ...s.estimationConfig?.percentages, requirements: parseFloat(e.target.value) || 5 } } } : s)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tech Design %</label>
              <input type="number" min="0" max="30" value={settings.estimationConfig?.percentages?.technicalDesign ?? 5}
                onChange={e => setSettings(s => s ? { ...s, estimationConfig: { ...s.estimationConfig, percentages: { ...s.estimationConfig?.percentages, technicalDesign: parseFloat(e.target.value) || 5 } } } : s)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Testing %</label>
              <input type="number" min="0" max="60" value={settings.estimationConfig?.percentages?.testing ?? 33}
                onChange={e => setSettings(s => s ? { ...s, estimationConfig: { ...s.estimationConfig, percentages: { ...s.estimationConfig?.percentages, testing: parseFloat(e.target.value) || 33 } } } : s)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Support %</label>
              <input type="number" min="0" max="30" value={settings.estimationConfig?.percentages?.support ?? 10}
                onChange={e => setSettings(s => s ? { ...s, estimationConfig: { ...s.estimationConfig, percentages: { ...s.estimationConfig?.percentages, support: parseFloat(e.target.value) || 10 } } } : s)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border" />
            </div>
            <div className="flex items-center gap-2 self-end pb-2">
              <input type="checkbox" checked={settings.estimationConfig?.sprintConsolidation?.enabled ?? true}
                onChange={e => setSettings(s => s ? { ...s, estimationConfig: { ...s.estimationConfig, sprintConsolidation: { enabled: e.target.checked } } } : s)}
                className="rounded border-border" />
              <label className="text-xs text-muted-foreground">Sprint Consolidation</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Capacity Thresholds</CardTitle>
          <CardDescription>Define when utilization triggers warnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Amber Threshold (%)</label>
              <input type="number" min="50" max="95" value={settings.capacityThresholds.amber}
                onChange={e => setSettings(s => s ? { ...s, capacityThresholds: { ...s.capacityThresholds, amber: parseInt(e.target.value) || 75 } } : s)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border" />
              <p className="text-[10px] text-amber-400 mt-1">Teams above this % show amber warning</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Red Threshold (%)</label>
              <input type="number" min="60" max="100" value={settings.capacityThresholds.red}
                onChange={e => setSettings(s => s ? { ...s, capacityThresholds: { ...s.capacityThresholds, red: parseInt(e.target.value) || 90 } } : s)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-muted border border-border" />
              <p className="text-[10px] text-red-400 mt-1">Teams above this % show red alert</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holidays */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4" /> Holiday Calendar</CardTitle>
          <CardDescription>Company holidays reduce available capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {settings.holidays.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <input value={h.name} onChange={e => {
                  const holidays = [...settings.holidays];
                  holidays[i] = { ...holidays[i], name: e.target.value };
                  setSettings(s => s ? { ...s, holidays } : s);
                }} className="flex-1 px-2 py-1 rounded bg-muted border border-border text-xs" />
                <span className="text-xs text-muted-foreground">Week</span>
                <input type="number" min="1" max="52" value={h.week} onChange={e => {
                  const holidays = [...settings.holidays];
                  holidays[i] = { ...holidays[i], week: parseInt(e.target.value) || 1 };
                  setSettings(s => s ? { ...s, holidays } : s);
                }} className="w-16 px-2 py-1 rounded bg-muted border border-border text-xs" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Role Templates</CardTitle>
          <CardDescription>Pre-configured team compositions for quick setup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.roleTemplates.map((tmpl, i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <p className="text-sm font-medium mb-2">{tmpl.name}</p>
                <div className="flex gap-3 flex-wrap text-xs text-muted-foreground">
                  {Object.entries(tmpl.roles).map(([role, fte]) => (
                    <span key={role}>{role}: {fte} FTE</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <UserManagement />

      {/* Audit Log */}
      <AuditLogViewer />

      {/* Data Import/Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Download className="w-4 h-4" /> Data Import / Export</CardTitle>
          <CardDescription>Import from CSV or export your capacity data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Import CSV</p>
              <p className="text-[10px] text-muted-foreground mt-1">Upload teams, projects, or estimates from CSV</p>
              <input type="file" accept=".csv" className="mt-3 text-xs" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                // Simple CSV parse for demo
                alert(`Parsed ${text.split('\n').length - 1} rows. CSV import would process and create records.`);
              }} />
            </div>
            <div className="border border-dashed border-border rounded-lg p-6 text-center">
              <Download className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Export All Data</p>
              <p className="text-[10px] text-muted-foreground mt-1">Download complete capacity plan as CSV</p>
              <button onClick={() => {
                // Trigger full export
                window.location.href = '/api/export';
              }} className="mt-3 px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground">Download CSV</button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
