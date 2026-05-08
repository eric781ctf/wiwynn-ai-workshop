import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { VehicleStatus } from "@/features/vehicles/types";

interface DataItem {
  status: VehicleStatus;
  count: number;
}

const STATUS_LABEL: Record<VehicleStatus, string> = {
  available: "可用",
  in_use: "使用中",
  maintenance: "維修中",
};

const STATUS_COLOR: Record<VehicleStatus, string> = {
  available: "#10b981",
  in_use: "#8b5cf6",
  maintenance: "#f59e0b",
};

interface VehicleStatusChartProps {
  data: DataItem[];
}

export function VehicleStatusChart({ data }: VehicleStatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        尚無資料
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: STATUS_LABEL[d.status],
    value: d.count,
    fill: STATUS_COLOR[d.status],
  }));

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={3}
            stroke="none"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid hsl(240 6% 90%)",
              boxShadow: "0 8px 24px rgba(0,0,0,.06)",
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-7">
        <div className="text-center">
          <div className="text-3xl font-semibold tracking-tight">{total}</div>
          <div className="text-xs text-muted-foreground">總車輛</div>
        </div>
      </div>
    </div>
  );
}
