import { apiRequest } from "../lib/apiClient";

export type NotificationDelivery = {
  id: string;
  requestReference?: string;
  templateCode?: string;
  channel?: string;
  recipientMasked?: string;
  status?: string;
  createdAt?: string;
  subject?: string;
  bodyPreview?: string;
};

export type NotificationTemplate = {
  id: string;
  code: string;
  channel: string;
  subjectTemplate?: string;
  status?: string;
  active?: boolean;
  version?: number;
};

export type PageLike<T> = { content?: T[]; totalElements?: number } | T[];

function toList<T>(res: PageLike<T>): T[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object" && Array.isArray(res.content)) return res.content;
  return [];
}

export async function listNotifications(params?: {
  status?: string;
  channel?: string;
  page?: number;
  size?: number;
}) {
  const qs = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  if (!qs.has("page")) qs.set("page", "0");
  if (!qs.has("size")) qs.set("size", "50");
  const res = await apiRequest<PageLike<NotificationDelivery>>(`/api/v1/notifications?${qs}`);
  return toList(res);
}

export async function listNotificationTemplates(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await apiRequest<PageLike<NotificationTemplate>>(`/api/v1/notification-templates${qs}`);
  return toList(res);
}

export function getNotification(id: string) {
  return apiRequest<NotificationDelivery>(`/api/v1/notifications/${encodeURIComponent(id)}`);
}
