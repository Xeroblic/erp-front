// src/pages/recursosHumanos/hooks/useRelojControl.ts
import { useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	addRecord,
	setIsValidating,
	setIsScanning,
	setLastValidation,
	setError,
} from '@/store/slices/recursosHumanos/rhSlice';
import { useGeolocationValidation } from './useGeolocationValidation';
import { useNetworkValidation } from './useNetworkValidation';
import type {
	IRHValidationResult,
	IRHAttendanceRecord,
	TRHPunchType,
	IRHScheduleValidation,
	IRHQRValidation,
} from '@/interface/rh.interface';

/* ======================================================
   HELPERS
   ====================================================== */

function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function isHolidayToday(holidays: { date: string; recurring: boolean }[]): string | null {
	const today = new Date();
	const mm = String(today.getMonth() + 1).padStart(2, '0');
	const dd = String(today.getDate()).padStart(2, '0');
	const yyyy = today.getFullYear();
	const todayISO = `${yyyy}-${mm}-${dd}`;
	const todayMMDD = `${mm}-${dd}`;

	for (const h of holidays) {
		if (h.date === todayISO) return h.date;
		if (h.recurring && h.date.endsWith(todayMMDD)) return h.date;
	}
	return null;
}

/**
 * Determina si está dentro del horario laboral.
 * Permite marcar desde 30 min antes de la entrada hasta 60 min después de la salida.
 */
function isWithinSchedule(entryTime: string, exitTime: string): IRHScheduleValidation {
	const now = new Date();
	const [eH, eM] = entryTime.split(':').map(Number);
	const [xH, xM] = exitTime.split(':').map(Number);
	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	const entryMinutes = eH * 60 + eM;
	const exitMinutes = xH * 60 + xM;

	const toleranceBefore = 30;
	const toleranceAfter = 60;

	if (
		currentMinutes >= entryMinutes - toleranceBefore &&
		currentMinutes <= exitMinutes + toleranceAfter
	) {
		return { passed: true, reason: '' };
	}

	return {
		passed: false,
		reason: `Fuera del horario laboral. Horario: ${entryTime} - ${exitTime}`,
	};
}

/**
 * Determina si la marcación es a tiempo o con atraso.
 * Gracia: entrada + 1 minuto → puntual. Después → atrasado.
 */
function getPunctualityStatus(
	punchType: TRHPunchType,
	entryTime: string,
	exitTime: string,
): 'on_time' | 'late' | 'early_exit' {
	const now = new Date();
	const currentMinutes = now.getHours() * 60 + now.getMinutes();

	if (punchType === 'entry') {
		const [eH, eM] = entryTime.split(':').map(Number);
		const entryMinutes = eH * 60 + eM;
		const graceMinutes = entryMinutes + 1; // 1 minuto de gracia

		return currentMinutes <= graceMinutes ? 'on_time' : 'late';
	} else {
		const [xH, xM] = exitTime.split(':').map(Number);
		const exitMinutes = xH * 60 + xM;

		return currentMinutes < exitMinutes ? 'early_exit' : 'on_time';
	}
}

/* ======================================================
   HOOK PRINCIPAL
   ====================================================== */

interface UseRelojControlReturn {
	nextPunchType: TRHPunchType;
	preValidationsPassed: boolean;
	validations: IRHValidationResult | null;
	isValidating: boolean;
	isScanning: boolean;
	error: string | null;
	lastRecord: IRHAttendanceRecord | null;
	todayRecords: IRHAttendanceRecord[];
	/** Si ya se marcó entrada hoy */
	alreadyPunchedEntry: boolean;
	/** Si ya se marcó salida hoy */
	alreadyPunchedExit: boolean;
	/** Si la marcación acaba de ser exitosa */
	justPunched: boolean;
	runPreValidations: () => Promise<boolean>;
	handleQRScanned: (scannedCode: string) => void;
	cancelScan: () => void;
	resetValidations: () => void;
}

export function useRelojControl(): UseRelojControlReturn {
	const dispatch = useAppDispatch();
	const config = useAppSelector((s) => s.recursosHumanos.config);
	const holidays = useAppSelector((s) => s.recursosHumanos.holidays);
	const records = useAppSelector((s) => s.recursosHumanos.records);
	const ui = useAppSelector((s) => s.recursosHumanos.ui);
	const user = useAppSelector((s) => s.auth.user);

	const geoValidation = useGeolocationValidation();
	const networkValidation = useNetworkValidation();

	const [validations, setValidations] = useState<IRHValidationResult | null>(null);
	const [preValidationsPassed, setPreValidationsPassed] = useState(false);
	const [justPunched, setJustPunched] = useState(false);

	// ── Filtrar registros del día ─────────────────────
	const todayRecords = useMemo(() => {
		const todayStr = new Date().toISOString().split('T')[0];
		return records.filter((r) => r.timestamp.startsWith(todayStr));
	}, [records]);

	const lastRecord = todayRecords.length > 0 ? todayRecords[0] : null;

	// ── Verificar si ya marcó hoy ────────────────────
	const alreadyPunchedEntry = todayRecords.some((r) => r.type === 'entry');
	const alreadyPunchedExit = todayRecords.some((r) => r.type === 'exit');

	// El siguiente tipo depende de lo que falta
	const nextPunchType: TRHPunchType = (() => {
		if (!alreadyPunchedEntry) return 'entry';
		if (!alreadyPunchedExit) return 'exit';
		// Ya marcó ambos — no debería poder marcar más
		return 'exit';
	})();

	// ── Si ya marcó ambos, bloquear ──────────────────
	const allPunchesComplete = alreadyPunchedEntry && alreadyPunchedExit;

	// ── Paso 1: Pre-validaciones ─────────────────────
	const runPreValidations = useCallback(async (): Promise<boolean> => {
		// Bloquear si ya marcó ambos
		if (allPunchesComplete) {
			dispatch(setError('Ya has registrado entrada y salida hoy.'));
			return false;
		}

		setJustPunched(false);
		dispatch(setIsValidating(true));
		dispatch(setError(null));

		const validationResult: IRHValidationResult = {
			geolocation: null,
			network: null,
			schedule: null,
			qr: null,
			allPassed: false,
		};

		try {
			// Verificar feriado
			const holidayDate = isHolidayToday(holidays);
			if (holidayDate) {
				validationResult.schedule = {
					passed: false,
					reason: `Hoy es feriado (${holidayDate}). No se requiere marcación.`,
				};
				setValidations(validationResult);
				dispatch(setLastValidation(validationResult));
				dispatch(setIsValidating(false));
				return false;
			}

			// Verificar horario
			const scheduleResult = isWithinSchedule(config.entryTime, config.exitTime);
			validationResult.schedule = scheduleResult;

			if (!scheduleResult.passed) {
				setValidations(validationResult);
				dispatch(setLastValidation(validationResult));
				dispatch(setIsValidating(false));
				return false;
			}

			// Validar geolocalización
			const geoResult = await geoValidation.validate(
				config.latitude,
				config.longitude,
				config.radiusMeters,
			);
			validationResult.geolocation = geoResult;

			// Validar red (IP pública)
			const netResult = await networkValidation.validate(config.authorizedPublicIP);
			validationResult.network = netResult;

			// Evaluar resultado
			const allPrePassed = geoResult.passed && netResult.passed && scheduleResult.passed;
			validationResult.allPassed = allPrePassed;

			setValidations(validationResult);
			setPreValidationsPassed(allPrePassed);
			dispatch(setLastValidation(validationResult));
			dispatch(setIsValidating(false));

			if (allPrePassed) {
				dispatch(setIsScanning(true));
			}

			return allPrePassed;
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Error en validaciones';
			dispatch(setError(msg));
			dispatch(setIsValidating(false));
			setPreValidationsPassed(false);
			return false;
		}
	}, [config, holidays, geoValidation, networkValidation, dispatch, allPunchesComplete]);

	// ── Paso 2: Manejar QR escaneado ─────────────────
	const handleQRScanned = useCallback(
		(scannedCode: string) => {
			const qrResult: IRHQRValidation = {
				passed: scannedCode === config.qrCode,
				scannedCode,
				message:
					scannedCode === config.qrCode
						? 'QR de sucursal verificado correctamente'
						: 'QR no corresponde a la sucursal configurada',
			};

			const updatedValidations: IRHValidationResult = {
				...(validations ?? {
					geolocation: null,
					network: null,
					schedule: null,
					qr: null,
					allPassed: false,
				}),
				qr: qrResult,
				allPassed:
					(validations?.geolocation?.passed ?? false) &&
					(validations?.network?.passed ?? false) &&
					(validations?.schedule?.passed ?? false) &&
					qrResult.passed,
			};

			setValidations(updatedValidations);
			dispatch(setIsScanning(false));

			if (qrResult.passed) {
				// Determinar puntualidad
				const punctuality = getPunctualityStatus(
					nextPunchType,
					config.entryTime,
					config.exitTime,
				);

				const record: IRHAttendanceRecord = {
					id: generateId(),
					userId: user?.id ?? 0,
					userName: user?.first_name
						? `${user.first_name} ${user?.last_name ?? ''}`.trim()
						: 'Usuario',
					type: nextPunchType,
					timestamp: new Date().toISOString(),
					latitude: validations?.geolocation?.detectedLat ?? 0,
					longitude: validations?.geolocation?.detectedLng ?? 0,
					publicIP: validations?.network?.detectedIP ?? '',
					qrCodeScanned: scannedCode,
					validations: updatedValidations,
					punctuality,
				};
				dispatch(addRecord(record));
				setJustPunched(true);
				setPreValidationsPassed(false);
			} else {
				dispatch(setError(qrResult.message));
			}
		},
		[config, validations, nextPunchType, user, dispatch],
	);

	const cancelScan = useCallback(() => {
		dispatch(setIsScanning(false));
		setPreValidationsPassed(false);
	}, [dispatch]);

	const resetValidations = useCallback(() => {
		setValidations(null);
		setPreValidationsPassed(false);
		setJustPunched(false);
		dispatch(setLastValidation(null));
		dispatch(setIsScanning(false));
		dispatch(setError(null));
	}, [dispatch]);

	return {
		nextPunchType,
		preValidationsPassed,
		validations,
		isValidating: ui.isValidating,
		isScanning: ui.isScanning,
		error: ui.error,
		lastRecord,
		todayRecords,
		alreadyPunchedEntry,
		alreadyPunchedExit,
		justPunched,
		runPreValidations,
		handleQRScanned,
		cancelScan,
		resetValidations,
	};
}

export default useRelojControl;
