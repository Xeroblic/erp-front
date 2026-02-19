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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseAutoSaveOptions {
	/** Branch ID from useCurrentBranch */
	branchId: number | null;
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
	itemId,
	getFormData,
	enabled = true,
	idleTimeoutMs = 20_000,
	equipmentType,
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

	// Keep refs in sync
	useEffect(() => {
		enabledRef.current = enabled;
	}, [enabled]);

	useEffect(() => {
		getFormDataRef.current = getFormData;
	}, [getFormData]);

	// ─── Core save function ──────────────────────────────────────────────────

	const saveNow = useCallback(
		async (silent = false): Promise<boolean> => {
			// Guards
			if (!branchId || !itemId) return false;
			if (!enabledRef.current) return false;
			if (isSavingRef.current) return false;

			const currentData = getFormDataRef.current();
			const currentSnapshot = JSON.stringify(currentData);

			// Skip if no changes since last save
			if (currentSnapshot === lastSnapshotRef.current) {
				return true; // Consider it "saved" since nothing changed
			}

			isSavingRef.current = true;
			setIsSaving(true);

			try {
				await dispatch(
					updateItemDetails({
						branchId,
						itemId,
						data: currentData,
						equipmentType,
					}),
				).unwrap();

				lastSnapshotRef.current = currentSnapshot;
				setLastSavedAt(new Date());

				if (!silent) {
					// Only toast for non-silent (explicit user-triggered) saves if needed
				}

				return true;
			} catch (error: unknown) {
				const msg = error instanceof Error ? error.message : String(error);
				toast.error(`Error al auto-guardar: ${msg}`);
				return false;
			} finally {
				isSavingRef.current = false;
				setIsSaving(false);
			}
		},
		[branchId, itemId, equipmentType, dispatch],
	);

	// ─── Idle Detection ──────────────────────────────────────────────────────

	const resetIdleTimer = useCallback(() => {
		if (idleTimerRef.current) {
			clearTimeout(idleTimerRef.current);
		}

		if (!enabledRef.current) return;

		idleTimerRef.current = setTimeout(async () => {
			// User is idle → auto-save
			const success = await saveNow(true);
			if (success) {
				setShowIdleSaveModal(true);
			}
		}, idleTimeoutMs);
	}, [idleTimeoutMs, saveNow]);

	// Set up activity listeners
	useEffect(() => {
		if (!enabled || !branchId || !itemId) return;

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
	}, [enabled, branchId, itemId, resetIdleTimer]);

	// ─── Initialize snapshot with current data ───────────────────────────────

	useEffect(() => {
		if (enabled && branchId && itemId) {
			// Take initial snapshot so we don't immediately save unchanged data
			const currentData = getFormDataRef.current();
			lastSnapshotRef.current = JSON.stringify(currentData);
		}
	}, [enabled, branchId, itemId]);

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
