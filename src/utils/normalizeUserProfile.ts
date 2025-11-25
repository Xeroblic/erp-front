// src/utils/auth/normalizeUserProfile.ts
import { IUserMe } from '@/interface/user.interface';

type PerfilPayload = any; // tipa mejor si quieres

export function normalizeUserProfile(raw: PerfilPayload): {
  user: IUserMe;
  permisos: string[];
  roles: string[];
} {
  const data = raw?.data ?? raw?.user ?? ({} as any);

  const permisosSet = new Set<string>();
  const rolesSet = new Set<string>();

  const pushAll = (arr?: string[]) => arr?.forEach((p) => p && permisosSet.add(p));
  const pushRoles = (arr?: string[]) => arr?.forEach((r) => r && rolesSet.add(r));

  pushAll(data.all_permissions);
  pushAll(data.direct_permissions);
  pushAll(data.role_permissions);
  pushAll(data.global_roles);
  pushAll(raw?.permisos);
  pushRoles(raw?.roles);
  pushRoles(data.global_roles);

  const user: IUserMe = {
    ...(data as IUserMe),
    branch: data.branch ?? raw?.branch,
    access: (data as any).access ?? raw?.access,
    visible: (data as any).visible ?? raw?.visible,
  };

  return {
    user,
    permisos: Array.from(permisosSet),
    roles: Array.from(rolesSet),
  };
}
