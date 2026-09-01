import { useCallback, useEffect, useRef, useState } from 'react';
import type { EquipmentType, ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import { useAppDispatch } from '@/store';
import { fetchValidationRulesByType } from '@/store/slices/technicalReviews';

const SUPPORTED_EQUIPMENT_TYPES = new Set<EquipmentType>(['notebook', 'desktop']);

interface UseReviewValidationSchemaParams {
	equipmentType: string;
	branchId: number | null;
	subsidiaryId: number | null;
}

interface ReviewValidationSchemaState {
	schema: ITechnicalReviewSchema | null;
	isLoading: boolean;
	error: string | null;
	retry: () => void;
}

const useReviewValidationSchema = ({
	equipmentType,
	branchId,
	subsidiaryId,
}: UseReviewValidationSchemaParams): ReviewValidationSchemaState => {
	const dispatch = useAppDispatch();
	const [schema, setSchema] = useState<ITechnicalReviewSchema | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [retryVersion, setRetryVersion] = useState(0);
	const requestIdRef = useRef(0);
	const normalizedType = equipmentType.toLowerCase() as EquipmentType;

	const retry = useCallback(() => setRetryVersion((version) => version + 1), []);

	useEffect(() => {
		if (!SUPPORTED_EQUIPMENT_TYPES.has(normalizedType) || (!branchId && !subsidiaryId)) {
			setSchema(null);
			// Sin sucursal ni subsidiaría no hay a quién pedirle el schema. El formulario
			// sigue siendo usable con el respaldo local, pero el técnico debe saber que
			// los campos que dependen del backend no van a aparecer, en vez de no ver nada.
			setError(
				SUPPORTED_EQUIPMENT_TYPES.has(normalizedType) && !branchId && !subsidiaryId
					? 'Sin sucursal o subsidiaría activa no se pueden cargar los campos publicados por el backend. Se muestran las opciones locales.'
					: null,
			);
			setIsLoading(false);
			return () => undefined;
		}

		const requestId = requestIdRef.current + 1;
		requestIdRef.current = requestId;
		let cancelled = false;
		setSchema(null);
		setError(null);
		setIsLoading(true);

		void dispatch(
			fetchValidationRulesByType({ branchId, subsidiaryId, equipmentType: normalizedType }),
		)
			.unwrap()
			.then((result) => {
				if (!cancelled && requestId === requestIdRef.current) setSchema(result);
			})
			.catch((reason: unknown) => {
				if (cancelled || requestId !== requestIdRef.current) return;
				setError(
					typeof reason === 'string'
						? reason
						: 'No se pudo cargar el schema del formulario.',
				);
			})
			.finally(() => {
				if (!cancelled && requestId === requestIdRef.current) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [branchId, dispatch, normalizedType, retryVersion, subsidiaryId]);

	return { schema, isLoading, error, retry };
};

export default useReviewValidationSchema;
