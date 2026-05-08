import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Vehicle, VehicleInput, VehicleStatus } from "./types";
import type { Employee } from "@/features/employees/types";

const currentYear = new Date().getFullYear();

const UNASSIGNED = "__unassigned__";

const schema = z.object({
  plateNo: z.string().min(1, "請輸入車牌號碼"),
  brand: z.string().min(1, "請輸入廠牌"),
  model: z.string().min(1, "請輸入車型"),
  year: z
    .number({ message: "請輸入年份" })
    .int("年份必須為整數")
    .min(1980, "年份不可小於 1980")
    .max(currentYear + 1, `年份不可大於 ${currentYear + 1}`),
  status: z.enum(["available", "in_use", "maintenance"]),
  assignedTo: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface VehicleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Vehicle | null;
  employees: Employee[];
  canAssign: boolean;
  onSubmit: (values: VehicleInput) => Promise<void>;
}

const STATUS_OPTIONS: Array<{ value: VehicleStatus; label: string }> = [
  { value: "available", label: "可用" },
  { value: "in_use", label: "使用中" },
  { value: "maintenance", label: "維修中" },
];

export function VehicleForm({
  open,
  onOpenChange,
  initial,
  employees,
  canAssign,
  onSubmit,
}: VehicleFormProps) {
  const isEdit = Boolean(initial);
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plateNo: "",
      brand: "",
      model: "",
      year: currentYear,
      status: "available",
      assignedTo: UNASSIGNED,
    },
  });

  React.useEffect(() => {
    if (open) {
      setServerError(null);
      reset(
        initial
          ? {
              plateNo: initial.plateNo,
              brand: initial.brand,
              model: initial.model,
              year: initial.year,
              status: initial.status,
              assignedTo: initial.assignedTo ?? UNASSIGNED,
            }
          : {
              plateNo: "",
              brand: "",
              model: "",
              year: currentYear,
              status: "available",
              assignedTo: UNASSIGNED,
            }
      );
    }
  }, [open, initial, reset]);

  const status = watch("status");
  const assignedTo = watch("assignedTo");

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({
        plateNo: values.plateNo.trim().toUpperCase(),
        brand: values.brand.trim(),
        model: values.model.trim(),
        year: values.year,
        status: values.status,
        assignedTo:
          values.assignedTo === UNASSIGNED ? null : values.assignedTo,
      });
      onOpenChange(false);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯車輛" : "新增車輛"}</DialogTitle>
          <DialogDescription>
            填寫車輛基本資料。{canAssign ? "可指派負責人。" : "負責人僅管理者可指派。"}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="plateNo">車牌號碼</Label>
            <Input id="plateNo" placeholder="ABC-1234" {...register("plateNo")} />
            {errors.plateNo ? (
              <p className="text-xs text-destructive">{errors.plateNo.message}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">廠牌</Label>
              <Input id="brand" placeholder="Toyota" {...register("brand")} />
              {errors.brand ? (
                <p className="text-xs text-destructive">{errors.brand.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">車型</Label>
              <Input id="model" placeholder="Camry" {...register("model")} />
              {errors.model ? (
                <p className="text-xs text-destructive">{errors.model.message}</p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">年份</Label>
              <Input
                id="year"
                type="number"
                {...register("year", { valueAsNumber: true })}
              />
              {errors.year ? (
                <p className="text-xs text-destructive">{errors.year.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">狀態</Label>
              <Select
                value={status}
                onValueChange={(v) => setValue("status", v as VehicleStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status ? (
                <p className="text-xs text-destructive">{errors.status.message}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignedTo">負責人 (保養人)</Label>
            <Select
              value={assignedTo}
              onValueChange={(v) => setValue("assignedTo", v)}
              disabled={!canAssign}
            >
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="選擇員工…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>未指派</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} · {e.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!canAssign ? (
              <p className="text-xs text-muted-foreground">
                僅管理者可調整負責人；目前以唯讀顯示。
              </p>
            ) : null}
          </div>
          {serverError ? (
            <p className="text-sm text-destructive">{serverError}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "儲存中…" : "儲存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
