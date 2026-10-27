import { apiRequest } from "../lib/apiClient";

export type FactoryCatalogStatus = "ACTIVE" | "INACTIVE" | "EXPIRED";

export type ProductGroup = {
  id: string;
  code: string;
  name: string;
  balanceType: string;
  overdraftLimit?: number | null;
  productChangeScope: string;
  crossCurrencyChange: boolean;
  enableNotificationAlert: boolean;
  status: FactoryCatalogStatus;
  createdAt?: string;
};

export type ProductPropertyDefinition = {
  id: string;
  code: string;
  name: string;
  valueType: string;
  enumOptions: string[];
  description?: string | null;
  status: FactoryCatalogStatus;
  createdAt?: string;
};

export type FactoryTxnType = {
  id: string;
  code: string;
  description: string;
  status: FactoryCatalogStatus;
  createdAt?: string;
};

export type FactoryRestrictionCode = {
  id: string;
  code: string;
  name: string;
  postingEffect: string;
  allowTxnScope: string;
  closureRule: string;
  status: FactoryCatalogStatus;
  createdAt?: string;
};

export type ProductFactoryConfig = {
  productCode: string;
  allowedTxnTypes: FactoryTxnType[];
  restrictionDefaults: { restrictionCode: string; restrictionName: string; autoApplyOnOpen: boolean }[];
  propertyValues: {
    propertyCode: string;
    propertyName: string;
    valueType: string;
    value: string;
  }[];
};

const BASE = "/api/v1/products/factory";

function statusQuery(status?: FactoryCatalogStatus) {
  if (!status) return "";
  return `?${new URLSearchParams({ status })}`;
}

export function listProductGroups(status?: FactoryCatalogStatus) {
  return apiRequest<ProductGroup[]>(`${BASE}/groups${statusQuery(status)}`);
}

export function getProductGroup(code: string) {
  return apiRequest<ProductGroup>(`${BASE}/groups/${encodeURIComponent(code)}`);
}

export function createProductGroup(body: {
  code: string;
  name: string;
  balanceType: string;
  overdraftLimit?: number | null;
  productChangeScope: string;
  crossCurrencyChange?: boolean;
  enableNotificationAlert?: boolean;
}) {
  return apiRequest<ProductGroup>(`${BASE}/groups`, { method: "POST", body });
}

export function updateProductGroup(
  code: string,
  body: {
    name: string;
    balanceType: string;
    overdraftLimit?: number | null;
    productChangeScope: string;
    crossCurrencyChange?: boolean;
    enableNotificationAlert?: boolean;
    status?: FactoryCatalogStatus;
  },
) {
  return apiRequest<ProductGroup>(`${BASE}/groups/${encodeURIComponent(code)}`, {
    method: "PUT",
    body,
  });
}

export function listProductProperties(status?: FactoryCatalogStatus) {
  return apiRequest<ProductPropertyDefinition[]>(`${BASE}/properties${statusQuery(status)}`);
}

export function getProductProperty(code: string) {
  return apiRequest<ProductPropertyDefinition>(`${BASE}/properties/${encodeURIComponent(code)}`);
}

export function createProductProperty(body: {
  code: string;
  name: string;
  valueType: string;
  enumOptions?: string;
  description?: string;
}) {
  return apiRequest<ProductPropertyDefinition>(`${BASE}/properties`, { method: "POST", body });
}

export function updateProductProperty(
  code: string,
  body: {
    name: string;
    valueType: string;
    enumOptions?: string;
    description?: string;
    status?: FactoryCatalogStatus;
  },
) {
  return apiRequest<ProductPropertyDefinition>(`${BASE}/properties/${encodeURIComponent(code)}`, {
    method: "PUT",
    body,
  });
}

export function listFactoryTxnTypes(status?: FactoryCatalogStatus) {
  return apiRequest<FactoryTxnType[]>(`${BASE}/txn-types${statusQuery(status)}`);
}

export function getFactoryTxnType(code: string) {
  return apiRequest<FactoryTxnType>(`${BASE}/txn-types/${encodeURIComponent(code)}`);
}

export function createFactoryTxnType(body: { code: string; description: string }) {
  return apiRequest<FactoryTxnType>(`${BASE}/txn-types`, { method: "POST", body });
}

export function updateFactoryTxnType(
  code: string,
  body: { description: string; status?: FactoryCatalogStatus },
) {
  return apiRequest<FactoryTxnType>(`${BASE}/txn-types/${encodeURIComponent(code)}`, {
    method: "PUT",
    body,
  });
}

export function listFactoryRestrictionCodes(status?: FactoryCatalogStatus) {
  return apiRequest<FactoryRestrictionCode[]>(`${BASE}/restriction-codes${statusQuery(status)}`);
}

export function getFactoryRestrictionCode(code: string) {
  return apiRequest<FactoryRestrictionCode>(`${BASE}/restriction-codes/${encodeURIComponent(code)}`);
}

export function createFactoryRestrictionCode(body: {
  code: string;
  name: string;
  postingEffect: string;
  allowTxnScope: string;
  closureRule: string;
}) {
  return apiRequest<FactoryRestrictionCode>(`${BASE}/restriction-codes`, { method: "POST", body });
}

export function updateFactoryRestrictionCode(
  code: string,
  body: {
    name: string;
    postingEffect: string;
    allowTxnScope: string;
    closureRule: string;
    status?: FactoryCatalogStatus;
  },
) {
  return apiRequest<FactoryRestrictionCode>(`${BASE}/restriction-codes/${encodeURIComponent(code)}`, {
    method: "PUT",
    body,
  });
}

export function getProductFactoryConfig(productCode: string) {
  return apiRequest<ProductFactoryConfig>(
    `${BASE}/products/${encodeURIComponent(productCode)}/config`,
  );
}

export function listProductAllowedTxnTypes(productCode: string) {
  return apiRequest<FactoryTxnType[]>(
    `${BASE}/products/${encodeURIComponent(productCode)}/allowed-txn-types`,
  );
}

export function replaceProductAllowedTxnTypes(productCode: string, txnTypeCodes: string[]) {
  return apiRequest<FactoryTxnType[]>(
    `${BASE}/products/${encodeURIComponent(productCode)}/allowed-txn-types`,
    { method: "PUT", body: { txnTypeCodes } },
  );
}

export function listProductRestrictionDefaults(productCode: string) {
  return apiRequest<{ restrictionCode: string; restrictionName: string; autoApplyOnOpen: boolean }[]>(
    `${BASE}/products/${encodeURIComponent(productCode)}/restriction-defaults`,
  );
}

export function replaceProductRestrictionDefaults(
  productCode: string,
  items: { restrictionCode: string; autoApplyOnOpen: boolean }[],
) {
  return apiRequest(
    `${BASE}/products/${encodeURIComponent(productCode)}/restriction-defaults`,
    { method: "PUT", body: { items } },
  );
}

export function listProductPropertyValues(productCode: string) {
  return apiRequest<ProductFactoryConfig["propertyValues"]>(
    `${BASE}/products/${encodeURIComponent(productCode)}/property-values`,
  );
}

export function replaceProductPropertyValues(
  productCode: string,
  items: { propertyCode: string; value: string }[],
) {
  return apiRequest(`${BASE}/products/${encodeURIComponent(productCode)}/property-values`, {
    method: "PUT",
    body: { items },
  });
}
