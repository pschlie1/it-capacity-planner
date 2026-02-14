'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Allocation {
  projectName: string; startWeek: number; endWeek: number; feasible: boolean;
  teamAllocations: { teamId: string; phases: { phase: string; startWeek: number; endWeek: number; hoursPerWeek: number[] }[] }[];
}

interface TeamCapacity {
  teamId: string; projectCapacityPerWeek: number;
}

export default function DemandSupplyChart({ allocations, teamCapacities }: { allocations: Allocation[]; teamCapacities: TeamCapacity[] }) {
  const totalSupply = teamCapacities.reduce((s, tc) => s + tc.projectCapacityPerWeek, 0);

  // Build weekly demand
  const weeklyDemand: number[] = Array(52).fill(0);
  for (const alloc of allocations) {
    for (const ta of alloc.teamAllocations) {
      for (const phase of ta.phases) {
        phase.hoursPerWeek.forEach((h, i) => {
          const week = phase.startWeek + i;
          if (week < 52) weeklyDemand[week] += h;
        });
      }
    }
  }

  // Monthly aggregation
  const data = Array.from({ length: 12 }, (_, i) => {
    const startWeek = Math.floor(i * 52 / 12);
    const endWeek = Math.floor((i + 1) * 52 / 12);
    const weeks = endWeek - startWeek;
    let demand = 0;
    for (let w = startWeek; w < endWeek && w < 52; w++) demand += weeklyDemand[w];
    return {
      name: `M${i + 1}`,
      demand: Math.round(demand / weeks),
      supply: Math.round(totalSupply),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2 32.6% 17.5%)" />
        <XAxis dataKey="name" tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }} />
        <YAxis tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }} label={{ value: 'Hours/Week', angle: -90, position: 'insideLeft', fill: 'hsl(215 20.2% 65.1%)' }} />
        <Tooltip contentStyle={{ backgroundColor: 'hsl(222.2 84% 4.9%)', border: '1px solid hsl(217.2 32.6% 17.5%)', borderRadius: '8px', color: 'hsl(210 40% 98%)' }} />
        <Legend />
        <Area type="monotone" dataKey="supply" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} name="Available Capacity" />
        <Area type="monotone" dataKey="demand" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} name="Project Demand" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
