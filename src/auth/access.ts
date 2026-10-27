/** Normalize IAM catalog / JWT permission and role codes for comparison. */
export function normalizeAccessCode(code: string): string {
  return code
    .trim()
    .replace(/^SCOPE_/i, "")
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function isSuperAdminRole(roles: string[]): boolean {
  return roles.some((role) => normalizeAccessCode(role) === "SUPER_ADMIN");
}

export function hasAccessCode(granted: string[], required: string): boolean {
  const need = normalizeAccessCode(required);
  if (!need) return true;
  return granted.some((code) => {
    const have = normalizeAccessCode(code);
    return have === need || have === `SCOPE_${need}`;
  });
}

/** Parse JWT / API claim values that may be arrays, CSV, space-separated, or JSON arrays. */
export function asStringList(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => asStringList(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        return asStringList(JSON.parse(trimmed));
      } catch {
        /* fall through */
      }
    }
    return trimmed.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
  }
  if (typeof value === "object") {
    // Jackson sometimes serializes a single-element set oddly; ignore non-list objects.
    return [];
  }
  return [String(value)].filter(Boolean);
}

export function uniqueCodes(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const key = normalizeAccessCode(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(raw.trim().replace(/^SCOPE_/i, ""));
  }
  return out;
}
