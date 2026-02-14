'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Save, Calculator, DollarSign, Clock, Users, BarChart3, ArrowLeft, TrendingUp } from 'lucide-react';

interface Team {
  id: string;
  name: string;
}

interface TeamEstimateRow {
  teamId: string;
  teamName: string;
  devHours: number;
  confidence: string;
}

interface PhaseDetail {
  name: string;
  key: string;
  hours: number;
  cost: number;
  category: 'CapEx' | 'OpEx';
}

interface TeamResult {
  teamId: string;
  teamName: string;
  devHours: number;
  result: {
    phases: Record<string, number>;
    totalHours: number;
    totalCost: number;
    capexAmount: number;
    opexAmount: number;
    capexPercent: number;
    opexPercent: number;
    teamSize: number;
    projectSizeLabel: string;
    testingModel: string;
    estimatedWeeks: number;
    phaseDetails: PhaseDetail[];
  };
}

interface AggregateData {
  teams: TeamResult[];
  totalDevHours: number;
  totalHours: number;
  totalCost: number;
  totalCapex: number;
  totalOpex: number;
  estimatedWeeks: number;
  recommendedTeamSize: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export default function EstimationWorkspace({
  projectId,
  projectName,
  teams,
  onBack,
}: {
  projectId: string;
  projectName: string;
  teams: Team[];
  onBack: () => void;
}) {
  const [estimates, setEstimates] = useState<TeamEstimateRow[]>([]);
  const [aggregate, setAggregate] = useState<AggregateData | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEstimate = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/estimate`);
      if (!res.ok) return;
      const data = await res.json();

      const rows: TeamEstimateRow[] = teams.map((team) => {
        const existing = data.teamEstimates?.find((te: { teamId: string }) => te.teamId === team.id);
        return {
          teamId: team.id,
          teamName: team.name,
          devHours: existing?.devHours ?? 0,
          confidence: existing?.confidence ?? 'medium',
        };
      });
      setEstimates(rows);
      if (data.aggregate) setAggregate(data.aggregate);
    } catch {
      // Init with empty rows
      setEstimates(teams.map((t) => ({ teamId: t.id, teamName: t.name, devHours: 0, confidence: 'medium' })));
    }
    setLoading(false);
  }, [projectId, teams]);

  useEffect(() => { fetchEstimate(); }, [fetchEstimate]);

  const updateDevHours = (teamId: string, hours: number) => {
    setEstimates((prev) => prev.map((e) => (e.teamId === teamId ? { ...e, devHours: hours } : e)));
    setSaved(false);
  };

  const updateConfidence = (teamId: string, confidence: string) => {
    setEstimates((prev) => prev.map((e) => (e.teamId === teamId ? { ...e, confidence } : e)));
    setSaved(false);
  };

  const saveEstimates = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamEstimates: estimates.map((e) => ({
            teamId: e.teamId,
            devHours: e.devHours,
            confidence: e.confidence,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.aggregate) setAggregate(data.aggregate);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const totalDevHours = estimates.reduce((s, e) => s + e.devHours, 0);

  if (loading) return <p className="text-muted-foreground">Loading estimation...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold">{projectName}</h2>
          <p className="text-sm text-muted-foreground">Estimation Workspace</p>
        </div>
      </div>

      {/* Team Dev Hours Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Team Development Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {estimates.map((est) => (
              <div key={est.teamId} className="flex items-center gap-4">
                <span className="w-40 text-sm font-medium truncate">{est.teamName}</span>
                <input
                  type="number"
                  min={0}
                  step={8}
                  value={est.devHours || ''}
                  onChange={(e) => updateDevHours(est.teamId, Number(e.target.value) || 0)}
                  placeholder="Dev hours"
                  className="w-28 px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-sm focus:border-blue-500 focus:outline-none"
                />
                <select
                  value={est.confidence}
                  onChange={(e) => updateConfidence(est.teamId, e.target.value)}
                  className="px-2 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="high">High confidence</option>
                  <option value="medium">Medium confidence</option>
                  <option value="low">Low confidence</option>
                </select>
                {est.devHours > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {est.devHours <= 80 ? 'Micro' : est.devHours <= 240 ? 'Small' : est.devHours <= 600 ? 'Medium' : 'Large'}
                  </span>
                )}
              </div>
            ))}
            <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
              <span className="w-40 text-sm font-bold">Total</span>
              <span className="w-28 text-sm font-bold">{totalDevHours} hrs</span>
            </div>
          </div>
          <button
            onClick={saveEstimates}
            disabled={saving}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Calculate & Save'}
          </button>
        </CardContent>
      </Card>

      {/* Aggregate Results */}
      {aggregate && aggregate.totalHours > 0 && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <DollarSign className="h-3 w-3" /> Total Cost
              </div>
              <div className="text-xl font-bold">{formatCurrency(aggregate.totalCost)}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Clock className="h-3 w-3" /> Duration
              </div>
              <div className="text-xl font-bold">{aggregate.estimatedWeeks} weeks</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Users className="h-3 w-3" /> Team Size
              </div>
              <div className="text-xl font-bold">{aggregate.recommendedTeamSize} people</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <BarChart3 className="h-3 w-3" /> Total Hours
              </div>
              <div className="text-xl font-bold">{aggregate.totalHours.toLocaleString()}</div>
            </Card>
          </div>

          {/* CapEx / OpEx */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> CapEx / OpEx Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">CapEx</div>
                  <div className="text-lg font-bold text-blue-400">{formatCurrency(aggregate.totalCapex)}</div>
                  <div className="text-xs text-muted-foreground">
                    {aggregate.totalCost > 0 ? Math.round((aggregate.totalCapex / aggregate.totalCost) * 100) : 0}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">OpEx</div>
                  <div className="text-lg font-bold text-amber-400">{formatCurrency(aggregate.totalOpex)}</div>
                  <div className="text-xs text-muted-foreground">
                    {aggregate.totalCost > 0 ? Math.round((aggregate.totalOpex / aggregate.totalCost) * 100) : 0}%
                  </div>
                </div>
              </div>
              <div className="mt-3 h-3 rounded-full bg-zinc-800 overflow-hidden flex">
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: `${aggregate.totalCost > 0 ? (aggregate.totalCapex / aggregate.totalCost) * 100 : 0}%` }}
                />
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${aggregate.totalCost > 0 ? (aggregate.totalOpex / aggregate.totalCost) * 100 : 0}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> CapEx (Design, Dev, Testing, DevOps, Support)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> OpEx (Requirements, PM)</span>
              </div>
            </CardContent>
          </Card>

          {/* Per-Team Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Team Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs text-muted-foreground">
                      <th className="text-left py-2 pr-4">Team</th>
                      <th className="text-right px-2">Dev Hrs</th>
                      <th className="text-right px-2">Req</th>
                      <th className="text-right px-2">Design</th>
                      <th className="text-right px-2">Testing</th>
                      <th className="text-right px-2">Support</th>
                      <th className="text-right px-2">DevOps</th>
                      <th className="text-right px-2">PM</th>
                      <th className="text-right px-2 font-bold">Total</th>
                      <th className="text-right pl-2">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregate.teams.map((t) => (
                      <tr key={t.teamId} className="border-b border-zinc-800/50">
                        <td className="py-2 pr-4 font-medium">{t.teamName}</td>
                        <td className="text-right px-2 text-blue-400">{t.devHours}</td>
                        <td className="text-right px-2">{t.result.phases.requirements}</td>
                        <td className="text-right px-2">{t.result.phases.technicalDesign}</td>
                        <td className="text-right px-2">{t.result.phases.testing}</td>
                        <td className="text-right px-2">{t.result.phases.support}</td>
                        <td className="text-right px-2">{t.result.phases.devOps}</td>
                        <td className="text-right px-2">{t.result.phases.projectManagement}</td>
                        <td className="text-right px-2 font-bold">{t.result.totalHours}</td>
                        <td className="text-right pl-2 text-emerald-400">{formatCurrency(t.result.totalCost)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold border-t border-zinc-700">
                      <td className="py-2 pr-4">Total</td>
                      <td className="text-right px-2 text-blue-400">{aggregate.totalDevHours}</td>
                      <td className="text-right px-2">{aggregate.teams.reduce((s, t) => s + t.result.phases.requirements, 0)}</td>
                      <td className="text-right px-2">{aggregate.teams.reduce((s, t) => s + t.result.phases.technicalDesign, 0)}</td>
                      <td className="text-right px-2">{aggregate.teams.reduce((s, t) => s + t.result.phases.testing, 0)}</td>
                      <td className="text-right px-2">{aggregate.teams.reduce((s, t) => s + t.result.phases.support, 0)}</td>
                      <td className="text-right px-2">{aggregate.teams.reduce((s, t) => s + t.result.phases.devOps, 0)}</td>
                      <td className="text-right px-2">{aggregate.teams.reduce((s, t) => s + t.result.phases.projectManagement, 0)}</td>
                      <td className="text-right px-2">{aggregate.totalHours}</td>
                      <td className="text-right pl-2 text-emerald-400">{formatCurrency(aggregate.totalCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
