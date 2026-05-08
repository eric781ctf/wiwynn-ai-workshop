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
import type { Employee, EmployeeInput } from "./types";

const schema = z.object({
  name: z.string().min(1, "請輸入姓名"),
  department: z.string().min(1, "請輸入部門"),
  title: z.string().min(1, "請輸入職稱"),
  email: z.string().min(1, "請輸入 Email").email("請輸入有效的 Email"),
  hiredAt: z.string().min(1, "請選擇到職日"),
});

type FormValues = z.infer<typeof schema>;

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Employee | null;
  onSubmit: (values: EmployeeInput) => Promise<void>;
}

export function EmployeeForm({ open, onOpenChange, initial, onSubmit }: EmployeeFormProps) {
  const isEdit = Boolean(initial);
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      department: "",
      title: "",
      email: "",
      hiredAt: new Date().toISOString().slice(0, 10),
    },
  });

  React.useEffect(() => {
    if (open) {
      setServerError(null);
      reset(
        initial ?? {
          name: "",
          department: "",
          title: "",
          email: "",
          hiredAt: new Date().toISOString().slice(0, 10),
        }
      );
    }
  }, [open, initial, reset]);

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({
        name: values.name.trim(),
        department: values.department.trim(),
        title: values.title.trim(),
        email: values.email.trim(),
        hiredAt: values.hiredAt,
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
          <DialogTitle>{isEdit ? "編輯員工" : "新增員工"}</DialogTitle>
          <DialogDescription>填寫員工基本資料，所有欄位皆為必填。</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input id="name" placeholder="王小明" {...register("name")} />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">部門</Label>
              <Input id="department" placeholder="業務部" {...register("department")} />
              {errors.department ? (
                <p className="text-xs text-destructive">{errors.department.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">職稱</Label>
              <Input id="title" placeholder="工程師" {...register("title")} />
              {errors.title ? (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hiredAt">到職日</Label>
            <Input id="hiredAt" type="date" {...register("hiredAt")} />
            {errors.hiredAt ? (
              <p className="text-xs text-destructive">{errors.hiredAt.message}</p>
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
