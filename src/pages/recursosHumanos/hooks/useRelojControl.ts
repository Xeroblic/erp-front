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

function isWithinSchedule(entryTime: string, exitTime: string): IRHScheduleValidation {
	const now = new Date();
	const [eH, eM] = entryTime.split(':').map(Number);
	const [xH, xM] = exitTime.split(':').map(Number);
	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	const entryMinutes = eH * 60 + eM;
	const exitMinutes = xH * 60 + xM;

	// Permitir 30 minutos antes de la entrada y 60 minutos después de la salida
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

/* ======================================================
   HOOK PRINCIPAL
   ====================================================== */

interface UseRelojControlReturn {
	/** Siguiente tipo de marcación basado en último registro */
	nextPunchType: TRHPunchType;
	/** Si pasaron geo + red + horario (precondiciones para QR) */
	preValidationsPassed: boolean;
	/** Resultado de validaciones */
	validations: IRHValidationResult | null;
	/** Si está en proceso de validación */
	isValidating: boolean;
	/** Si está escaneando QR */
	isScanning: boolean;
	/** Error general */
	error: string | null;
	/** Último registro del día */
	lastRecord: IRHAttendanceRecord | null;
	/** Registros del día actual */
	todayRecords: IRHAttendanceRecord[];
	/** Paso 1: Ejecutar validaciones de geo + red + horario */
	runPreValidations: () => Promise<boolean>;
	/** Paso 2: Procesar resultado del QR escaneado */
	handleQRScanned: (scannedCode: string) => void;
	/** Cancelar escaneo */
	cancelScan: () => void;
	/** Limpiar validaciones */
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

	// Filtrar registros del día
	const todayRecords = useMemo(() => {
		const todayStr = new Date().toISOString().split('T')[0];
		return records.filter((r) => r.timestamp.startsWith(todayStr));
	}, [records]);

	const lastRecord = todayRecords.length > 0 ? todayRecords[0] : null;
	const nextPunchType: TRHPunchType = lastRecord?.type === 'entry' ? 'exit' : 'entry';

	// ── Paso 1: Pre-validaciones (geo + red + horario) ─────
	const runPreValidations = useCallback(async (): Promise<boolean> => {
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

			// Validar red
			const netResult = await networkValidation.validate(config.authorizedPublicIP);
			validationResult.network = netResult;

			// Evaluar resultado total de pre-validaciones
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
	}, [config, holidays, geoValidation, networkValidation, dispatch]);

	// ── Paso 2: Manejar QR escaneado ───────────────────────
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
				// ¡Registrar marcación!
				const record: IRHAttendanceRecord = {
					id: generateId(),
					userId: user?.id ?? 0,
					userName: user?.first_name ?? 'Usuario',
					type: nextPunchType,
					timestamp: new Date().toISOString(),
					latitude: validations?.geolocation?.detectedLat ?? 0,
					longitude: validations?.geolocation?.detectedLng ?? 0,
					publicIP: validations?.network?.detectedIP ?? '',
					qrCodeScanned: scannedCode,
					validations: updatedValidations,
				};
				dispatch(addRecord(record));
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
		runPreValidations,
		handleQRScanned,
		cancelScan,
		resetValidations,
	};
}

export default useRelojControl;
