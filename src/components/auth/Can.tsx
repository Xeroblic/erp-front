import React from 'react';
import useAuthorization from '@/hooks/useAuthorization';

type Props = {
	any?: string[];
	all?: string[];
	not?: string[];
	fallback?: React.ReactNode;
	children: React.ReactNode;
};

const Can: React.FC<Props> = ({ any, all, not, fallback = null, children }) => {
	const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuthorization();

	const negativeBlocked = Array.isArray(not) && not.some((p) => hasPermission(p));
	if (negativeBlocked) return <>{fallback}</>;

	if (any && any.length > 0) return <>{hasAnyPermission(any) ? children : fallback}</>;
	if (all && all.length > 0) return <>{hasAllPermissions(all) ? children : fallback}</>;

	// Si no se pasó ninguna condición, renderizar children por defecto
	return <>{children}</>;
};

export default Can;
