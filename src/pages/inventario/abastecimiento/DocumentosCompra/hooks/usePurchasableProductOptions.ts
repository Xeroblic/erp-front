import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	formatPurchasableProductLabel,
	searchPurchasableProducts,
} from '@/services/procurement/purchasableProducts.service';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import type { IPurchasableProduct } from '@/services/procurement/purchasableProducts.service';
import type { IProcurementProduct } from '@/interface/procurement.interface';

/**
 * Opciones del `Select` de producto de las líneas de un documento de compra,
 * con búsqueda en el servidor: el catálogo real puede tener miles de
 * productos, así que no se carga entero.
 *
 * Un único término de búsqueda para todas las líneas: sólo un menú está
 * abierto a la vez, y el `Select` de cada línea resuelve su valor con
 * `getOption`, no con las opciones de la búsqueda vigente — así una línea no
 * pierde la etiqueta de su producto cuando se busca otro en la siguiente.
 * Por eso mismo el término se limpia al elegir o al cerrar el menú
 * (`clearSearch`): si sobreviviera, el menú de la línea siguiente se abriría
 * filtrado por una búsqueda que su caja ya no muestra.
 *
 * Mismo criterio de contexto que `useActiveSupplierOptions`: cada resultado
 * queda asociado a la filial y al término que lo pidieron, y sólo se expone
 * mientras ambos sigan vigentes. Las etiquetas conocidas (de los resultados y
 * de las líneas del documento que se edita) también se guardan por filial.
 *
 * El catálogo exige `view-product`, que no exige crear documentos: un 403 se
 * informa como `forbidden` en vez de mostrarse como «sin resultados».
 */

export type TProductOptionsUnavailableReason = 'forbidden' | 'failed';

export interface IProductOption {
	value: string;
	label: string;
}

interface IProductSearchResult {
	subsidiaryId: number;
	query: string;
	rows: IPurchasableProduct[];
	hasMore: boolean;
	unavailableReason: TProductOptionsUnavailableReason | null;
}

interface IUsePurchasableProductOptionsArgs {
	subsidiaryId: number | null;
	isEnabled: boolean;
	/** Productos de las líneas ya guardadas: su etiqueta existe antes de buscar. */
	initialProducts?: Pick<IProcurementProduct, 'id' | 'sku' | 'name'>[];
}

const FORBIDDEN_STATUS = 403;
export const PRODUCT_SEARCH_DEBOUNCE_MS = 300;

const labelKey = (subsidiaryId: number, productId: number): string =>
	`${subsidiaryId}:${productId}`;

const usePurchasableProductOptions = ({
	subsidiaryId,
	isEnabled,
	initialProducts = [],
}: IUsePurchasableProductOptionsArgs) => {
	const [search, setSearch] = useState('');
	const [query, setQuery] = useState('');
	const [result, setResult] = useState<IProductSearchResult | null>(null);
	const [knownLabels, setKnownLabels] = useState<Map<string, string>>(() => new Map());
	const [reloadToken, setReloadToken] = useState(0);

	useEffect(() => {
		const timer = setTimeout(() => setQuery(search.trim()), PRODUCT_SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [search]);

	const rememberLabels = useCallback(
		(ownerId: number, products: Pick<IPurchasableProduct, 'id' | 'sku' | 'name'>[]) => {
			if (products.length === 0) return;
			setKnownLabels((previous) => {
				const next = new Map(previous);
				products.forEach((product) =>
					next.set(labelKey(ownerId, product.id), formatPurchasableProductLabel(product)),
				);
				return next;
			});
		},
		[],
	);

	// El arreglo es nuevo en cada render: se relee por ref y el efecto sólo
	// corre cuando cambian los productos o la filial.
	const initialProductsRef = useRef(initialProducts);
	initialProductsRef.current = initialProducts;
	const initialProductsKey = initialProducts.map((product) => product.id).join(',');

	useEffect(() => {
		if (subsidiaryId === null) return;
		rememberLabels(subsidiaryId, initialProductsRef.current);
	}, [subsidiaryId, initialProductsKey, rememberLabels]);

	useEffect(() => {
		if (!isEnabled || subsidiaryId === null) return undefined;

		let cancelled = false;
		searchPurchasableProducts(subsidiaryId, query)
			.then((page) => {
				if (cancelled) return;
				rememberLabels(subsidiaryId, page.data);
				setResult({
					subsidiaryId,
					query,
					rows: page.data,
					hasMore: page.has_more,
					unavailableReason: null,
				});
			})
			.catch((error: unknown) => {
				if (cancelled) return;
				const isForbidden = resolveProcurementError(error).status === FORBIDDEN_STATUS;
				setResult({
					subsidiaryId,
					query,
					rows: [],
					hasMore: false,
					unavailableReason: isForbidden ? 'forbidden' : 'failed',
				});
			});

		return () => {
			cancelled = true;
		};
	}, [subsidiaryId, isEnabled, query, reloadToken, rememberLabels]);

	const currentResult =
		subsidiaryId !== null && result?.subsidiaryId === subsidiaryId && result.query === query
			? result
			: null;
	const loading = isEnabled && subsidiaryId !== null && currentResult === null;
	// Un 403 no cambia con otro término: se sigue mostrando mientras se busca.
	const forbidden =
		subsidiaryId !== null &&
		result?.subsidiaryId === subsidiaryId &&
		result.unavailableReason === 'forbidden';
	const unavailableReason: TProductOptionsUnavailableReason | null = forbidden
		? 'forbidden'
		: (currentResult?.unavailableReason ?? null);

	const options = useMemo<IProductOption[]>(
		() =>
			(currentResult?.rows ?? []).map((product) => ({
				value: String(product.id),
				label: formatPurchasableProductLabel(product),
			})),
		[currentResult],
	);

	const getOption = useCallback(
		(productId: number | ''): IProductOption | null => {
			if (productId === '' || subsidiaryId === null) return null;
			const label = knownLabels.get(labelKey(subsidiaryId, productId));
			return label ? { value: String(productId), label } : null;
		},
		[knownLabels, subsidiaryId],
	);

	const reload = useCallback(() => setReloadToken((token) => token + 1), []);

	/** Sin esperar el debounce: el próximo menú no debe abrir con el término anterior. */
	const clearSearch = useCallback(() => {
		setSearch('');
		setQuery('');
	}, []);

	/**
	 * Producto recién creado desde el documento: su etiqueta se conoce antes
	 * de que una búsqueda lo traiga, y la búsqueda vigente se repite para que
	 * aparezca entre las opciones.
	 */
	const addProduct = useCallback(
		(product: Pick<IPurchasableProduct, 'id' | 'sku' | 'name'>) => {
			if (subsidiaryId === null) return;
			rememberLabels(subsidiaryId, [product]);
			reload();
		},
		[subsidiaryId, rememberLabels, reload],
	);

	return {
		options,
		loading,
		hasMore: currentResult?.hasMore ?? false,
		unavailableReason,
		search,
		onSearchChange: setSearch,
		clearSearch,
		getOption,
		reload,
		addProduct,
	};
};

export default usePurchasableProductOptions;
