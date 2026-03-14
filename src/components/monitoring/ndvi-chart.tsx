"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";

interface Props {
  data: { date: string; ndvi: number }[];
}

export function NdviChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} width={36} />
        <Tooltip
          formatter={(value) => [(value as number).toFixed(3), "NDVI"]}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{ fontSize: 12 }}
        />
        <ReferenceLine y={0.4} stroke="#16a34a" strokeDasharray="4 2" label={{ value: "Dense", fontSize: 10, fill: "#16a34a" }} />
        <ReferenceLine y={0.2} stroke="#ca8a04" strokeDasharray="4 2" label={{ value: "Moderate", fontSize: 10, fill: "#ca8a04" }} />
        <Line
          type="monotone"
          dataKey="ndvi"
          stroke="#16a34a"
          strokeWidth={2}
          dot={{ r: 4, fill: "#16a34a" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
