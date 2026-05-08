import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Car, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/AuthContext";
import { ApiError } from "@/lib/api-client";

const loginSchema = z.object({
  username: z.string().min(1, "請輸入帳號"),
  password: z.string().min(1, "請輸入密碼"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await login(values.username, values.password);
      toast.success("登入成功");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "登入失敗，請稍後再試";
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-app-aurora p-4">
      {/* floating gradient blobs */}
      <div
        className="blob"
        style={{
          width: "32rem",
          height: "32rem",
          left: "-8rem",
          top: "-8rem",
          background:
            "radial-gradient(circle at 30% 30%, hsl(262 83% 70% / .9), hsl(262 83% 50% / 0))",
        }}
      />
      <div
        className="blob"
        style={{
          width: "30rem",
          height: "30rem",
          right: "-6rem",
          bottom: "-6rem",
          background:
            "radial-gradient(circle at 60% 50%, hsl(199 89% 65% / .85), hsl(199 89% 55% / 0))",
          animationDelay: "2s",
        }}
      />
      <div className="absolute inset-0 bg-grid-fade pointer-events-none" />

      <Card className="glow-card relative w-full max-w-sm border-white/40 bg-white/70 backdrop-blur-xl">
        <CardContent className="space-y-6 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500 text-white shadow-lg shadow-violet-500/30">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gradient-brand">
                車輛管理系統
              </h1>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" /> 請使用您的帳號密碼登入
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="username">帳號</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="admin"
                {...register("username")}
              />
              {errors.username ? (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              ) : null}
            </div>
            {serverError ? (
              <p className="text-sm text-destructive">{serverError}</p>
            ) : null}
            <Button
              type="submit"
              className="shimmer-btn w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700"
              disabled={submitting}
            >
              {submitting ? "登入中…" : "登入"}
            </Button>
          </form>

          <div className="rounded-lg border border-violet-200/60 bg-violet-50/60 p-3 text-xs text-violet-900/80">
            <div className="font-medium">展示帳號</div>
            <div className="mt-1 grid grid-cols-2 gap-1 font-mono">
              <span>admin</span><span className="text-violet-600">admin123</span>
              <span>user</span><span className="text-violet-600">user123</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
