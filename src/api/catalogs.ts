import { listCasaProducts, listInvestmentProducts, listLoanProducts } from "./accounts";
import { listIamPermissions } from "./domain";
import { listGlAccounts } from "./ledger";

export type LiveCatalogBundle = {
  glCodes: string[];
  glNames: string[];
  permissions: string[];
  casaProducts: string[];
  loanProducts: string[];
  investmentProducts: string[];
};

function toList(res: unknown): Record<string, unknown>[] {
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  if (res && typeof res === "object" && "content" in res && Array.isArray((res as { content: unknown }).content)) {
    return (res as { content: Record<string, unknown>[] }).content;
  }
  return [];
}

export async function fetchLiveCatalogs(): Promise<LiveCatalogBundle> {
  const [gl, perms, casa, loans, inv] = await Promise.allSettled([
    listGlAccounts({ size: 100 }),
    listIamPermissions(),
    listCasaProducts(),
    listLoanProducts(),
    listInvestmentProducts(),
  ]);

  const glRows = gl.status === "fulfilled" ? toList(gl.value) : [];
  const permRows = perms.status === "fulfilled" ? toList(perms.value) : [];
  const casaRows = casa.status === "fulfilled" ? toList(casa.value) : [];
  const loanRows = loans.status === "fulfilled" ? toList(loans.value) : [];
  const invRows = inv.status === "fulfilled" ? toList(inv.value) : [];

  return {
    glCodes: glRows.map((r) => String(r.code ?? r.glCode ?? "")).filter(Boolean),
    glNames: glRows.map((r) => String(r.name ?? r.glName ?? r.code ?? "")).filter(Boolean),
    permissions: permRows.map((r) => String(r.code ?? r.permissionCode ?? r.name ?? "")).filter(Boolean),
    casaProducts: casaRows.map((r) => String(r.name ?? r.code ?? r.productName ?? "")).filter(Boolean),
    loanProducts: loanRows.map((r) => String(r.name ?? r.code ?? r.productName ?? "")).filter(Boolean),
    investmentProducts: invRows.map((r) => String(r.name ?? r.code ?? r.productName ?? "")).filter(Boolean),
  };
}
