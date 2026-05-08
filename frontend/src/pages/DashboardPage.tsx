import * as React from "react";
import { Car, CheckCircle2, Users, TrendingUp, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { VehicleStatusChart } from "@/components/dashboard/VehicleStatusChart";
import { getSummary, type DashboardSummary } from "@/features/dashboard/api";
import { useAuth } from "@/features/auth/AuthContext";

type State =
  | { status: "loading" }
  | { status: "ready"; data: DashboardSummary }
  | { status: "error"; message: string };

export function DashboardPage() {
  const { user } = useAuth();
  const [state, setState] = React.useState<State>({ status: "loading" });

  const load = React.useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await getSummary();
      setState({ status: "ready", data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "資料載入失敗";
      setState({ status: "error", message: msg });
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-white/60 bg-white/70 p-12 text-center backdrop-blur">
        <div className="text-base font-medium">資料載入失敗</div>
        <p className="text-sm text-muted-foreground">{state.message}</p>
        <Button onClick={() => void load()}>重試</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50/60 px-3 py-1 text-xs font-medium text-violet-700">
          <Sparkles className="h-3 w-3" />
          您好，{user?.name ?? "訪客"}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          <span className="text-gradient-brand">儀表板</span>
        </h1>
        <p className="text-sm text-muted-foreground">系統營運概況一目了然</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {state.status === "loading" ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-[112px] w-full rounded-xl" />
          ))
        ) : (
          <>
            <KpiCard
              icon={Car}
              label="車輛總數"
              value={state.data.totalVehicles.toLocaleString()}
              accent="violet"
            />
            <KpiCard
              icon={CheckCircle2}
              label="可用車輛"
              value={state.data.availableVehicles.toLocaleString()}
              accent="emerald"
            />
            <KpiCard
              icon={Users}
              label="員工總數"
              value={state.data.totalEmployees.toLocaleString()}
              accent="sky"
            />
            <KpiCard
              icon={TrendingUp}
              label="本月使用率"
              value={`${state.data.monthlyUsageRate}%`}
              accent="amber"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glow-card overflow-hidden rounded-xl border border-white/60 bg-white/70 backdrop-blur lg:col-span-2">
          <div className="border-b border-white/40 px-6 py-4">
            <h2 className="text-base font-semibold">車輛狀態分佈</h2>
            <p className="text-xs text-muted-foreground">即時計算當前車輛分佈狀況</p>
          </div>
          <div className="p-6">
            {state.status === "loading" ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <VehicleStatusChart data={state.data.vehicleStatusBreakdown} />
            )}
          </div>
        </div>

        <div className="glow-card flex flex-col gap-4 overflow-hidden rounded-xl border border-white/60 bg-white/70 p-6 backdrop-blur">
          <div>
            <h2 className="text-base font-semibold">系統提示</h2>
            <p className="text-xs text-muted-foreground">MVP 操作小撇步</p>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-xs font-semibold text-violet-700">1</span>
              <span>到「車輛管理」可檢視所有車輛與其負責人。</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-xs font-semibold text-emerald-700">2</span>
              <span>管理者可在編輯車輛時，從員工清單指派負責人 (保養人)。</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-100 text-xs font-semibold text-sky-700">3</span>
              <span>所有資料異動會即時反映在儀表板的統計上。</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
