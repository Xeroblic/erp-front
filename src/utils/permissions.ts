export const hasPermission = (pattern: string, granted: string[]) => {
  // super-admin bypass
  if (granted.includes('super-admin')) return true;

  // comodín "prefijo:*"
  if (pattern.endsWith(':*')) {
    const prefix = pattern.slice(0, -2);           // "company:*" -> "company"
    return granted.some(p => p.endsWith(`-${prefix}`));
  }

  // coincidencia exacta
  return granted.includes(pattern);
};