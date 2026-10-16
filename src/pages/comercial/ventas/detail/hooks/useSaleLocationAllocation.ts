import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { setNestedObjectValues, useFormik, type FormikProps } from 'formik';
import { getSaleFulfillmentOptions } from '@/services/salesService';
import type {
	ICloseSaleRequestItem,
	ISaleFulfillmentOptionItem,
	ISaleFulfillmentOptions,
} from '@/interface/sales.interface';
import { resolveProcurementError } from '@/utils/procurementErrors.util';
import {
	ALLOCATION_STOCK_INSUFFICIENT_CODE,
	SALE_CLOSE_FORBIDDEN_MESSAGE,
	getLocationReselectItemIds,
	isLocationReselectError,
	type ISaleCloseError,
} from '@/utils/saleCloseErrors.util';
import { buildLocationAllocationSchema, type ILocationAllocationValues } from '../types';
import {
	buildLocationAllocationValues,
	describeLocation,
	mergeLocationNames,
	toCloseAllocationItems,
} from '../utils/locationAllocation';

const PREVIEW_FALLBACK_MESSAGE = 'No se pudieron cargar las ubicaciones de salida.';

const LOCATION_SELECTION_CHANGED_NOTE =
	'El stock cambió: este ítem ahora tiene stock en más de una ubicación. Revisa de dónde sale y confirma de nuevo.';

export type TFulfillmentPreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

interface IUseSaleLocationAllocationArgs {
	subsidiaryId: number;
	saleId: number;
	/** Sólo con la filial en la etapa 2 y el cierre abierto. */
	enabled: boolean;
}

export interface ISaleLocationAllocation {
	enabled: boolean;
	status: TFulfillmentPreviewStatus;
	loadError: string | null;
	/** Ítems sin serie de la vista previa; `[]` hasta que carga. */
	options: ISaleFulfillmentOptionItem[];
	formik: FormikProps<ILocationAllocationValues>;
	/** Nombres de bodega vistos en las vistas previas, para el error y el resultado. */
	locationNames: ReadonlyMap<number, string>;
	/** Por `sale_item_id`: por qué hay que volver a elegir tras un rechazo del cierre. */
	reselectNotes: Record<number, string[]>;
	hasBlocked: boolean;
	/** La vista previa cargó y ningún ítem está bloqueado. Sin etapa 2, siempre `true`. */
	canConfirm: boolean;
	reload: () => Promise<void>;
	/** Valida la elección y arma las líneas `allocations`; `null` si algo falta. */
	buildAllocationItems: () => Promise<ICloseSaleRequestItem[] | null>;
	/**
	 * Ante `LOCATION_SELECTION_REQUIRED` o `ALLOCATION_STOCK_INSUFFICIENT` recarga la vista
	 * previa y marca los ítems a elegir de nuevo. Devuelve si el error era de los suyos.
	 */
	handleCloseError: (error: ISaleCloseError) => Promise<boolean>;
	clearReselectNotes: () => void;
}

const toPreviewErrorMessage = (error: unknown): string => {
	const resolved = resolveProcurementError(error, PREVIEW_FALLBACK_MESSAGE);
	return resolved.status === 403 ? SALE_CLOSE_FORBIDDEN_MESSAGE : resolved.message;
};

/**
 * Elección de ubicación del cierre de venta (etapa 2). Pide la vista previa al abrir,
 * precarga las sugerencias de los ítems `manual` y arma `allocations`. No reintenta el
 * cierre: ante un rechazo por stock de ubicación, recarga y pide elegir de nuevo.
 */
export const useSaleLocationAllocation = ({
	subsidiaryId,
	saleId,
	enabled,
}: IUseSaleLocationAllocationArgs): ISaleLocationAllocation => {
	const [preview, setPreview] = useState<ISaleFulfillmentOptions | null>(null);
	const [status, setStatus] = useState<TFulfillmentPreviewStatus>('idle');
	const [loadError, setLoadError] = useState<string | null>(null);
	const [locationNames, setLocationNames] = useState<ReadonlyMap<number, string>>(
		() => new Map(),
	);
	const [reselectNotes, setReselectNotes] = useState<Record<number, string[]>>({});
	// Sólo cuenta la última lectura: una recarga pisa a la que todavía no respondió.
	const requestIdRef = useRef(0);

	const options = useMemo(() => preview?.items ?? [], [preview]);
	const validationSchema = useMemo(() => buildLocationAllocationSchema(options), [options]);

	const formik = useFormik<ILocationAllocationValues>({
		initialValues: { items: {} },
		validationSchema,
		onSubmit: () => undefined,
	});
	const { setValues, setTouched, validateForm } = formik;
	const valuesRef = useRef(formik.values);
	valuesRef.current = formik.values;

	const load = useCallback(
		async (resetItemIds: readonly number[] = []): Promise<void> => {
			requestIdRef.current += 1;
			const requestId = requestIdRef.current;
			setStatus('loading');
			setLoadError(null);
			try {
				const next = await getSaleFulfillmentOptions(subsidiaryId, saleId);
				if (requestId !== requestIdRef.current) return;
				setPreview(next);
				setLocationNames((known) => mergeLocationNames(known, next.items));
				// Una recarga conserva lo que siga valiendo; en la primera los valores están vacíos.
				await setValues(
					buildLocationAllocationValues(next.items, valuesRef.current, resetItemIds),
					false,
				);
				// Las sugerencias nuevas no arrastran los errores de la elección anterior.
				await setTouched({}, false);
				setStatus('ready');
			} catch (error: unknown) {
				if (requestId !== requestIdRef.current) return;
				setLoadError(toPreviewErrorMessage(error));
				setStatus('error');
			}
		},
		[subsidiaryId, saleId, setValues, setTouched],
	);

	useEffect(() => {
		if (!enabled) return;
		void load();
	}, [enabled, load]);

	const reload = useCallback(() => load(), [load]);

	const hasBlocked = options.some((option) => option.allocation_mode === 'blocked');

	const buildAllocationItems = useCallback(async (): Promise<ICloseSaleRequestItem[] | null> => {
		if (!enabled) return [];
		if (status !== 'ready' || hasBlocked) return null;
		const values = valuesRef.current;
		await setTouched(setNestedObjectValues(values, true), false);
		const errors = await validateForm(values);
		if (Object.keys(errors).length > 0) return null;
		return toCloseAllocationItems(options, values);
	}, [enabled, status, hasBlocked, options, setTouched, validateForm]);

	const handleCloseError = useCallback(
		async (error: ISaleCloseError): Promise<boolean> => {
			if (!enabled || !isLocationReselectError(error)) return false;
			const itemIds = getLocationReselectItemIds(error);
			const notes: Record<number, string[]> = {};
			if (error.code === ALLOCATION_STOCK_INSUFFICIENT_CODE) {
				error.allocationShortages.forEach((entry) => {
					const where = describeLocation(entry.warehouse_id, locationNames);
					(notes[entry.sale_item_id] ??= []).push(
						`«${where}» ya no alcanza: la venta pide ${entry.requested} y quedan ${entry.available}.`,
					);
				});
			} else {
				itemIds.forEach((id) => {
					notes[id] = [LOCATION_SELECTION_CHANGED_NOTE];
				});
			}
			setReselectNotes(notes);
			await load(itemIds);
			return true;
		},
		[enabled, load, locationNames],
	);

	const clearReselectNotes = useCallback(() => setReselectNotes({}), []);

	return {
		enabled,
		status,
		loadError,
		options,
		formik,
		locationNames,
		reselectNotes,
		hasBlocked,
		canConfirm: !enabled || (status === 'ready' && !hasBlocked),
		reload,
		buildAllocationItems,
		handleCloseError,
		clearReselectNotes,
	};
};
