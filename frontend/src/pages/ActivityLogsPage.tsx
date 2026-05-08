import * as React from "react";
import { toast } from "sonner";
import { listActivityLogs } from "@/features/activity-log/api";
import {
  ActivityLogFilters,
  type ActivityLogFilterState,
} from "@/features/activity-log/ActivityLogFilters";
import { ActivityLogTable } from "@/features/activity-log/ActivityLogTable";
import { ActivityLogPagination } from "@/features/activity-log/ActivityLogPagination";
import type { ActivityLog } from "@/features/activity-log/types";

const PAGE_SIZE = 20;

export function ActivityLogsPage() {
  const [filters, setFilters] = React.useState<ActivityLogFilterState>({});
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<ActivityLog[] | null>(null);
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setItems(null);
    listActivityLogs({ ...filters, page, pageSize: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        setTotal(0);
        toast.error(err instanceof Error ? err.message : "載入紀錄失敗");
      });
    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  const handleFiltersChange = (next: ActivityLogFilterState) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">操作紀錄</h1>
        <p className="text-sm text-muted-foreground">僅管理者可檢視；紀錄為當下值的快照。</p>
      </div>

      <ActivityLogFilters value={filters} onChange={handleFiltersChange} />

      <ActivityLogTable items={items} />

      <ActivityLogPagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
