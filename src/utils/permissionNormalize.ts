const KNOWN_ACTIONS = new Set([
  'view', 'create', 'edit', 'delete', 'manage', 'access', 'export', 'import', 'assign', 'update', 'list'
]);

export function normalizePermission(input: string): string {
  if (!input) return input;
  const s = String(input).trim().toLowerCase();

  if (s.includes('-') && !s.includes('.')) return s;

  if (s.includes('.')) {
    const parts = s.split('.').filter(Boolean);
    if (parts.length === 2) {
      const [a, b] = parts;
      if (KNOWN_ACTIONS.has(b)) return `${b}-${a}`;
      if (KNOWN_ACTIONS.has(a)) return `${a}-${b}`;
      return `${a}-${b}`;
    }
    return parts.join('-');
  }

  return s.replace(/[:_\s]+/g, '-');
}

export function normalizePermissions(arr: string[] = []): string[] {
  return arr.map(normalizePermission);
}

export default normalizePermission;

