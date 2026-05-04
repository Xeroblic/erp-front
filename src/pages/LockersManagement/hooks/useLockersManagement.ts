import { useState, useEffect, useCallback } from 'react';
import lockersInternalService, {
	ILockerInternal,
	ILockerLocation,
	IServiceOrder,
} from '@/services/lockersInternalService';
import { toast } from '@/utils/toast.utils';

/**
 * Genera un PIN aleatorio de 4 dígitos que no se repita
 * con los PINs activos de los casilleros actuales.
 */
const generateUniquePin = (existingLockers: ILockerInternal[]): string => {
	const existingPins = new Set(
		existingLockers.map((l) => l.locker_pin).filter(Boolean),
	);
	let pin: string;
	do {
		pin = String(Math.floor(1000 + Math.random() * 9000));
	} while (existingPins.has(pin));
	return pin;
};

export const useLockersManagement = () => {
	// --- Datos principales ---
	const [locations, setLocations] = useState<ILockerLocation[]>([]);
	const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
	const [lockers, setLockers] = useState<ILockerInternal[]>([]);
	const [serviceOrders, setServiceOrders] = useState<IServiceOrder[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// --- Modal de acción ---
	const [selectedLocker, setSelectedLocker] = useState<ILockerInternal | null>(null);
	const [actionType, setActionType] = useState<'withdraw' | 'dropoff' | 'reset' | 'ready' | null>(null);
	const [isActionLoading, setIsActionLoading] = useState(false);

	// --- Modal de éxito con PIN ---
	const [successPin, setSuccessPin] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// --- Cargar ubicaciones ---
	const fetchLocations = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const response = await lockersInternalService.getLocations();
			const locs = Array.isArray(response) ? response : (response as any)?.data ?? [];
			setLocations(locs);

			// Si hay ubicaciones, seleccionar la primera por defecto
			if (locs.length > 0 && !selectedLocationId) {
				setSelectedLocationId(locs[0].id);
			}
		} catch (err: any) {
			const msg = err?.response?.data?.message || 'Error al cargar ubicaciones';
			setError(msg);
			toast.error(msg);
		} finally {
			setIsLoading(false);
		}
	}, [selectedLocationId]);

	// --- Cargar casilleros de la ubicación seleccionada ---
	const fetchLockers = useCallback(async () => {
		if (!selectedLocationId) return;

		try {
			setIsLoading(true);
			setError(null);
			const response = await lockersInternalService.getLockersByLocation(selectedLocationId);
			const lockersData = Array.isArray(response) ? response : (response as any)?.data ?? [];
			setLockers(lockersData);
		} catch (err: any) {
			const msg = err?.response?.data?.message || 'Error al cargar casilleros';
			setError(msg);
			toast.error(msg);
		} finally {
			setIsLoading(false);
		}
	}, [selectedLocationId]);

	// --- Cargar órdenes de servicio ---
	const fetchServiceOrders = useCallback(async () => {
		try {
			const response = await lockersInternalService.getServiceOrders();
			const orders = Array.isArray(response) ? response : (response as any)?.data ?? [];
			setServiceOrders(orders);
		} catch {
			// No bloquear la UI si falla la carga de órdenes
		}
	}, []);

	useEffect(() => {
		fetchLocations();
		fetchServiceOrders();
	}, [fetchLocations, fetchServiceOrders]);

	useEffect(() => {
		if (selectedLocationId) {
			fetchLockers();
		}
	}, [selectedLocationId, fetchLockers]);

	// --- Cambiar ubicación ---
	const changeLocation = useCallback((locationId: number) => {
		setSelectedLocationId(locationId);
	}, []);

	// --- Abrir / cerrar modal de acción ---
	const openAction = useCallback(
		(locker: ILockerInternal, type: 'withdraw' | 'dropoff' | 'reset' | 'ready') => {
			setSelectedLocker(locker);
			setActionType(type);
		},
		[],
	);

	const closeAction = useCallback(() => {
		setSelectedLocker(null);
		setActionType(null);
	}, []);

	// --- Escaneo de QR ---
	const handleScanQR = useCallback(async (token: string) => {
		try {
			setIsActionLoading(true);
			const response = await lockersInternalService.getPrivateInfo(token);
			const locker = (response as any)?.data ?? response;
			
			if (locker) {
				setSelectedLocker(locker);
				// Al escanear, si está disponible, asumimos depósito. Si está ocupado, retiro.
				if (locker.status === 'available' || locker.status === 'Disponible') {
					setActionType('dropoff');
				} else {
					setActionType('withdraw');
				}
				return true;
			}
			return false;
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Error al procesar el código QR.');
			return false;
		} finally {
			setIsActionLoading(false);
		}
	}, []);

	// --- Fase 2: Técnico retira equipo (Withdraw / Pick Off) ---
	// El backend captura el PIN antiguo ANTES de resetear y lo devuelve como pin_to_open
	const handleWithdraw = useCallback(
		async (serviceOrderId: number) => {
			if (!selectedLocker) return;
			setIsActionLoading(true);
			try {
				const response = await lockersInternalService.techWithdraw({
					service_order_id: serviceOrderId,
				});

				// El backend devuelve pin_to_open con el PIN antiguo para abrir la puerta
				const pinToOpen = (response as any)?.pin_to_open || null;
				setSuccessPin(pinToOpen);
				setSuccessMessage('Equipo retirado. Usa este PIN para abrir el casillero:');
				closeAction();
				fetchLockers();
				fetchServiceOrders();
			} catch (err: any) {
				toast.error(err?.response?.data?.message || 'Error al retirar el equipo.');
			} finally {
				setIsActionLoading(false);
			}
		},
		[selectedLocker, closeAction, fetchLockers, fetchServiceOrders],
	);

	// --- Fase 3: Técnico deposita equipo reparado (Drop-off) ---
	const handleDropOff = useCallback(
		async (serviceOrderId: number) => {
			if (!selectedLocker) return;
			setIsActionLoading(true);
			try {
				const newPin = generateUniquePin(lockers);
				await lockersInternalService.techDropOff({
					locker_id: selectedLocker.id,
					service_order_id: serviceOrderId,
					new_locker_pin: newPin,
				});
				setSuccessPin(newPin);
				setSuccessMessage('Equipo depositado. El nuevo PIN del casillero es:');
				closeAction();
				fetchLockers();
				fetchServiceOrders();
			} catch (err: any) {
				toast.error(err?.response?.data?.message || 'Error al depositar el equipo.');
			} finally {
				setIsActionLoading(false);
			}
		},
		[selectedLocker, lockers, closeAction, fetchLockers, fetchServiceOrders],
	);

	// --- Fase 5: Reset de casillero ---
	const handleReset = useCallback(async () => {
		if (!selectedLocker) return;
		setIsActionLoading(true);
		try {
			const newPin = generateUniquePin(lockers);
			await lockersInternalService.resetLocker({
				locker_id: selectedLocker.id,
				new_locker_pin: newPin,
			});
			setSuccessPin(newPin);
			setSuccessMessage('Casillero reseteado. El nuevo PIN es:');
			closeAction();
			fetchLockers();
		} catch (err: any) {
			toast.error(err?.response?.data?.message || 'Error al resetear el casillero.');
		} finally {
			setIsActionLoading(false);
		}
	}, [selectedLocker, lockers, closeAction, fetchLockers]);

	// --- Marcar listo para retiro del cliente ---
	const handleSetReadyForPickup = useCallback(
		async (serviceOrderId: number, pinManual: string) => {
			setIsActionLoading(true);
			try {
				await lockersInternalService.setReadyForPickup({
					service_order_id: serviceOrderId,
					pin_manual: pinManual,
				});
				toast.success('Orden marcada como lista para retiro.');
				closeAction();
				fetchServiceOrders();
			} catch (err: any) {
				toast.error(
					err?.response?.data?.message || 'Error al marcar como lista para retiro.',
				);
			} finally {
				setIsActionLoading(false);
			}
		},
		[closeAction, fetchServiceOrders],
	);

	return {
		// Datos
		locations,
		selectedLocationId,
		lockers,
		serviceOrders,
		isLoading,
		error,

		// Modal
		selectedLocker,
		actionType,
		isActionLoading,
		successPin,
		successMessage,

		// Acciones
		setSelectedLocker,
		setSuccessPin,
		changeLocation,
		fetchLockers,
		fetchServiceOrders,
		openAction,
		closeAction,
		handleWithdraw,
		handleDropOff,
		handleReset,
		handleSetReadyForPickup,
		handleScanQR,
	};
};
