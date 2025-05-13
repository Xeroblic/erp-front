import { useMemo } from 'react'
import isEmpty from 'lodash/isEmpty'

export default function useAuthority(
  userAuthority: string[],
  needed: string[],
  allNeeded = false
): boolean {
  const check = (req: string) => {
    if (userAuthority.includes(req)) return true;
    const [rsc, act] = req.split(':');
    // si el usuario tiene 'rsc:*' ese cubre cualquier 'rsc:xxx'
    if (userAuthority.includes(`${rsc}:*`)) return true;
    return false;
  };

  if (allNeeded) {
    return needed.every(check);
  } else {
    return needed.some(check);
  }
}
