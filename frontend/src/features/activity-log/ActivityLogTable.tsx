import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ACTION_LABELS, RESOURCE_LABELS } from "./labels";
import type { ActivityLog } from "./types";

const TIMESTAMP_FMT = new Intl.DateTimeFormat("zh-TW", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

interface Props {
  items: ActivityLog[] | null;
  emptyMessage?: string;
}

export function ActivityLogTable({ items, emptyMessage = "尚無操作紀錄" }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card/60 shadow-sm backdrop-blur">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px]">時間</TableHead>
            <TableHead className="w-[140px]">操作者</TableHead>
            <TableHead className="w-[140px]">動作</TableHead>
            <TableHead className="w-[100px]">資源</TableHead>
            <TableHead className="w-[160px]">目標</TableHead>
            <TableHead>摘要</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items === null ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <TableRow key={idx}>
                {Array.from({ length: 6 }).map((__, c) => (
                  <TableCell key={c}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            items.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs">
                  {TIMESTAMP_FMT.format(new Date(log.timestamp))}
                </TableCell>
                <TableCell>{log.actorName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{ACTION_LABELS[log.action]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {RESOURCE_LABELS[log.resource]}
                </TableCell>
                <TableCell className="font-medium">{log.targetLabel}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{log.summary}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
