// src/pages/recursosHumanos/hooks/useGeolocationValidation.ts
import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { setGeoPermission } from '@/store/slices/recursosHumanos/rhSlice';
import type { IRHGeolocationValidation, TRHPermissionStatus } from '@/interface/rh.interface';

/* ======================================================
   HAVERSINE DISTANCE (metros)
   ====================================================== */

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6_371_000; // Radio de la Tierra en metros
	const toRad = (deg: number) => (deg * Math.PI) / 180;

	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

/* ======================================================
   HOOK
   ====================================================== */

interface UseGeolocationValidationReturn {
	permissionStatus: TRHPermissionStatus;
	isValidating: boolean;
	result: IRHGeolocationValidation | null;
	error: string | null;
	validate: (
		targetLat: number,
		targetLng: number,
		radiusMeters: number,
	) => Promise<IRHGeolocationValidation>;
	checkPermission: () => Promise<void>;
}

export function useGeolocationValidation(): UseGeolocationValidationReturn {
	const dispatch = useAppDispatch();
	const [permissionStatus, setPermissionStatus] = useState<TRHPermissionStatus>('prompt');
	const [isValidating, setIsValidating] = useState(false);
	const [result, setResult] = useState<IRHGeolocationValidation | null>(null);
	const [error, setError] = useState<string | null>(null);

	const checkPermission = useCallback(async () => {
		if (!navigator.geolocation) {
			setPermissionStatus('unavailable');
			dispatch(setGeoPermission('unavailable'));
			return;
		}

		try {
			const status = await navigator.permissions.query({ name: 'geolocation' });
			const mapped = status.state as TRHPermissionStatus;
			setPermissionStatus(mapped);
			dispatch(setGeoPermission(mapped));

			status.addEventListener('change', () => {
				const newStatus = status.state as TRHPermissionStatus;
				setPermissionStatus(newStatus);
				dispatch(setGeoPermission(newStatus));
			});
		} catch {
			setPermissionStatus('prompt');
		}
	}, [dispatch]);

	useEffect(() => {
		checkPermission();
	}, [checkPermission]);

	const validate = useCallback(
		(
			targetLat: number,
			targetLng: number,
			radiusMeters: number,
		): Promise<IRHGeolocationValidation> => {
			return new Promise((resolve, reject) => {
				if (!navigator.geolocation) {
					const err = 'Geolocalización no disponible en este navegador';
					setError(err);
					reject(new Error(err));
					return;
				}

				setIsValidating(true);
				setError(null);

				navigator.geolocation.getCurrentPosition(
					(position) => {
						const { latitude, longitude } = position.coords;
						const distance = haversineDistance(
							latitude,
							longitude,
							targetLat,
							targetLng,
						);
						const withinRadius = distance <= radiusMeters;

						const validation: IRHGeolocationValidation = {
							passed: withinRadius,
							distanceMeters: Math.round(distance),
							detectedLat: latitude,
							detectedLng: longitude,
							message: withinRadius
								? `Ubicación válida (${Math.round(distance)}m de la sucursal)`
								: `Fuera de rango: estás a ${Math.round(distance)}m, máximo ${radiusMeters}m`,
						};

						setResult(validation);
						setIsValidating(false);
						setPermissionStatus('granted');
						dispatch(setGeoPermission('granted'));
						resolve(validation);
					},
					(geoError) => {
						setIsValidating(false);
						let msg: string;

						switch (geoError.code) {
							case geoError.PERMISSION_DENIED:
								msg =
									'Permiso de ubicación denegado. Habilítalo en la barra de direcciones.';
								setPermissionStatus('denied');
								dispatch(setGeoPermission('denied'));
								break;
							case geoError.POSITION_UNAVAILABLE:
								msg = 'Información de ubicación no disponible.';
								break;
							case geoError.TIMEOUT:
								msg = 'Tiempo de espera agotado al obtener ubicación.';
								break;
							default:
								msg = 'Error desconocido al obtener ubicación.';
						}

						setError(msg);
						reject(new Error(msg));
					},
					{
						enableHighAccuracy: true,
						timeout: 10000,
						maximumAge: 0,
					},
				);
			});
		},
		[dispatch],
	);

	return { permissionStatus, isValidating, result, error, validate, checkPermission };
}

export default useGeolocationValidation;
