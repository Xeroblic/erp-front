// src/hooks/useAuthority.ts
export default function useAuthority(
  userAuthority: string[],
  needed: string[],
  allNeeded = false
): boolean {
  // Si es super_admin, todo permitido
  if (userAuthority.includes('super_admin')) return true;

  const check = (req: string) => {
    if (userAuthority.includes(req)) return true;
    const [rsc] = req.split(':');
    // wildcard
    if (userAuthority.includes(`${rsc}:*`)) return true;
    return false;
  };

  return allNeeded
    ? needed.every(check)
    : needed.some(check);
}
