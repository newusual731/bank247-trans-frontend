/**
 * Route → catalog permission for the transaction app.
 * Login alone is enough when a path is absent. Approvals stay open to any
 * signed-in user because a supervisor can decide a request without workflow.read.
 */
const ROUTE_PERMISSIONS: ReadonlyArray<readonly [prefix: string, permission: string]> = [
  ["/accounts", "account.read"],
  ["/gl", "gl.read"],
  ["/reporting", "report.read"],
  ["/reports", "report.read"],
  ["/teller", "teller.read"],
  ["/settings/roles", "iam.role.read"],
  ["/settings/users", "iam.user.read"],
  ["/settings/products", "product.read"],
  ["/notifications", "notification.read"],
];

export function permissionForPath(pathname: string): string | null {
  let best: { prefix: string; permission: string } | null = null;
  for (const [prefix, permission] of ROUTE_PERMISSIONS) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      if (!best || prefix.length > best.prefix.length) {
        best = { prefix, permission };
      }
    }
  }
  return best?.permission ?? null;
}
