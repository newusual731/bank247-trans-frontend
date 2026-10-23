import { apiRequest } from "../lib/apiClient";

export type StaffProfile = {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  branchCode?: string;
  departmentCode?: string;
  status?: string;
  lastLoginAt?: string;
  mfaRequired?: boolean;
  mfaEnrolled?: boolean;
};

export function getMyProfile() {
  return apiRequest<StaffProfile>("/api/v1/iam/users/me");
}

export function getUserByUsername(username: string) {
  return apiRequest<StaffProfile>(
    `/api/v1/iam/users/by-username?username=${encodeURIComponent(username)}`,
  );
}
