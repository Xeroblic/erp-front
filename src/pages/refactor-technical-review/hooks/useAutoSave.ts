/**
 * useAutoSave.ts
 * Hook de auto-guardado para formularios de revisión técnica.
 *
 * Dos disparadores:
 * 1. Al cambiar de sección (step change) → guarda silenciosamente
 * 2. Al detectar inactividad (20s sin mouse/teclado) → guarda y muestra modal
 *
 * Usa `updateItemDetails` (PATCH /items/{id}/details) del Redux slice.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '@/store';
import { updateItemDetails } from '@/store/slices/technicalReviews';
import { toast } from 'react-toastify';
import {
	filterTechnicalReviewPayload,
	HARDWARE_NULLABLE_FIELDS,
} from '@/utils/technicalReviewHardware';
import { getEquipmentFieldLabel } from '../components/translations/equipment.labels';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseAutoSaveOptions {
	/** Branch ID from useCurrentBranch */
	branchId: number | null;
	/** Subsidiary ID from useCurrentBranch when the review uses subsidiary scope */
	subsidiaryId?: number | null;
	/** Item ID being reviewed */
	itemId: number | null;
	/** Function that returns the current form data snapshot */
	getFormData: () => Record<string, unknown>;
	/** Disable auto-save (e.g. readOnly mode, no item loaded yet) */
	enabled?: boolean;
	/** Idle timeout in milliseconds (default: 20000 = 20s) */
	idleTimeoutMs?: number;
	/** Equipment type for field filtering */
	equipmentType?: string;
	/** Optional transformer to clean/format data before saving */
	transformData?: (data: Record<string, unknown>) => Record<string, unknown>;
}

export interface UseAutoSaveReturn {
	/** Trigger a save immediately (used on step change) */
	saveNow: (silent?: boolean) => Promise<boolean>;
	/** Whether a save is currently in progress */
	isSaving: boolean;
	/** Timestamp of last successful save */
	lastSavedAt: Date | null;
	/** Whether the idle-save modal should be shown */
	showIdleSaveModal: boolean;
	/** Dismiss the idle-save modal */
	dismissIdleSaveModal: () => void;
}

// ─── Aviso de campos descartados ─────────────────────────────────────────────

const MAX_LISTED_FIELDS = 3;

/**
 * El reintento saneado quita los valores que el backend no acepta y recién entonces
 * guarda, así que el badge termina diciendo «Guardado» sobre una revisión a la que le
 * falta lo que el técnico eligió. Nombrar los campos es la única señal de que quedaron
 * sin registrar, y por eso el aviso también aparece en los guardados silenciosos: lo
 * silencioso es el éxito, no la pérdida de un dato.
 */
const buildDroppedFieldsMessage = (fields: string[], equipmentType?: string): string => {
	const labels = fields.map((field) => getEquipmentFieldLabel(field, equipmentType));
	const listed = labels.slice(0, MAX_LISTED_FIELDS).join(', ');
	const rest = labels.length - MAX_LISTED_FIELDS;
	const detail = rest > 0 ? `${listed} y ${rest} más` : listed;
	const tail =
		labels.length === 1
			? 'ese campo quedó sin registrar'
			: 'esos campos quedaron sin registrar';

	return `Se guardó la revisión, pero el backend no aceptó ${detail}: ${tail}. Revísalo y vuelve a elegir un valor.`;
};

/** Campos que el payload saneado dejó de enviar respecto del original. */
const getDroppedFields = (
	rawPayload: Record<string, unknown>,
	transformedPayload: Record<string, unknown>,
): string[] => Object.keys(rawPayload).filter((field) => !(field in transformedPayload));

// ─── Activity events to listen for ───────────────────────────────────────────
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
	'mousemove',
	'mousedown',
	'keydown',
	'touchstart',
	'scroll',
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAutoSave = ({
	branchId,
	subsidiaryId = null,
	itemId,
	getFormData,
	enabled = true,
	idleTimeoutMs = 20_000,
	equipmentType,
	transformData,
}: UseAutoSaveOptions): UseAutoSaveReturn => {
	const dispatch = useAppDispatch();

	const [isSaving, setIsSaving] = useState(false);
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
	const [showIdleSaveModal, setShowIdleSaveModal] = useState(false);

	// Refs to avoid stale closures
	const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastSnapshotRef = useRef<string>('');
	const isSavingRef = useRef(false);
	const enabledRef = useRef(enabled);
	const getFormDataRef = useRef(getFormData);
	const transformDataRef = useRef(transformData);

	// Keep refs in sync
	useEffect(() => {
		enabledRef.current = enabled;
	}, [enabled]);

	useEffect(() => {
		getFormDataRef.current = getFormData;
	}, [getFormData]);

	useEffect(() => {
		transformDataRef.current = transformData;
	}, [transformData]);

	const buildPayload = useCallback(
		(
			rawData: Record<string, unknown>,
			useTransformFallback = false,
		): Record<string, unknown> => {
			let data = rawData;

			// Save raw payload first; only apply transform as fallback on errors.
			if (useTransformFallback && transformDataRef.current) {
				data = transformDataRef.current(data);
			}

			const payload = filterTechnicalReviewPayload(data, HARDWARE_NULLABLE_FIELDS);

			if (!payload.extra_attributes) {
				payload.extra_attributes = {};
			} else if (typeof payload.extra_attributes === 'string') {
				try {
					payload.extra_attributes = JSON.parse(payload.extra_attributes);
				} catch (_e) {
					payload.extra_attributes = { raw: payload.extra_attributes };
				}
			}

			return payload;
		},
		[],
	);

	const hasPendingChanges = useCallback((): boolean => {
		const rawData = getFormDataRef.current();
		const payload = buildPayload(rawData, false);
		const snapshot = JSON.stringify(payload);
		return snapshot !== lastSnapshotRef.current;
	}, [buildPayload]);

	// ─── Core save function ──────────────────────────────────────────────────

	const saveNow = useCallback(
		async (silent = false): Promise<boolean> => {
			// Guards
			if ((!branchId && !subsidiaryId) || !itemId) return false;
			if (!enabledRef.current) return false;
			if (isSavingRef.current) return false;

			const rawData = getFormDataRef.current();
			const rawPayload = buildPayload(rawData, false);
			const rawSnapshot = JSON.stringify(rawPayload);

			// Skip if no changes since last save
			if (rawSnapshot === lastSnapshotRef.current) {
				return true; // Consider it "saved" since nothing changed
			}

			isSavingRef.current = true;
			setIsSaving(true);

			try {
				await dispatch(
					updateItemDetails({
						branchId,
						subsidiaryId,
						itemId,
						data: rawPayload,
						equipmentType,
					}),
				).unwrap();

				lastSnapshotRef.current = rawSnapshot;
				setLastSavedAt(new Date());

				if (!silent) {
					// Only toast for non-silent (explicit user-triggered) saves if needed
				}

				return true;
			} catch (rawError: unknown) {
				if (!transformDataRef.current) {
					const msg = rawError instanceof Error ? rawError.message : String(rawError);
					toast.error(`Error al auto-guardar: ${msg}`);
					return false;
				}

				try {
					const transformedPayload = buildPayload(rawData, true);

					await dispatch(
						updateItemDetails({
							branchId,
							subsidiaryId,
							itemId,
							data: transformedPayload,
							equipmentType,
						}),
					).unwrap();

					// El snapshot que queda es el **crudo**, no el saneado: `hasPendingChanges`
					// y la guarda de `saveNow` comparan siempre contra el payload crudo, que
					// conserva el campo rechazado. Guardar el saneado dejaba los dos siempre
					// distintos, así que cada ciclo de inactividad repetía los dos PATCH
					// —el que falla y el reintento— y volvía a avisar, indefinidamente. Con
					// el crudo, el ciclo se detiene hasta que el técnico cambie el dato, que
					// es exactamente cuando vuelve a tener sentido reintentar.
					lastSnapshotRef.current = rawSnapshot;
					setLastSavedAt(new Date());

					const droppedFields = getDroppedFields(rawPayload, transformedPayload);
					if (droppedFields.length > 0) {
						toast.warning(buildDroppedFieldsMessage(droppedFields, equipmentType));
					}

					return true;
				} catch (transformedError: unknown) {
					const msg =
						transformedError instanceof Error
							? transformedError.message
							: String(transformedError);
					toast.error(`Error al auto-guardar: ${msg}`);
					return false;
				}
			} finally {
				isSavingRef.current = false;
				setIsSaving(false);
			}
		},
		[branchId, subsidiaryId, itemId, equipmentType, dispatch, buildPayload],
	);

	// ─── Idle Detection ──────────────────────────────────────────────────────

	const resetIdleTimer = useCallback(() => {
		if (idleTimerRef.current) {
			clearTimeout(idleTimerRef.current);
		}

		if (!enabledRef.current) return;

		idleTimerRef.current = setTimeout(async () => {
			// User is idle → auto-save
			const hadPendingChanges = hasPendingChanges();
			const success = await saveNow(true);
			if (success && hadPendingChanges) {
				setShowIdleSaveModal(true);
			}
		}, idleTimeoutMs);
	}, [idleTimeoutMs, saveNow, hasPendingChanges]);

	// Set up activity listeners
	useEffect(() => {
		if (!enabled || (!branchId && !subsidiaryId) || !itemId) return;

		// Start initial idle timer
		resetIdleTimer();

		// Attach listeners
		const handler = () => resetIdleTimer();
		ACTIVITY_EVENTS.forEach((event) => {
			window.addEventListener(event, handler, { passive: true });
		});

		return () => {
			// Cleanup
			if (idleTimerRef.current) {
				clearTimeout(idleTimerRef.current);
			}
			ACTIVITY_EVENTS.forEach((event) => {
				window.removeEventListener(event, handler);
			});
		};
	}, [enabled, branchId, subsidiaryId, itemId, resetIdleTimer]);

	// ─── Initialize snapshot with current data ───────────────────────────────

	useEffect(() => {
		if (enabled && (branchId || subsidiaryId) && itemId) {
			// Take initial snapshot so we don't immediately save unchanged data
			const currentData = getFormDataRef.current();
			const payload = buildPayload(currentData, false);
			lastSnapshotRef.current = JSON.stringify(payload);
		}
	}, [enabled, branchId, subsidiaryId, itemId, buildPayload]);

	// ─── Modal dismiss ───────────────────────────────────────────────────────

	const dismissIdleSaveModal = useCallback(() => {
		setShowIdleSaveModal(false);
		// Reset idle timer after dismissing
		resetIdleTimer();
	}, [resetIdleTimer]);

	return {
		saveNow,
		isSaving,
		lastSavedAt,
		showIdleSaveModal,
		dismissIdleSaveModal,
	};
};

export default useAutoSave;
