"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function WingDistributionChart({ data }: { data: { name: string; members: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No wings to chart yet.</p>;
  }

  return (
    <figure>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" />
            <YAxis type="category" dataKey="name" width={180} stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
            <Bar dataKey="members" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        Active members by wing: {data.map((row) => `${row.name}: ${row.members}`).join("; ")}.
      </figcaption>
    </figure>
  );
}
