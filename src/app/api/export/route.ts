import { getTeams, getProjects, getTeamEstimates } from '@/lib/store';
import { NextResponse } from 'next/server';

export async function GET() {
  const teams = getTeams();
  const projects = getProjects();
  const estimates = getTeamEstimates();

  let csv = 'Type,ID,Name,Priority,Status,Category,Sponsor,BusinessValue,Quarter,RiskLevel,TotalHours\n';

  for (const p of projects) {
    const ests = estimates.filter(e => e.projectId === p.id);
    const hours = ests.reduce((s, e) => s + e.design + e.development + e.testing + e.deployment + e.postDeploy, 0);
    csv += `Project,${p.id},"${p.name}",${p.priority},${p.status},${p.category || ''},${p.sponsor || ''},${p.businessValue || ''},${p.quarterTarget || ''},${p.riskLevel || ''},${hours}\n`;
  }

  csv += '\nTeam,ID,Name,TotalFTE,Architect,Developer,QA,DevOps,BA,DBA,PM,KLO_Hours,Admin_Pct\n';
  for (const t of teams) {
    const totalFte = t.architectFte + t.developerFte + t.qaFte + t.devopsFte + t.businessAnalystFte + t.dbaFte + t.pmFte + t.productManagerFte;
    csv += `Team,${t.id},"${t.name}",${totalFte.toFixed(1)},${t.architectFte},${t.developerFte},${t.qaFte},${t.devopsFte},${t.businessAnalystFte},${t.dbaFte},${t.pmFte},${t.kloTlmHoursPerWeek},${t.adminPct}\n`;
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="capacity-plan-export.csv"',
    },
  });
}
