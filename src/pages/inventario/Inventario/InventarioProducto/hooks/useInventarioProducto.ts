import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchInventoryDetail,
	inventoryDetailQueryKey,
	selectInventoryUpdatingThreshold,
	updateInventoryThresholdThunk,
} from '@/store/slices/procurement/inventoryOverviewSlice';
import { UNLOCATED_WAREHOUSE_LABEL } from '@/components/procurement';
import { UmbralSchema, type IUmbralFormValues } from '@/pages/inventario/Inventario/types';
import {
	locationStockParams,
	locationToken,
	type TLocationToken,
} from '@/utils/inventoryLocation.util';

/** Alcance de las procedencias: una ubicación conocida o la sucursal completa. */
export type TOrigenAlcance = TLocationToken | 'branch';

/**
 * Ficha de un producto en la sucursal activa (A4): totales, estado, desglose
 * por bodega, procedencias de la ubicación elegida y edición del umbral
 * crítico (§13).
 *
 * Igual que la vista General, se monta en una sesión con `key` por contexto y
 * compara el `ownerContext` de la respuesta con el suyo (ZF-12).
 */
const useInventarioProducto = (branchId: number, owner: string, productId: number) => {
	const session = useId();
	const dispatch = useAppDispatch();
	const detailState = useAppSelector((state) => state.inventoryOverview.detail);
	const updatingThreshold = useAppSelector(selectInventoryUpdatingThreshold);
	const [retry, setRetry] = useState(0);
	const [umbralOpen, setUmbralOpen] = useState(false);
	/** Ubicación de las procedencias. `null` = aún no elegida: se usa la primera con saldo. */
	const [ubicacionElegida, setUbicacionElegida] = useState<TOrigenAlcance | null>(null);

	const request = useMemo(
		() => ({ branchId, productId, ownerContext: `${owner}:${session}` }),
		[branchId, productId, owner, session],
	);
	useEffect(() => {
		const pending = dispatch(fetchInventoryDetail(request));
		return () => {
			pending.abort();
		};
	}, [dispatch, request, retry]);

	const isCurrent = detailState.ownerContext === inventoryDetailQueryKey(request);
	const detail = isCurrent ? (detailState.response?.data ?? null) : null;
	const loading = !isCurrent || detailState.loading;
	const error = isCurrent ? detailState.error : null;
	const refresh = useCallback(() => setRetry((value) => value + 1), []);

	const ubicaciones = useMemo(() => {
		const conocidas = (detail?.warehouses ?? []).map(
			(location): { value: TOrigenAlcance; label: string; quantity: number } => ({
				value: locationToken(location.warehouse?.id ?? null),
				label: location.warehouse?.name ?? UNLOCATED_WAREHOUSE_LABEL,
				quantity: location.physical_quantity,
			}),
		);
		// Sin acceso al catálogo de bodegas, las unidades de bodegas que no se
		// pueden nombrar sólo se alcanzan pidiendo la sucursal completa (el
		// backend la autoriza): va primero, porque es la única que las muestra todas.
		if (detail && !detail.warehouses_complete && detail.physical_quantity > 0)
			return [
				{
					value: 'branch' as const,
					label: 'Toda la sucursal',
					quantity: detail.physical_quantity,
				},
				...conocidas,
			];
		return conocidas;
	}, [detail]);
	// Si la ubicación elegida se vació (se trasladó todo), vuelve a la primera.
	const ubicacion =
		ubicaciones.find((option) => option.value === ubicacionElegida)?.value ??
		ubicaciones[0]?.value ??
		null;
	const locationParams = useMemo(() => {
		if (!ubicacion) return null;
		return ubicacion === 'branch' ? {} : locationStockParams(ubicacion);
	}, [ubicacion]);

	const threshold = detail?.product.critical_stock_threshold ?? null;
	const formik = useFormik<IUmbralFormValues>({
		initialValues: { threshold: threshold === null ? '' : String(threshold) },
		enableReinitialize: true,
		validationSchema: UmbralSchema,
		onSubmit: async (values) => {
			const value = values.threshold.trim();
			try {
				await dispatch(
					updateInventoryThresholdThunk({
						productId,
						threshold: value === '' ? null : Number(value),
					}),
				).unwrap();
				toast.success(value === '' ? 'Umbral desactivado.' : 'Umbral guardado.');
				setUmbralOpen(false);
				refresh();
			} catch (rejection: unknown) {
				toast.error(
					typeof rejection === 'string' ? rejection : 'No pudimos guardar el umbral.',
				);
			}
		},
	});

	const { resetForm } = formik;
	const openUmbral = useCallback(() => setUmbralOpen(true), []);
	const closeUmbral = useCallback(() => {
		setUmbralOpen(false);
		resetForm();
	}, [resetForm]);

	return {
		detail,
		loading,
		error,
		refresh,
		ubicaciones,
		ubicacion,
		setUbicacion: setUbicacionElegida,
		locationParams,
		formik,
		umbralOpen,
		openUmbral,
		closeUmbral,
		updatingThreshold,
	};
};

export default useInventarioProducto;
