import * as React from "react";
import { Plus, Pencil, Trash2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { VehicleForm } from "@/features/vehicles/VehicleForm";
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/features/vehicles/api";
import { listEmployees } from "@/features/employees/api";
import type { Vehicle, VehicleInput, VehicleStatus } from "@/features/vehicles/types";
import type { Employee } from "@/features/employees/types";
import { useAuth } from "@/features/auth/AuthContext";

const STATUS_LABEL: Record<VehicleStatus, string> = {
  available: "可用",
  in_use: "使用中",
  maintenance: "維修中",
};

const STATUS_VARIANT: Record<VehicleStatus, "success" | "default" | "warning"> = {
  available: "success",
  in_use: "default",
  maintenance: "warning",
};

export function VehiclesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [vehicles, setVehicles] = React.useState<Vehicle[] | null>(null);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Vehicle | null>(null);
  const [confirmTarget, setConfirmTarget] = React.useState<Vehicle | null>(null);

  const employeeMap = React.useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((e) => map.set(e.id, e));
    return map;
  }, [employees]);

  const refresh = React.useCallback(async () => {
    try {
      setLoadError(null);
      const [vs, es] = await Promise.all([listVehicles(), listEmployees()]);
      setVehicles(vs);
      setEmployees(es);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "載入失敗");
      setVehicles([]);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSubmit = async (values: VehicleInput) => {
    if (editing) {
      await updateVehicle(editing.id, values);
      toast.success("更新成功");
    } else {
      await createVehicle(values);
      toast.success("新增成功");
    }
    await refresh();
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    try {
      await deleteVehicle(confirmTarget.id);
      toast.success("刪除成功");
      setConfirmTarget(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  const renderAssignee = (id: string | null) => {
    if (!id) {
      return <span className="text-muted-foreground">未指派</span>;
    }
    const e = employeeMap.get(id);
    if (!e) {
      return <span className="text-muted-foreground italic">已離職</span>;
    }
    return (
      <span className="inline-flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-semibold text-white">
          {e.name.slice(0, 1)}
        </span>
        <span>
          <span className="font-medium">{e.name}</span>
          <span className="ml-1 text-xs text-muted-foreground">{e.department}</span>
        </span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">車輛管理</h1>
          <p className="text-sm text-muted-foreground">檢視與維護所有車輛資料</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="shimmer-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          新增車輛
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card/60 shadow-sm backdrop-blur">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead>車牌號碼</TableHead>
              <TableHead>廠牌</TableHead>
              <TableHead>車型</TableHead>
              <TableHead>年份</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>負責人 (保養人)</TableHead>
              <TableHead className="w-[160px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles === null ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow key={idx}>
                  {Array.from({ length: 7 }).map((__, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {loadError ?? "尚無車輛資料"}
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono font-medium">{v.plateNo}</TableCell>
                  <TableCell>{v.brand}</TableCell>
                  <TableCell>{v.model}</TableCell>
                  <TableCell>{v.year}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[v.status]}>
                      {STATUS_LABEL[v.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{renderAssignee(v.assignedTo)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(v);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      編輯
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmTarget(v)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      刪除
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isAdmin ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <UserCircle2 className="h-4 w-4" />
          您是一般使用者，可檢視所有資訊但無法調整負責人。
        </p>
      ) : null}

      <VehicleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        employees={employees}
        canAssign={isAdmin}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(o) => !o && setConfirmTarget(null)}
        title="確定要刪除這台車輛嗎？"
        description={
          confirmTarget
            ? `將永久刪除車牌「${confirmTarget.plateNo}」的車輛資料。`
            : null
        }
        confirmText="確定刪除"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
