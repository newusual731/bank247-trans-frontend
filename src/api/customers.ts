import { apiRequest } from "../lib/apiClient";

export type CustomerSearchParams = {
  cifNumber?: string;
  bvn?: string;
  nin?: string;
  mobileNumber?: string;
  email?: string;
  name?: string;
  status?: string;
  type?: string;
  branchCode?: string;
  page?: number;
  size?: number;
};

export function searchCustomers(params: CustomerSearchParams = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest(`/api/v1/customers${suffix}`);
}

export function getCustomerByCif(cifNumber: string) {
  return apiRequest(`/api/v1/customers/cif/${encodeURIComponent(cifNumber)}`);
}

export function getCustomer(id: string) {
  return apiRequest(`/api/v1/customers/${encodeURIComponent(id)}`);
}
