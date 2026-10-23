import { apiRequest } from "../lib/apiClient";

export function createIamRole(body: {
  code: string;
  name: string;
  description?: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ownerUserId?: string;
  permissionCodes: string[];
}) {
  return apiRequest("/api/v1/iam/roles", {
    method: "POST",
    body: {
      riskLevel: "MEDIUM",
      ...body,
    },
  });
}

export function submitIamRole(id: string) {
  return apiRequest(`/api/v1/iam/roles/${encodeURIComponent(id)}/submit`, { method: "POST" });
}

export function applyIamRole(id: string) {
  return apiRequest(`/api/v1/iam/roles/${encodeURIComponent(id)}/apply`, { method: "POST" });
}

export function createIamUser(body: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  branchCode?: string;
  departmentCode?: string;
  mfaRequired?: boolean;
}) {
  return apiRequest("/api/v1/iam/users", {
    method: "POST",
    body: { mfaRequired: false, ...body },
  });
}

export function submitIamUserCreate(id: string) {
  return apiRequest(`/api/v1/iam/users/${encodeURIComponent(id)}/submit-create`, { method: "POST" });
}

export function applyIamUserCreate(id: string) {
  return apiRequest(`/api/v1/iam/users/${encodeURIComponent(id)}/apply-create`, { method: "POST" });
}

export function disableIamUser(id: string, reason?: string) {
  const qs = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  return apiRequest(`/api/v1/iam/users/${encodeURIComponent(id)}/disable${qs}`, { method: "POST" });
}
