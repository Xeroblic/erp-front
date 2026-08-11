import { useMemo } from 'react';
import {
	isSameOrganizationalContext,
	type OrganizationalContext,
} from '@/hooks/useContextScopedSelection';

interface UseContextScopedResourceOptions<TData, TMeta> {
	currentContext: OrganizationalContext | null;
	ownerContext: OrganizationalContext | null;
	data: TData;
	meta: TMeta;
	loading: boolean;
	error: string | undefined;
	emptyData: TData;
	emptyMeta: TMeta;
}

/**
 * Evita que una pantalla pinte datos remotos pertenecientes a otro contexto
 * organizacional durante el render que antecede a los efectos de invalidaciÃ³n.
 */
const useContextScopedResource = <TData, TMeta>({
	currentContext,
	ownerContext,
	data,
	meta,
	loading,
	error,
	emptyData,
	emptyMeta,
}: UseContextScopedResourceOptions<TData, TMeta>) => {
	const isCurrent = isSameOrganizationalContext(currentContext, ownerContext);
	const waitingForCurrentContext = currentContext !== null && !isCurrent;

	return useMemo(
		() => ({
			data: isCurrent ? data : emptyData,
			meta: isCurrent ? meta : emptyMeta,
			loading: loading || waitingForCurrentContext,
			error: isCurrent ? error : undefined,
			isCurrent,
		}),
		[data, emptyData, emptyMeta, error, isCurrent, loading, meta, waitingForCurrentContext],
	);
};

export default useContextScopedResource;
