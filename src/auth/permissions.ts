/**
 * Route → catalog permission for the transaction app.
 * Longest matching prefix wins. Paths with no entry only need login.
 * SUPER_ADMIN bypasses these checks in AuthContext.hasPermission.
 */
const ROUTE_PERMISSIONS: ReadonlyArray<readonly [prefix: string, permission: string]> = [
  // Write / create (more specific than module roots)
  ["/gl/creation", "gl.write"],
  ["/gl/mapping", "gl.write"],
  ["/gl/chart", "gl.read"],
  ["/settings/roles", "iam.role.read"],
  ["/settings/users", "iam.user.read"],
  ["/settings/products", "product.read"],
  ["/settings/modules", "iam.settings.read"],
  ["/settings/catalogs", "iam.settings.read"],
  ["/settings", "iam.user.read"],
  ["/teller/admin", "teller.admin"],
  ["/teller/tills", "teller.admin"],
  ["/teller/cash", "teller.cash"],
  ["/teller/deposits", "teller.cash"],
  ["/teller/withdrawals", "teller.cash"],
  ["/teller/transfers", "teller.cash"],
  ["/teller/drafts", "teller.cash"],
  ["/teller/ft", "transaction.write"],
  ["/teller/posting", "transaction.write"],
  ["/teller/reverse", "teller.cash"],
  ["/teller/reprint", "teller.cash"],
  ["/teller/currency-exchange", "teller.cash"],
  ["/teller/enquiries", "teller.read"],
  ["/transactions/statement-entry", "ledger.post"],
  ["/transactions/special-entry", "ledger.post"],
  ["/transactions/pnl-entry", "ledger.post"],
  ["/transactions/approvals", "workflow.approve"],
  ["/contracts/loans", "loan.read"],
  ["/contracts/bonds", "treasury.read"],
  ["/contracts/treasury-bills", "investment.read"],
  ["/contracts/forex", "trade.read"],
  ["/contracts/placement", "treasury.read"],
  ["/contracts/lc", "trade.read"],
  ["/contracts/products", "product.read"],
  ["/contracts/balances", "loan.read"],
  ["/contracts", "loan.read"],
  ["/reports", "report.read"],
  ["/reporting", "report.read"],

  // Module roots (read)
  ["/accounts", "account.read"],
  ["/gl", "gl.read"],
  ["/teller", "teller.read"],
  ["/transactions", "transaction.read"],
  ["/notifications", "notification.read"],
  ["/products", "product.read"],
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
