// src/hooks/useAuthority.ts
export default function useAuthority(
  userPermissions: string[],
  required: string[],
  any = false
): boolean {
  const matches = required.map(req => {
    if (userPermissions.includes(req)) return true;
    const [mod] = req.split(':');
    return userPermissions.includes(`${mod}:*`);
  });
  return any ? matches.some(Boolean) : matches.every(Boolean);
}