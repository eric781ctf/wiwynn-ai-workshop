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
import {
  ACTION_LABELS,
  ACTION_OPTIONS,
  ACTOR_OPTIONS,
  RESOURCE_LABELS,
  RESOURCE_OPTIONS,
} from "./labels";
import type { ActivityAction, ActivityResource } from "./types";

const ALL = "__all__";

export interface ActivityLogFilterState {
  actorId?: string;
  action?: ActivityAction;
  resource?: ActivityResource;
  from?: string;
  to?: string;
}

interface Props {
  value: ActivityLogFilterState;
  onChange: (next: ActivityLogFilterState) => void;
}

export function ActivityLogFilters({ value, onChange }: Props) {
  const update = (patch: Partial<ActivityLogFilterState>) => {
    onChange({ ...value, ...patch });
  };

  const clear = () => onChange({});

  return (
    <div className="grid gap-4 rounded-xl border bg-card/60 p-4 shadow-sm backdrop-blur md:grid-cols-5">
      <div className="space-y-2">
        <Label>操作者</Label>
        <Select
          value={value.actorId ?? ALL}
          onValueChange={(v) => update({ actorId: v === ALL ? undefined : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部</SelectItem>
            {ACTOR_OPTIONS.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>動作</Label>
        <Select
          value={value.action ?? ALL}
          onValueChange={(v) =>
            update({ action: v === ALL ? undefined : (v as ActivityAction) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部</SelectItem>
            {ACTION_OPTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {ACTION_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>資源</Label>
        <Select
          value={value.resource ?? ALL}
          onValueChange={(v) =>
            update({ resource: v === ALL ? undefined : (v as ActivityResource) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部</SelectItem>
            {RESOURCE_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {RESOURCE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="log-from">起始日期</Label>
        <Input
          id="log-from"
          type="date"
          value={value.from ?? ""}
          onChange={(e) => update({ from: e.target.value || undefined })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="log-to">結束日期</Label>
        <div className="flex gap-2">
          <Input
            id="log-to"
            type="date"
            value={value.to ?? ""}
            onChange={(e) => update({ to: e.target.value || undefined })}
          />
          <Button type="button" variant="outline" onClick={clear} className="shrink-0">
            清除
          </Button>
        </div>
      </div>
    </div>
  );
}
