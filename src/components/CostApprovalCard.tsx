'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  CheckCircle2, XCircle, DollarSign, Clock, Users,
  ArrowLeft, RefreshCw, User, Calendar,
} from 'lucide-react';

interface Props {
  projectId: string;
  onBack: () => void;
  onAction: () => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function CostApprovalCard({ projectId, onBack, onAction }: Props) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/estimate`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleWorkflow = async (status: string) => {
    const label = status === 'approved' ? 'approve' : 'send back';
    if (!confirm(`Are you sure you want to ${label} this project?`)) return;

    const res = await fetch(`/api/projects/${projectId}/workflow`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      onAction();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed');
    }
  };

  if (loading || !data) {
    return <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const project = data.project as Record<string, unknown>;
  const estimation = data.estimation as Record<string, unknown>;
  const totals = estimation?.totals as Record<string, unknown> || {};
  const phases = totals.phases as Record<string, number> || {};

  const phaseRows = [
    { label: 'Requirements', key: 'requirements', type: 'OpEx' },
    { label: 'Technical Design', key: 'technicalDesign', type: 'CapEx' },
    { label: 'Development', key: 'development', type: 'CapEx' },
    { label: 'Testing', key: 'testing', type: 'CapEx' },
    { label: 'Hypercare Support', key: 'support', type: 'CapEx' },
    { label: 'DevOps', key: 'devOps', type: 'CapEx' },
    { label: 'Project Management', key: 'projectManagement', type: 'OpEx' },
  ];

  const capexPct = Number(totals.capexPercentage || 0);
  const opexPct = Number(totals.opexPercentage || 0);
  const isCostReview = project.workflowStatus === 'cost_review';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="text-lg font-semibold">Cost Approval: {String(project.name)}</h2>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {typeof project.submittedBy === 'string' && (
          <span className="flex items-center gap-1"><User className="w-3 h-3" /> Submitted by {project.submittedBy}</span>
        )}
        {typeof project.submittedAt === 'string' && (
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(project.submittedAt).toLocaleDateString()}</span>
        )}
      </div>

      {/* Phase Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phase Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground">Phase</th>
                <th className="text-right py-2 px-2 text-muted-foreground">Hours</th>
                <th className="text-right py-2 px-2 text-muted-foreground">Cost</th>
                <th className="text-right py-2 px-2 text-muted-foreground">Type</th>
              </tr>
            </thead>
            <tbody>
              {phaseRows.map(row => {
                const hours = phases[row.key] || 0;
                const cost = hours * 95; // Approximate; real rate comes from config
                return (
                  <tr key={row.key} className="border-b border-border/50">
                    <td className="py-2 px-2">{row.label}</td>
                    <td className="py-2 px-2 text-right">{hours}</td>
                    <td className="py-2 px-2 text-right text-green-400">{fmt(cost)}</td>
                    <td className="py-2 px-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${row.type === 'CapEx' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {row.type}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-medium">
                <td className="py-2 px-2">Total</td>
                <td className="py-2 px-2 text-right">{Number(totals.totalHours || 0)}</td>
                <td className="py-2 px-2 text-right text-green-400">{fmt(Number(totals.totalCost || 0))}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* CapEx/OpEx Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">CapEx</p>
            <p className="text-2xl font-bold text-amber-400">{fmt(Number(totals.capexAmount || 0))}</p>
            <p className="text-xs text-muted-foreground">{capexPct.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase">OpEx</p>
            <p className="text-2xl font-bold text-blue-400">{fmt(Number(totals.opexAmount || 0))}</p>
            <p className="text-xs text-muted-foreground">{opexPct.toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Duration & Team */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-bold">{Number(totals.durationWeeks || 0)} weeks ({Number(totals.durationSprints || 0)} sprints)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xs text-muted-foreground">Team Size</p>
              <p className="font-bold">{Number(totals.teamSize || 0)} developers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {isCostReview && (
        <div className="flex gap-3">
          <button
            onClick={() => handleWorkflow('approved')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium"
          >
            <CheckCircle2 className="w-5 h-5" /> Approve
          </button>
          <button
            onClick={() => handleWorkflow('estimating')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30 text-sm font-medium"
          >
            <XCircle className="w-5 h-5" /> Send Back
          </button>
        </div>
      )}
    </div>
  );
}
