import { useCallback, useEffect, useMemo, useState } from 'react';
import { searchInventoryAdjustableProducts } from '@/services/procurement/inventoryStock.service';
import { locationStockParams } from '@/utils/inventoryLocation.util';
import { getProcurementErrorMessage } from '@/utils/procurementErrors.util';
import type { IProcurementProduct } from '@/interface/procurement.interface';

export const ADJUSTABLE_SEARCH_DEBOUNCE_MS = 300;

interface ISearchResult {
	key: string;
	products: IProcurementProduct[];
	error: string | null;
}

/**
 * Buscador del selector de producto del ajuste, en el servidor: la filial
 * puede tener miles de productos, así que el catálogo no se carga entero.
 * Ofrece también los que están en cero en la ubicación (`include_empty`),
 * porque un conteo que encuentra unidades de un producto agotado tiene que
 * poder nombrarlo.
 *
 * Un único término para todas las líneas: sólo un menú está abierto a la vez,
 * y cada línea resuelve su etiqueta con `knownProducts`, no con la búsqueda
 * vigente. Sin texto no se consulta: el selector pide escribir antes de listar.
 */
export default function useAdjustableProductSearch(
	branchId: number,
	subsidiaryId: number | null,
	location: string,
) {
	const [search, setSearch] = useState('');
	const [query, setQuery] = useState('');
	const [result, setResult] = useState<ISearchResult | null>(null);
	const [known, setKnown] = useState<ReadonlyMap<number, IProcurementProduct>>(() => new Map());

	useEffect(() => {
		const timer = setTimeout(() => setQuery(search.trim()), ADJUSTABLE_SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [search]);

	const remember = useCallback((products: readonly IProcurementProduct[]) => {
		if (products.length === 0) return;
		setKnown((previous) => {
			if (products.every((product) => previous.get(product.id) === product)) return previous;
			const next = new Map(previous);
			products.forEach((product) => next.set(product.id, product));
			return next;
		});
	}, []);

	// Volver a escribir el mismo término tras cerrar el menú repite la consulta:
	// `clearSearch` pasa por la cadena vacía.
	const key = `${location}#${query}`;
	const enabled = Boolean(location) && query !== '';

	useEffect(() => {
		if (!enabled) return undefined;
		const controller = new AbortController();
		searchInventoryAdjustableProducts(
			branchId,
			subsidiaryId,
			locationStockParams(location),
			query,
			controller.signal,
		).then(
			(page) => {
				if (controller.signal.aborted) return;
				const products = page.data.map((row) => row.product);
				remember(products);
				setResult({ key, products, error: null });
			},
			(error: unknown) => {
				if (controller.signal.aborted) return;
				setResult({
					key,
					products: [],
					error: getProcurementErrorMessage(error, 'No se pudo buscar productos.'),
				});
			},
		);
		return () => controller.abort();
	}, [branchId, subsidiaryId, location, query, key, enabled, remember]);

	const current = result?.key === key ? result : null;
	const options = useMemo(() => (enabled && current ? current.products : []), [enabled, current]);

	/** Sin esperar el debounce: el próximo menú no debe abrir con el término anterior. */
	const clearSearch = useCallback(() => {
		setSearch('');
		setQuery('');
	}, []);

	const knownProducts = useMemo(() => [...known.values()], [known]);

	return {
		options,
		/** También mientras corre el debounce: lo que se ve aún no es de este término. */
		loading: search.trim() !== '' && (search.trim() !== query || (enabled && !current)),
		error: current?.error ?? null,
		onSearchChange: setSearch,
		clearSearch,
		knownProducts,
		remember,
	};
}
