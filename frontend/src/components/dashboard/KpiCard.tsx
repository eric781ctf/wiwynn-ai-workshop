import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "violet" | "emerald" | "sky" | "amber";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  accent?: Accent;
}

const ACCENT_RING: Record<Accent, string> = {
  violet: "from-violet-500/30 via-fuchsia-500/15 to-transparent",
  emerald: "from-emerald-500/30 via-teal-500/15 to-transparent",
  sky: "from-sky-500/30 via-cyan-500/15 to-transparent",
  amber: "from-amber-500/30 via-orange-500/15 to-transparent",
};

const ACCENT_ICON: Record<Accent, string> = {
  violet: "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-violet-500/30",
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-500/30",
  sky: "bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-sky-500/30",
  amber: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/30",
};

export function KpiCard({ icon: Icon, label, value, hint, accent = "violet" }: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/60 bg-white/70 p-6 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={cn(
          "absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-80 blur-2xl",
          ACCENT_RING[accent]
        )}
      />
      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-105",
            ACCENT_ICON[accent]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="text-3xl font-semibold tracking-tight">{value}</span>
          {hint ? (
            <span className="mt-0.5 text-xs text-muted-foreground">{hint}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
