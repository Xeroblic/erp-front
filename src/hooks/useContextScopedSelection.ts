import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type OrganizationalContext =
	| { type: 'company'; id: number }
	| { type: 'subsidiary'; id: number }
	| { type: 'branch'; id: number };

interface StoredSelection<TId extends string | number> {
	selectedId: TId | null;
	context: OrganizationalContext | null;
}

interface ContextSelectionInvalidation<TId extends string | number> {
	selectedId: TId;
	selectedContext: OrganizationalContext;
	currentContext: OrganizationalContext | null;
}

interface UseContextScopedSelectionOptions<TId extends string | number> {
	/** A route-driven ID binds once; changing only context never rebinds it. */
	sourceId?: TId | null;
	onInvalidate?: (invalidation: ContextSelectionInvalidation<TId>) => void;
}

const emptySelection = <TId extends string | number>(): StoredSelection<TId> => ({
	selectedId: null,
	context: null,
});

export const isSameOrganizationalContext = (
	left: OrganizationalContext | null,
	right: OrganizationalContext | null,
): boolean => left?.type === right?.type && left?.id === right?.id;

export const useContextScopedSelection = <TId extends string | number>(
	currentContext: OrganizationalContext | null,
	options: UseContextScopedSelectionOptions<TId> = {},
) => {
	const { sourceId, onInvalidate } = options;
	const [storedSelection, setStoredSelection] = useState<StoredSelection<TId>>(() =>
		emptySelection<TId>(),
	);
	const currentContextRef = useRef(currentContext);
	const onInvalidateRef = useRef(onInvalidate);
	const lastBoundSourceIdRef = useRef<TId | null | undefined>(undefined);
	const invalidatedSelectionRef = useRef<StoredSelection<TId> | null>(null);

	currentContextRef.current = currentContext;

	useEffect(() => {
		onInvalidateRef.current = onInvalidate;
	}, [onInvalidate]);

	useEffect(() => {
		if (sourceId === undefined) return;

		if (sourceId === null) {
			lastBoundSourceIdRef.current = null;
			setStoredSelection((previous) =>
				previous.selectedId === null ? previous : emptySelection<TId>(),
			);
			return;
		}

		if (sourceId === lastBoundSourceIdRef.current || currentContext === null) return;

		lastBoundSourceIdRef.current = sourceId;
		setStoredSelection({ selectedId: sourceId, context: currentContext });
	}, [currentContext, sourceId]);

	const isValid =
		storedSelection.selectedId !== null &&
		storedSelection.context !== null &&
		currentContext !== null &&
		isSameOrganizationalContext(storedSelection.context, currentContext);

	useEffect(() => {
		if (storedSelection.selectedId === null || storedSelection.context === null || isValid) {
			invalidatedSelectionRef.current = null;
			return;
		}
		if (invalidatedSelectionRef.current === storedSelection) return;

		invalidatedSelectionRef.current = storedSelection;
		onInvalidateRef.current?.({
			selectedId: storedSelection.selectedId,
			selectedContext: storedSelection.context,
			currentContext,
		});
		setStoredSelection(emptySelection<TId>());
	}, [currentContext, isValid, storedSelection]);

	const select = useCallback((selectedId: TId) => {
		const context = currentContextRef.current;
		setStoredSelection(context === null ? emptySelection<TId>() : { selectedId, context });
	}, []);

	const clear = useCallback(() => {
		setStoredSelection(emptySelection<TId>());
	}, []);

	return useMemo(
		() => ({
			selectedId: isValid ? storedSelection.selectedId : null,
			context: isValid ? storedSelection.context : null,
			isOpen: isValid,
			select,
			clear,
		}),
		[clear, isValid, select, storedSelection.context, storedSelection.selectedId],
	);
};

export default useContextScopedSelection;
