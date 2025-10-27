import { useEffect, useRef, useState, useCallback } from 'react';
import { useFormikContext } from 'formik';

interface UseAutoSaveOptions<T> {
	/** Delay in milliseconds before showing the prompt (default 30000 = 30 seconds) */
	delay?: number;
	/** Callback executed when the user confirms the save */
	onSave: (values: T) => Promise<void>;
	/** Custom comparator to detect changes (shallow comparison by default) */
	hasChanges?: (current: T, initial: T) => boolean;
	/** Enable/disable the auto save behaviour */
	enabled?: boolean;
}

interface AutoSaveState {
	/** Whether there are pending changes */
	isDirty: boolean;
	/** Whether the confirmation prompt is visible */
	showSavePrompt: boolean;
	/** Whether the save operation is currently running */
	isSaving: boolean;
	/** Programmatic save trigger */
	save: () => Promise<void>;
	/** Cancel the pending save and close the prompt */
	cancelSave: () => void;
	/** Confirm and execute the save */
	confirmSave: () => Promise<void>;
	/** Reset the hook state (useful after successful saves) */
	reset: () => void;
}

/**
 * Custom hook that implements auto-save with inactivity detection.
 *
 * It watches Formik values for real user changes and, after a period of inactivity,
 * shows a confirmation dialog to persist those changes.
 */
export function useAutoSave<T = any>(options: UseAutoSaveOptions<T>): AutoSaveState {
	const {
		delay = 30000, // 30 seconds by default
		onSave,
		hasChanges,
		enabled = true,
	} = options;

	const { values, initialValues, isSubmitting } = useFormikContext<T>();

	const [isDirty, setIsDirty] = useState(false);
	const [showSavePrompt, setShowSavePrompt] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
	const cachedValuesRef = useRef<T>(values);
	const previousValuesRef = useRef<string | null>(null);
	const initialValuesRef = useRef<string | null>(null);
	const isFirstMountRef = useRef<boolean>(true);
	const isDirtyRef = useRef<boolean>(false);

	const detectChanges = useCallback(
		(current: T, initial: T): boolean => {
			if (hasChanges) {
				return hasChanges(current, initial);
			}

			return JSON.stringify(current) !== JSON.stringify(initial);
		},
		[hasChanges],
	);

	const resetInactivityTimer = useCallback(() => {
		if (inactivityTimerRef.current) {
			clearTimeout(inactivityTimerRef.current);
			inactivityTimerRef.current = null;
		}

		console.log('⏰ resetInactivityTimer:', {
			enabled,
			isDirtyRef: isDirtyRef.current,
			isSubmitting,
			delay,
		});

		// 🔧 Usar isDirtyRef.current en lugar de isDirty para evitar dependencia circular
		if (!enabled || !isDirtyRef.current || isSubmitting) {
			console.log('❌ Timer NO iniciado (condiciones no cumplidas)');
			return;
		}

		console.log(`⏱️ Timer iniciado: ${delay}ms`);
		inactivityTimerRef.current = setTimeout(() => {
			console.log('🔔 TIMER COMPLETADO - Mostrando prompt');
			setShowSavePrompt(true);
		}, delay);
	}, [enabled, delay, isSubmitting]); // 🚫 Removemos isDirty de las dependencias

	useEffect(() => {
		if (!enabled) {
			return;
		}

		const currentValuesStr = JSON.stringify(values);
		const currentInitialStr = JSON.stringify(initialValues);

		if (previousValuesRef.current === null && initialValuesRef.current === null) {
			previousValuesRef.current = currentValuesStr;
			initialValuesRef.current = currentInitialStr;
			isFirstMountRef.current = true;
			return;
		}

		if (isFirstMountRef.current) {
			previousValuesRef.current = currentValuesStr;
			initialValuesRef.current = currentInitialStr;
			isFirstMountRef.current = false;
			return;
		}

		if (
			currentValuesStr === previousValuesRef.current &&
			currentInitialStr === initialValuesRef.current
		) {
			return;
		}

		previousValuesRef.current = currentValuesStr;
		initialValuesRef.current = currentInitialStr;

		const hasChangedFromInitial = detectChanges(values, initialValues);

		console.log('🔍 AutoSave Debug:', {
			hasChangedFromInitial,
			enabled,
			isSubmitting,
			delay,
			currentIsDirty: isDirtyRef.current,
		});

		setIsDirty(hasChangedFromInitial);
		isDirtyRef.current = hasChangedFromInitial; // 🆕 Sincronizar ref con state

		if (hasChangedFromInitial) {
			cachedValuesRef.current = values;
			console.log('✅ Iniciando timer de inactividad...');
			resetInactivityTimer();
		} else if (inactivityTimerRef.current) {
			clearTimeout(inactivityTimerRef.current);
			inactivityTimerRef.current = null;
		}
	}, [values, initialValues, enabled, detectChanges]); // 🔧 Removido resetInactivityTimer

	// ⚠️ NO incluir resetInactivityTimer en las dependencias para evitar recrear listeners
	useEffect(() => {
		if (!enabled || !isDirty) {
			return;
		}

		const handleActivity = () => {
			resetInactivityTimer();
		};

		window.addEventListener('mousemove', handleActivity);
		window.addEventListener('keydown', handleActivity);
		window.addEventListener('click', handleActivity);
		window.addEventListener('scroll', handleActivity);

		return () => {
			window.removeEventListener('mousemove', handleActivity);
			window.removeEventListener('keydown', handleActivity);
			window.removeEventListener('click', handleActivity);
			window.removeEventListener('scroll', handleActivity);
		};
	}, [enabled, isDirty]); // 🔧 Removido resetInactivityTimer de las dependencias

	useEffect(() => {
		return () => {
			if (inactivityTimerRef.current) {
				clearTimeout(inactivityTimerRef.current);
			}

			isFirstMountRef.current = true;
			previousValuesRef.current = null;
			initialValuesRef.current = null;
		};
	}, []);

	const save = useCallback(async () => {
		if (!isDirty || isSaving) return;

		setIsSaving(true);
		try {
			await onSave(cachedValuesRef.current);
			setIsDirty(false);
			isDirtyRef.current = false; // 🆕 Sincronizar ref
			setShowSavePrompt(false);
			if (inactivityTimerRef.current) {
				clearTimeout(inactivityTimerRef.current);
			}
		} catch {
			// Intentionally swallow errors; the caller manages notifications.
		} finally {
			setIsSaving(false);
		}
	}, [isDirty, isSaving, onSave]);

	const confirmSave = useCallback(async () => {
		await save();
	}, [save]);

	const cancelSave = useCallback(() => {
		setShowSavePrompt(false);
		resetInactivityTimer();
	}, []); // 🔧 Removido resetInactivityTimer - la función siempre está disponible por closure

	const reset = useCallback(() => {
		setIsDirty(false);
		isDirtyRef.current = false; // 🆕 Sincronizar ref
		setShowSavePrompt(false);
		if (inactivityTimerRef.current) {
			clearTimeout(inactivityTimerRef.current);
		}
	}, []);

	return {
		isDirty,
		showSavePrompt,
		isSaving,
		save,
		cancelSave,
		confirmSave,
		reset,
	};
}
