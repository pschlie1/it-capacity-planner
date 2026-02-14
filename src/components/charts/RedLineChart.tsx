'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface Allocation {
  projectName: string;
  priority: number;
  feasible: boolean;
  totalWeeks: number;
}

export default function RedLineChart({ data }: { data: Allocation[] }) {
  const sorted = [...data].sort((a, b) => a.priority - b.priority);
  const redLineIdx = sorted.findIndex(a => !a.feasible);
  
  const chartData = sorted.map(a => ({
    name: `${a.priority}. ${a.projectName}`,
    weeks: a.totalWeeks,
    feasible: a.feasible,
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 45)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 180, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
        <XAxis type="number" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }} label={{ value: 'Duration (Weeks)', position: 'insideBottom', offset: -5, fill: 'hsl(215 20.2% 65.1%)' }} />
        <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 11 }} width={175} />
        <Tooltip contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)', borderRadius: '8px', color: 'hsl(210 40% 98%)' }} />
        {redLineIdx > 0 && (
          <ReferenceLine y={chartData[redLineIdx]?.name} stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" label={{ value: 'CAPACITY LIMIT', fill: '#ef4444', fontSize: 11, fontWeight: 'bold' }} />
        )}
        <Bar dataKey="weeks" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.feasible ? '#22c55e' : '#ef4444'} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
