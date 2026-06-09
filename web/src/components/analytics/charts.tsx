import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TGrowthPoint, TMonthlyPoint } from "../../api/analytics";
import { formatBytes, formatMonth } from "./format";

export const CHART_COLORS = {
  primary: "#006FEE",
  secondary: "#9353d3",
  success: "#17c964",
  warning: "#f5a524",
};

const TOOLTIP_STYLE = {
  backgroundColor: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "8px",
  fontSize: "12px",
};

const AXIS_TICK = { fill: "#71717a", fontSize: 12 };

export function MonthlyActivityChart({ data }: { data: TMonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={AXIS_TICK}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatBytes(v)}
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(label) => formatMonth(String(label))}
          formatter={(value, name) => [formatBytes(Number(value)), name]}
          cursor={{ fill: "#27272a", opacity: 0.4 }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar
          dataKey="backupBytes"
          name="Backups"
          stackId="bytes"
          fill={CHART_COLORS.primary}
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="snapshotBytes"
          name="Snapshots"
          stackId="bytes"
          fill={CHART_COLORS.secondary}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StorageGrowthChart({ data }: { data: TGrowthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={CHART_COLORS.warning}
              stopOpacity={0.35}
            />
            <stop
              offset="95%"
              stopColor={CHART_COLORS.warning}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={AXIS_TICK}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatBytes(v)}
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(label) => formatMonth(String(label))}
          formatter={(value) => [formatBytes(Number(value)), "Projected storage"]}
        />
        <Area
          type="monotone"
          dataKey="storageBytes"
          name="Projected storage"
          stroke={CHART_COLORS.warning}
          strokeWidth={2}
          fill="url(#growthGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ConnectionStorageChart({
  data,
}: {
  data: { name: string; storageBytes: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#27272a"
          horizontal={false}
        />
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatBytes(v)}
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS_TICK}
          axisLine={{ stroke: "#3f3f46" }}
          tickLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [formatBytes(Number(value)), "Stored"]}
          cursor={{ fill: "#27272a", opacity: 0.4 }}
        />
        <Bar
          dataKey="storageBytes"
          name="Stored"
          fill={CHART_COLORS.primary}
          radius={[0, 4, 4, 0]}
          barSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
