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
 * organizacional durante el render que antecede a los efectos de invalidación.
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

	return {
		data: isCurrent ? data : emptyData,
		meta: isCurrent ? meta : emptyMeta,
		loading: loading || waitingForCurrentContext,
		error: isCurrent ? error : undefined,
		isCurrent,
	};
};

export default useContextScopedResource;
