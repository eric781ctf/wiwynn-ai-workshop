import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Car, Users, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "儀表板", icon: LayoutDashboard },
  { to: "/vehicles", label: "車輛管理", icon: Car },
  { to: "/employees", label: "員工管理", icon: Users, adminOnly: true },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="relative flex min-h-screen bg-app-aurora">
      <div className="absolute inset-0 bg-grid-fade pointer-events-none" />

      <aside className="relative hidden w-64 shrink-0 border-r border-white/40 bg-white/70 backdrop-blur-xl md:flex md:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-white/40 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500 text-white shadow-md shadow-violet-500/30">
            <Car className="h-5 w-5" />
          </div>
          <div className="text-base font-semibold tracking-tight text-gradient-brand">
            車輛管理系統
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 text-violet-700 shadow-sm"
                      : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-gradient-to-b from-violet-500 to-fuchsia-500" />
                    ) : null}
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="mx-4 mb-4 rounded-lg border border-violet-200/60 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-3 text-xs text-violet-900/80">
          <div className="flex items-center gap-1 font-medium">
            <Sparkles className="h-3 w-3" />
            MVP 模式
          </div>
          <p className="mt-1 text-violet-900/60">
            所有資料由 MSW 模擬，重新整理仍會保留。
          </p>
        </div>
      </aside>

      <div className="relative flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-white/40 bg-white/60 px-6 backdrop-blur-xl">
          <div className="text-sm text-muted-foreground md:hidden">車輛管理系統</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/70 py-1 pl-1 pr-3 shadow-sm">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white",
                  isAdmin
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                    : "bg-gradient-to-br from-sky-500 to-cyan-500"
                )}
              >
                {user?.name?.slice(0, 1) ?? "?"}
              </span>
              <div className="text-sm leading-tight">
                <div className="font-medium">{user?.name ?? "訪客"}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isAdmin ? "ADMIN" : "USER"}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              登出
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
