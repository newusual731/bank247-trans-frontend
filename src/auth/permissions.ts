/**
 * Route → catalog permission for the transaction app.
 * Longest matching prefix wins. Paths with no entry only need login.
 * SUPER_ADMIN bypasses these checks in AuthContext.hasPermission.
 *
 * Keep this map focused on module roots so a missing write verb does not
 * hide an entire area. Write APIs still enforce their own scopes server-side.
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
  ["/settings/product-factory", "product.read"],
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
