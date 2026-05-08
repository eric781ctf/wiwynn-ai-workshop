import * as React from "react";
import { Plus, Pencil, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { EmployeeForm } from "@/features/employees/EmployeeForm";
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "@/features/employees/api";
import { listVehicles } from "@/features/vehicles/api";
import type { Employee, EmployeeInput } from "@/features/employees/types";

export function EmployeesPage() {
  const [employees, setEmployees] = React.useState<Employee[] | null>(null);
  const [assignedIds, setAssignedIds] = React.useState<Set<string>>(new Set());
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Employee | null>(null);
  const [confirmTarget, setConfirmTarget] = React.useState<Employee | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      setLoadError(null);
      const [es, vs] = await Promise.all([listEmployees(), listVehicles()]);
      setEmployees(es);
      setAssignedIds(
        new Set(vs.map((v) => v.assignedTo).filter((id): id is string => id !== null))
      );
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "載入失敗");
      setEmployees([]);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSubmit = async (values: EmployeeInput) => {
    if (editing) {
      await updateEmployee(editing.id, values);
      toast.success("更新成功");
    } else {
      await createEmployee(values);
      toast.success("新增成功");
    }
    await refresh();
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    try {
      await deleteEmployee(confirmTarget.id);
      toast.success("刪除成功");
      setConfirmTarget(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "刪除失敗");
    }
  };

  const targetIsAssigned = confirmTarget && assignedIds.has(confirmTarget.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">員工管理</h1>
          <p className="text-sm text-muted-foreground">僅管理者可檢視與維護員工資料</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="shimmer-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          新增員工
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card/60 shadow-sm backdrop-blur">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead>員工</TableHead>
              <TableHead>部門</TableHead>
              <TableHead>職稱</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>到職日</TableHead>
              <TableHead className="w-[160px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees === null ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow key={idx}>
                  {Array.from({ length: 6 }).map((__, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {loadError ?? "尚無員工資料"}
                </TableCell>
              </TableRow>
            ) : (
              employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-semibold text-white shadow-sm shadow-violet-500/30">
                        {e.name.slice(0, 1)}
                      </span>
                      <span className="font-medium">{e.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{e.department}</TableCell>
                  <TableCell>{e.title}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {e.email}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{e.hiredAt}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(e);
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
                      onClick={() => setConfirmTarget(e)}
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

      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(o) => !o && setConfirmTarget(null)}
        title="確定要刪除這位員工嗎？"
        description={
          confirmTarget ? (
            <span>
              將永久刪除員工「{confirmTarget.name}」的資料。
              {targetIsAssigned ? (
                <>
                  <br />
                  <span className="text-amber-600">
                    注意：此員工目前已被指派車輛，刪除後車輛指派會自動解除。
                  </span>
                </>
              ) : null}
            </span>
          ) : null
        }
        confirmText="確定刪除"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
