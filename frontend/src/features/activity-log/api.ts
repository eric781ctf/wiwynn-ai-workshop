import { api } from "@/lib/api-client";
import type { ListActivityLogsParams, ListActivityLogsResponse } from "./types";

export function listActivityLogs(params: ListActivityLogsParams = {}) {
  const search = new URLSearchParams();
  if (params.actorId) search.set("actorId", params.actorId);
  if (params.action) search.set("action", params.action);
  if (params.resource) search.set("resource", params.resource);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.pageSize !== undefined) search.set("pageSize", String(params.pageSize));
  const qs = search.toString();
  const path = qs ? `/api/activity-logs?${qs}` : "/api/activity-logs";
  return api<ListActivityLogsResponse>(path);
}
