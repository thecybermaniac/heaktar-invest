import { Area, AreaChart, CartesianGrid, ResponsiveContainer, YAxis } from "recharts";

export default function PerformanceChart({ data }: { data: { day: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="perf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid stroke="var(--border)" strokeOpacity={1} strokeDasharray="2 2" vertical={true} />

        <YAxis hide domain={["dataMin - 300", "dataMax + 200"]} />

        <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.4} fill="url(#perf)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
