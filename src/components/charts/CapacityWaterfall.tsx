'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TeamCapacity {
  teamName: string;
  totalHoursPerWeek: number;
  kloTlmHours: number;
  adminHours: number;
  projectCapacityPerWeek: number;
}

export default function CapacityWaterfall({ data }: { data: TeamCapacity[] }) {
  const chartData = data.map(tc => ({
    name: tc.teamName,
    'KLO/TLM': tc.kloTlmHours,
    'Admin': Math.round(tc.adminHours),
    'Project Capacity': Math.round(tc.projectCapacityPerWeek),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
        <XAxis dataKey="name" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }} />
        <YAxis tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }} label={{ value: 'Hours/Week', angle: -90, position: 'insideLeft', fill: 'hsl(215 20.2% 65.1%)' }} />
        <Tooltip contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)', borderRadius: '8px', color: 'hsl(210 40% 98%)' }} />
        <Legend />
        <Bar dataKey="KLO/TLM" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Admin" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Project Capacity" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
