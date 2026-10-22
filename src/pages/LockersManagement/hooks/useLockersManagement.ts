import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import lockersInternalService from '@/services/lockers/lockersInternalService';
import { ILockerInternal, ILockerLocation, IServiceOrder } from '@/interface/lockers.interface';
import { resolveLockerError } from '@/utils/lockerErrors.util';
import { TLockerAction } from '../types';

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
	const [actionType, setActionType] = useState<TLockerAction | null>(null);
	const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
	const [isActionLoading, setIsActionLoading] = useState(false);

	// --- Modal de éxito con PIN ---
	const [successPin, setSuccessPin] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Filial de la ubicación activa: la usan los guards de las acciones del técnico.
	const selectedSubsidiaryId = useMemo(
		() => locations.find((loc) => loc.id === selectedLocationId)?.subsidiary_id ?? null,
		[locations, selectedLocationId],
	);

	// --- Cargar ubicaciones ---
	const fetchLocations = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const locs = await lockersInternalService.getLocations();
			setLocations(locs);
			// Si hay ubicaciones, seleccionar la primera por defecto
			setSelectedLocationId((current) => current ?? locs[0]?.id ?? null);
		} catch (err: unknown) {
			const msg = resolveLockerError(err, 'Error al cargar ubicaciones').message;
			setError(msg);
			toast.error(msg);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// --- Cargar casilleros de la ubicación seleccionada ---
	const fetchLockers = useCallback(async () => {
		if (!selectedLocationId) return;

		try {
			setIsLoading(true);
			setError(null);
			setLockers(await lockersInternalService.getLockersByLocation(selectedLocationId));
		} catch (err: unknown) {
			const msg = resolveLockerError(err, 'Error al cargar casilleros').message;
			setError(msg);
			toast.error(msg);
		} finally {
			setIsLoading(false);
		}
	}, [selectedLocationId]);

	// --- Cargar órdenes de servicio ---
	const fetchServiceOrders = useCallback(async () => {
		try {
			setServiceOrders(await lockersInternalService.getServiceOrders());
		} catch {
			// No bloquear la UI si falla la carga de órdenes
		}
	}, []);

	useEffect(() => {
		void fetchLocations();
		void fetchServiceOrders();
	}, [fetchLocations, fetchServiceOrders]);

	useEffect(() => {
		if (selectedLocationId) {
			void fetchLockers();
		}
	}, [selectedLocationId, fetchLockers]);

	// --- Cambiar ubicación ---
	const changeLocation = useCallback((locationId: number) => {
		setSelectedLocationId(locationId);
	}, []);

	// --- Abrir / cerrar modal de acción ---
	const openAction = useCallback(
		(locker: ILockerInternal, type: TLockerAction, orderId?: number) => {
			setSelectedLocker(locker);
			setActionType(type);
			setSelectedOrderId(orderId ?? null);
		},
		[],
	);

	const closeAction = useCallback(() => {
		setSelectedLocker(null);
		setActionType(null);
		setSelectedOrderId(null);
	}, []);

	// El PIN nuevo lo genera el backend: el técnico lo fija en el candado.
	const showNewPin = useCallback((pin: string | null, message: string) => {
		if (pin) {
			setSuccessPin(pin);
			setSuccessMessage(message);
		} else {
			toast.success(message.replace(/:$/, '.'));
		}
	}, []);

	// --- Escaneo de QR ---
	const handleScanQR = useCallback(async (token: string) => {
		try {
			setIsActionLoading(true);
			const locker = await lockersInternalService.getPrivateInfo(token);

			if (locker.status === 'available') {
				setSelectedLocker(locker);
				setActionType('dropoff');
				return true;
			}
			if (locker.status === 'occupied') {
				setSelectedLocker(locker);
				setActionType('withdraw');
				setSelectedOrderId(locker.active_service_order?.id ?? null);
				return true;
			}
			if (locker.status === 'quarantine') {
				setSelectedLocker(locker);
				setActionType('reset');
				return true;
			}

			toast.info(`El casillero Nº ${locker.number} está listo para retiro del cliente.`);
			return true;
		} catch (err: unknown) {
			toast.error(resolveLockerError(err, 'Error al procesar el código QR.').message);
			return false;
		} finally {
			setIsActionLoading(false);
		}
	}, []);

	// --- Técnico retira equipo (withdraw): el casillero queda disponible con PIN nuevo ---
	const handleWithdraw = useCallback(
		async (serviceOrderId: number) => {
			setIsActionLoading(true);
			try {
				const response = await lockersInternalService.techWithdraw({
					service_order_id: serviceOrderId,
				});
				showNewPin(
					response.new_locker_pin,
					'Equipo retirado. Fija este nuevo PIN en el candado del casillero:',
				);
				closeAction();
				void fetchLockers();
				void fetchServiceOrders();
			} catch (err: unknown) {
				toast.error(resolveLockerError(err, 'Error al retirar el equipo.').message);
			} finally {
				setIsActionLoading(false);
			}
		},
		[showNewPin, closeAction, fetchLockers, fetchServiceOrders],
	);

	// --- Técnico deja el equipo (drop-off): se genera la palabra clave y se avisa al cliente ---
	const handleDropOff = useCallback(
		async (lockerId: number, serviceOrderId: number) => {
			setIsActionLoading(true);
			try {
				const response = await lockersInternalService.techDropOff({
					locker_id: lockerId,
					service_order_id: serviceOrderId,
				});
				showNewPin(
					response.new_locker_pin,
					'Equipo depositado y palabra clave enviada al cliente. Fija este PIN en el candado:',
				);
				closeAction();
				void fetchLockers();
				void fetchServiceOrders();
			} catch (err: unknown) {
				toast.error(resolveLockerError(err, 'Error al depositar el equipo.').message);
			} finally {
				setIsActionLoading(false);
			}
		},
		[showNewPin, closeAction, fetchLockers, fetchServiceOrders],
	);

	// --- Reset de un casillero en cuarentena ---
	const handleReset = useCallback(
		async (lockerId: number) => {
			setIsActionLoading(true);
			try {
				const response = await lockersInternalService.resetLocker({ locker_id: lockerId });
				showNewPin(
					response.new_locker_pin,
					'Casillero reseteado. Fija este nuevo PIN en el candado:',
				);
				closeAction();
				void fetchLockers();
			} catch (err: unknown) {
				toast.error(resolveLockerError(err, 'Error al resetear el casillero.').message);
			} finally {
				setIsActionLoading(false);
			}
		},
		[showNewPin, closeAction, fetchLockers],
	);

	return {
		// Datos
		locations,
		selectedLocationId,
		selectedSubsidiaryId,
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
		selectedOrderId,

		// Acciones
		setSuccessPin,
		changeLocation,
		fetchLockers,
		fetchServiceOrders,
		openAction,
		closeAction,
		handleWithdraw,
		handleDropOff,
		handleReset,
		handleScanQR,
	};
};
