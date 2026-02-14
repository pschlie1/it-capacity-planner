'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Calculator, Save, DollarSign, Clock, Users, TrendingUp,
  ArrowLeft, RefreshCw, CheckCircle2,
} from 'lucide-react';

interface TeamEstimateRow {
  id: string;
  teamId: string;
  teamName: string;
  devHours: number;
  phases: {
    requirements: number;
    technicalDesign: number;
    development: number;
    testing: number;
    support: number;
    devOps: number;
    projectManagement: number;
  };
  totalHours: number;
  totalCost: number;
}

interface EstimationData {
  project: {
    id: string;
    name: string;
    workflowStatus: string;
    estimatedCost: number | null;
  };
  estimation: {
    teams: Array<{
      teamId: string;
      teamName: string;
      devHours: number;
      estimate: {
        phases: Record<string, number>;
        totalHours: number;
        totalCost: number;
        durationWeeks: number;
        durationSprints: number;
        teamSize: number;
        testingModel: string;
        projectSize: string;
        capex: { total: number; percentage: number };
        opex: { total: number; percentage: number };
      };
    }>;
    totals: {
      phases: Record<string, number>;
      totalHours: number;
      totalCost: number;
      capexAmount: number;
      opexAmount: number;
      capexPercentage: number;
      opexPercentage: number;
      durationWeeks: number;
      durationSprints: number;
      teamSize: number;
      testingModel: string;
    };
  };
}

interface Props {
  projectId: string;
  onBack: () => void;
}

const WORKFLOW_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  estimating: 'Estimating',
  estimated: 'Estimated',
  cost_review: 'Cost Review',
  approved: 'Approved',
  prioritized: 'Prioritized',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const WORKFLOW_COLORS: Record<string, string> = {
  submitted: 'bg-slate-500/20 text-slate-400',
  estimating: 'bg-blue-500/20 text-blue-400',
  estimated: 'bg-purple-500/20 text-purple-400',
  cost_review: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-green-500/20 text-green-400',
  prioritized: 'bg-cyan-500/20 text-cyan-400',
  in_progress: 'bg-emerald-500/20 text-emerald-400',
  completed: 'bg-green-600/20 text-green-300',
};

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function EstimationWorkspace({ projectId, onBack }: Props) {
  const [data, setData] = useState<EstimationData | null>(null);
  const [devHoursInputs, setDevHoursInputs] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEstimation = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/estimate`);
    if (res.ok) {
      const d = await res.json() as EstimationData;
      setData(d);
      // Initialize inputs from fetched data
      const inputs: Record<string, number> = {};
      for (const t of d.estimation.teams) {
        inputs[t.teamId] = t.devHours;
      }
      setDevHoursInputs(inputs);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchEstimation(); }, [fetchEstimation]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);

    // Find team estimate IDs from the project data
    const res = await fetch(`/api/projects/${projectId}/estimate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamEstimates: data.estimation.teams.map((t) => {
          // We need to look up the teamEstimate ID - refetch project
          return {
            teamEstimateId: t.teamId, // Will be resolved server-side
            devHours: devHoursInputs[t.teamId] ?? t.devHours,
          };
        }),
      }),
    });

    if (res.ok) {
      await fetchEstimation();
    }
    setSaving(false);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { project, estimation } = data;
  const { totals } = estimation;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              {project.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs ${WORKFLOW_COLORS[project.workflowStatus] || 'bg-muted'}`}>
                {WORKFLOW_LABELS[project.workflowStatus] || project.workflowStatus}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save & Recalculate
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MiniKPI icon={<Clock className="w-4 h-4" />} label="Duration" value={`${totals.durationWeeks}w`} sub={`${totals.durationSprints} sprints`} color="text-blue-400" />
        <MiniKPI icon={<Users className="w-4 h-4" />} label="Team Size" value={`${totals.teamSize}`} sub="recommended" color="text-purple-400" />
        <MiniKPI icon={<TrendingUp className="w-4 h-4" />} label="Total Hours" value={`${totals.totalHours}`} color="text-cyan-400" />
        <MiniKPI icon={<DollarSign className="w-4 h-4" />} label="Total Cost" value={fmt(totals.totalCost)} color="text-green-400" />
        <MiniKPI icon={<DollarSign className="w-4 h-4" />} label="CapEx" value={fmt(totals.capexAmount)} sub={`${totals.capexPercentage.toFixed(0)}%`} color="text-amber-400" />
        <MiniKPI icon={<DollarSign className="w-4 h-4" />} label="OpEx" value={fmt(totals.opexAmount)} sub={`${totals.opexPercentage.toFixed(0)}%`} color="text-red-400" />
      </div>

      {/* Team Estimates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Dev Hours Input</CardTitle>
          <CardDescription>Enter development hours per team. All other phases are auto-calculated.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Team</th>
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Dev Hours</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Req</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Design</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Dev</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Test</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Support</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">DevOps</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">PM</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Total</th>
                  <th className="text-right py-2 px-2 text-muted-foreground font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {estimation.teams.map((t) => (
                  <tr key={t.teamId} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-2 font-medium">{t.teamName}</td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        step="4"
                        value={devHoursInputs[t.teamId] ?? t.devHours}
                        onChange={(e) => setDevHoursInputs((prev) => ({
                          ...prev,
                          [t.teamId]: parseFloat(e.target.value) || 0,
                        }))}
                        className="w-20 px-2 py-1 text-xs rounded bg-muted border border-border focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{t.estimate.phases.requirements}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{t.estimate.phases.technicalDesign}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{t.estimate.phases.development}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{t.estimate.phases.testing}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{t.estimate.phases.support}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{t.estimate.phases.devOps}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{t.estimate.phases.projectManagement}</td>
                    <td className="py-2 px-2 text-right font-medium">{t.estimate.totalHours}</td>
                    <td className="py-2 px-2 text-right font-medium text-green-400">{fmt(t.estimate.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-medium">
                  <td className="py-2 px-2">Totals</td>
                  <td className="py-2 px-2"></td>
                  <td className="py-2 px-2 text-right">{totals.phases.requirements}</td>
                  <td className="py-2 px-2 text-right">{totals.phases.technicalDesign}</td>
                  <td className="py-2 px-2 text-right">{totals.phases.development}</td>
                  <td className="py-2 px-2 text-right">{totals.phases.testing}</td>
                  <td className="py-2 px-2 text-right">{totals.phases.support}</td>
                  <td className="py-2 px-2 text-right">{totals.phases.devOps}</td>
                  <td className="py-2 px-2 text-right">{totals.phases.projectManagement}</td>
                  <td className="py-2 px-2 text-right">{totals.totalHours}</td>
                  <td className="py-2 px-2 text-right text-green-400">{fmt(totals.totalCost)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CapEx/OpEx Split */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" /> CapEx / OpEx Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Visual bar */}
            <div className="h-6 rounded-full overflow-hidden flex mb-4">
              <div className="bg-amber-500 h-full flex items-center justify-center text-[10px] font-medium text-white"
                   style={{ width: `${totals.capexPercentage}%` }}>
                {totals.capexPercentage > 10 && `CapEx ${totals.capexPercentage.toFixed(0)}%`}
              </div>
              <div className="bg-blue-500 h-full flex items-center justify-center text-[10px] font-medium text-white"
                   style={{ width: `${totals.opexPercentage}%` }}>
                {totals.opexPercentage > 10 && `OpEx ${totals.opexPercentage.toFixed(0)}%`}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">CapEx (Capitalizable)</p>
                <p className="text-xl font-bold text-amber-400">{fmt(totals.capexAmount)}</p>
                <p className="text-[10px] text-muted-foreground">Design, Dev, Testing, Support, DevOps</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">OpEx (Operating)</p>
                <p className="text-xl font-bold text-blue-400">{fmt(totals.opexAmount)}</p>
                <p className="text-[10px] text-muted-foreground">Requirements, PM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" /> Estimation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Testing Model</span>
                <span className="font-medium capitalize">{totals.testingModel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{totals.durationWeeks} weeks ({totals.durationSprints} sprints)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recommended Team Size</span>
                <span className="font-medium">{totals.teamSize} developers</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Hours</span>
                <span className="font-medium">{totals.totalHours}h</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-muted-foreground font-medium">Total Cost</span>
                <span className="font-bold text-green-400 text-lg">{fmt(totals.totalCost)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniKPI({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-3 pb-3">
        <div className="flex items-center gap-2">
          <div className={`${color} opacity-60`}>{icon}</div>
          <div>
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
