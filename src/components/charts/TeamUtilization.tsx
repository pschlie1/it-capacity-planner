'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface TeamCapacity {
  teamName: string;
  utilization: number;
}

function getColor(util: number) {
  if (util < 70) return '#3b82f6';
  if (util < 90) return '#f59e0b';
  return '#ef4444';
}

export default function TeamUtilization({ data }: { data: TeamCapacity[] }) {
  const chartData = data.map(tc => ({
    name: tc.teamName,
    utilization: Math.round(tc.utilization * 10) / 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }} label={{ value: 'Utilization %', position: 'insideBottom', offset: -5, fill: 'hsl(215 20.2% 65.1%)' }} />
        <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }} width={115} />
        <Tooltip contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)', borderRadius: '8px', color: 'hsl(210 40% 98%)' }} formatter={(value) => [`${value}%`, 'Utilization']} />
        <ReferenceLine x={70} stroke="#f59e0b" strokeDasharray="3 3" />
        <ReferenceLine x={90} stroke="#ef4444" strokeDasharray="3 3" />
        <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={getColor(entry.utilization)} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
