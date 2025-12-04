import React from 'react';
import useCan from '@/hooks/useCan';

type Props = {
	any?: string[];
	all?: string[];
	not?: string[];
	fallback?: React.ReactNode;
	children: React.ReactNode;
};

const Can: React.FC<Props> = ({ any, all, not, fallback = null, children }) => {
	const { any: canAny, all: canAll, has } = useCan();

	const negativeBlocked = Array.isArray(not) && not.some((p) => has(p));
	if (negativeBlocked) return <>{fallback}</>;

	if (any && any.length > 0) return <>{canAny(any) ? children : fallback}</>;
	if (all && all.length > 0) return <>{canAll(all) ? children : fallback}</>;

	// Si no se pasó ninguna condición, renderizar children por defecto
	return <>{children}</>;
};

export default Can;
