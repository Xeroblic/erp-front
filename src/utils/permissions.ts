export const hasPermission = (pattern: string, granted: string[]): boolean => {
  // 1) super-admin bypass
  if (granted.includes('super-admin')) return true;

  // 2) comodín  "prefijo:*"  (p.e. company:*)
  if (pattern.endsWith(':*')) {
    const prefix = pattern.slice(0, -2);          // 'company:*' → 'company'
    return granted.some(p => p.endsWith(`-${prefix}`));
  }

  // 3) coincidencia exacta
  return granted.includes(pattern);
};
