'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Save, Calendar, Clock, AlertTriangle, Users, Upload, Download } from 'lucide-react';

interface Settings {
  fiscalYearStartMonth: number;
  defaultHoursPerWeek: number;
  holidays: { name: string; week: number }[];
  capacityThresholds: { amber: number; red: number };
  roleTemplates: { name: string; roles: Record<string, number> }[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings);
  }, []);

  const save = async () => {
    if (!settings) return;
    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
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
