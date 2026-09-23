/**
 * Staff IAM catalogs from Figma MANAGEMENTUSER + ROLE.png.
 * Permission codes are platform catalog verbs (same as GET /api/v1/iam/permissions).
 * Banks compose roles from these codes — they do not invent new permission strings.
 */

/** ROLE.png + User Management list samples (Operations). */
export const STAFF_ROLES = [
  "Super Admin",
  "Admin",
  "Finance",
  "Support",
  "Operations",
] as const;

export const USER_STATUSES = ["Active", "Inactive"] as const;

/** Subset of the Bank247 IAM permission catalog for role composition UI. */
export const IAM_PERMISSION_CATALOG = [
  "account.read",
  "account.write",
  "customer.read",
  "customer.write",
  "gl.read",
  "gl.write",
  "iam.user.read",
  "iam.user.write",
  "iam.role.read",
  "iam.role.write",
  "ledger.read",
  "ledger.post",
  "loan.read",
  "loan.disburse",
  "loan.write",
  "report.read",
  "teller.read",
  "teller.cash",
  "transaction.read",
  "transaction.write",
  "treasury.read",
  "treasury.operate",
] as const;
