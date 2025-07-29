import { useAppSelector } from "@/store";
import { selectUserAuthority } from "@/store/slices/auth/authSlice";
import { hasPermission } from "@/utils/acl";

interface AuthorityGuardProps {
  authority?: string[];
  children: React.ReactNode;
}

const AuthorityGuard: React.FC<AuthorityGuardProps> = ({ authority = [], children }) => {
  const userPermissions = useAppSelector(selectUserAuthority);

  const hasAccess = authority.length === 0 ||
    authority.some(perm => hasPermission(perm, userPermissions));

  return hasAccess ? <>{children}</> : null;
};

export default AuthorityGuard;
