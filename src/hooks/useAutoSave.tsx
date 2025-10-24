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
	const lastActivityRef = useRef<number>(Date.now());
	const cachedValuesRef = useRef<T>(values);
	const previousValuesRef = useRef<string | null>(null);
	const initialValuesRef = useRef<string | null>(null);
	const isFirstMountRef = useRef<boolean>(true);
	const userHasInteractedRef = useRef<boolean>(false);

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

		if (!enabled || !isDirty || isSubmitting) {
			return;
		}

		lastActivityRef.current = Date.now();

		inactivityTimerRef.current = setTimeout(() => {
			setShowSavePrompt(true);
		}, delay);
	}, [enabled, isDirty, isSubmitting, delay]);

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

		setIsDirty(hasChangedFromInitial);

		if (hasChangedFromInitial) {
			cachedValuesRef.current = values;
			resetInactivityTimer();
		} else if (inactivityTimerRef.current) {
			clearTimeout(inactivityTimerRef.current);
			inactivityTimerRef.current = null;
		}
	}, [values, initialValues, enabled, detectChanges, resetInactivityTimer]);

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
	}, [enabled, isDirty, resetInactivityTimer]);

	useEffect(() => {
		return () => {
			if (inactivityTimerRef.current) {
				clearTimeout(inactivityTimerRef.current);
			}

			isFirstMountRef.current = true;
			userHasInteractedRef.current = false;
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
	}, [resetInactivityTimer]);

	const reset = useCallback(() => {
		setIsDirty(false);
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
