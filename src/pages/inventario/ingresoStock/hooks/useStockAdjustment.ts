/**
 * Hook para manejar envío de ajuste de stock
 * Responsabilidad única: comunicación con API (Single Responsibility)
 */
import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import ApiService from '@/services/ApiService';
import type {
	IWorkItem,
	IMovementType,
	IBatchAdjustmentResponse,
	IStockAdjustmentPayload,
} from '../types';

const LAST_BATCH_STORAGE_KEY = 'ingreso-stock:last-batch-id';

type ApiErrorLike = {
	message?: string;
	response?: {
		status?: number;
		data?: {
			message?: string;
			errors?: Record<string, string[] | string>;
		};
	};
};

const persistLastBatchId = (batchId: string) => {
	if (typeof window === 'undefined') return;
	window.sessionStorage.setItem(LAST_BATCH_STORAGE_KEY, batchId);
};

const readLastBatchId = (): string | null => {
	if (typeof window === 'undefined') return null;
	return window.sessionStorage.getItem(LAST_BATCH_STORAGE_KEY);
};

const clearPersistedLastBatchId = () => {
	if (typeof window === 'undefined') return;
	window.sessionStorage.removeItem(LAST_BATCH_STORAGE_KEY);
};

const showValidationErrors = (errors?: Record<string, string[] | string>) => {
	if (!errors) return;
	const entries = Object.entries(errors).slice(0, 8);
	entries.forEach(([field, value]) => {
		const label = field.replace(/\./g, ' > ');
		if (Array.isArray(value)) {
			value
				.filter(Boolean)
				.slice(0, 2)
				.forEach((msg) => toast.error(`${label}: ${msg}`));
			return;
		}
		if (value) toast.error(`${label}: ${value}`);
	});
};

export const useStockAdjustment = () => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [lastBatchId, setLastBatchId] = useState<string | null>(() => readLastBatchId());

	/**
	 * Convierte cantidad string a número, validando > 0
	 */
	const toPositiveNumber = useCallback((value: string | number): number => {
		const parsed = Number(value);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
	}, []);

	/**
	 * Calcula quantity_change (con signo según tipo de movimiento)
	 */
	const getSignedQuantity = useCallback(
		(quantity: string, movementType: IMovementType): number => {
			const absolute = toPositiveNumber(quantity);
			if (!absolute) return 0;
			return movementType === 'egreso' ? -absolute : absolute;
		},
		[toPositiveNumber],
	);

	/**
	 * Construye payload y envía ajuste al API
	 */
	const submitBatchAdjustment = useCallback(
		async (
			workItems: IWorkItem[],
			branchId: string,
			reason: string,
			notes: string,
			selectedSubsidiaryId: number,
			movementType: IMovementType,
			onSuccess?: () => void,
		): Promise<boolean> => {
			const parsedBranchId = toPositiveNumber(branchId);
			const normalizedReason = reason.trim();
			const normalizedNotes = notes.trim();

			if (!workItems.length) {
				toast.error('Agrega al menos un producto para ajustar.');
				return false;
			}

			if (workItems.length > 500) {
				toast.error('No puedes enviar más de 500 productos por lote.');
				return false;
			}

			if (!parsedBranchId) {
				toast.error('Debes seleccionar una sucursal válida para el ajuste.');
				return false;
			}

			if (!normalizedReason) {
				toast.error('La razón del ajuste es obligatoria.');
				return false;
			}

			if (normalizedReason.length > 255) {
				toast.error('La razón del ajuste no puede superar 255 caracteres.');
				return false;
			}

			if (!Number.isFinite(selectedSubsidiaryId) || selectedSubsidiaryId === 0) {
				toast.error('Error interno: subsidiaria no válida. Reintenta agregar productos.');
				return false;
			}

			let hasNegativeStockError = false;

			// Construir array de items con quantity_change
			const items = workItems
				.map((item) => {
					const quantity_change = getSignedQuantity(item.quantity, movementType);

					// Validación de stock negativo (Solo para egresos)
					if (movementType === 'egreso' && quantity_change < 0) {
						const absoluteChange = Math.abs(quantity_change);
						const currentStock = Number(item.stock ?? 0);
						if (absoluteChange > currentStock) {
							toast.error(
								`No puedes egresar ${absoluteChange} de "${item.name}". Stock actual: ${currentStock}`,
							);
							hasNegativeStockError = true;
						}
					}

					return {
						product_id: item.productId,
						quantity_change,
					};
				})
				.filter((item) => item.quantity_change !== 0);

			if (hasNegativeStockError) {
				return false;
			}

			// Validar que NO haya cambios de 0
			if (!items.length || items.length !== workItems.length) {
				toast.error('Todos los productos deben tener cantidad distinta de 0.');
				return false;
			}

			// Armar payload
			const payload: IStockAdjustmentPayload = {
				branch_id: parsedBranchId,
				reason: normalizedReason,
				notes: normalizedNotes || undefined,
				items,
			};

			setIsSubmitting(true);
			try {
				const response = await ApiService.fetchData<IBatchAdjustmentResponse>({
					url: `/subsidiaries/${selectedSubsidiaryId}/stock-adjustments`,
					method: 'POST',
					data: payload as unknown as Record<string, unknown>,
				});

				if (response.status !== 202) {
					throw new Error('El backend no aceptó el ajuste en segundo plano.');
				}

				const batchId = response.data?.batch_id;
				if (batchId) {
					setLastBatchId(batchId);
					persistLastBatchId(batchId);
				}
				toast.success(
					batchId
						? `✓ Procesando en segundo plano. Batch: ${batchId}`
						: '✓ Procesando en segundo plano.',
				);

				onSuccess?.();
				return true;
			} catch (err) {
				const apiError = err as ApiErrorLike;
				const status = apiError?.response?.status;
				const apiMessage = apiError?.response?.data?.message;

				if (status === 403) {
					toast.error('No tienes permisos para ajustar stock en esta subsidiaria (403).');
					return false;
				}

				if (status === 422) {
					toast.error(apiMessage || 'Hay errores de validación en el ajuste (422).');
					showValidationErrors(apiError?.response?.data?.errors);
					return false;
				}

				const message =
					typeof apiMessage === 'string' && apiMessage.trim()
						? apiMessage
						: err instanceof Error
							? err.message
							: 'Error al enviar ajuste de stock.';
				toast.error(`✗ ${message}`);
				return false;
			} finally {
				setIsSubmitting(false);
			}
		},
		[getSignedQuantity, toPositiveNumber],
	);

	const clearLastBatchId = useCallback(() => {
		setLastBatchId(null);
		clearPersistedLastBatchId();
	}, []);

	return {
		isSubmitting,
		lastBatchId,
		clearLastBatchId,
		submitBatchAdjustment,
		getSignedQuantity,
		toPositiveNumber,
	};
};
