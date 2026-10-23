import { apiRequest } from "../lib/apiClient";

export type Branch = {
  id?: string;
  code: string;
  name?: string;
  status?: string;
  currency?: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export function listBranches(params: { status?: string; page?: number; size?: number } = {}) {
  const qs = new URLSearchParams();
  Object.entries({ page: 0, size: 100, ...params }).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  return apiRequest<PageResponse<Branch> | Branch[]>(`/api/v1/branches?${qs}`);
}
