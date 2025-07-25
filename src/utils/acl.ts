export const hasPermission = (required: string, granted: string[]): boolean => {
  if (!required) return true;

  // 1. super-admin siempre
  if (granted.includes('super-admin')) return true;

  // 2. comodín “prefix:*”
  if (required.endsWith(':*')) {
    const prefix = required.slice(0, -2);           // «company», «branch» …
    return granted.some(p => p.startsWith(prefix));
  }

  // 3. coincidencia exacta
  return granted.includes(required);
};