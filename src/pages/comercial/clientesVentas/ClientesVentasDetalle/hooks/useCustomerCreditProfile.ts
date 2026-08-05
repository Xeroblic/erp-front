import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import type {
	IDeferredPaymentCreditProfile,
	UpdateDeferredPaymentCreditProfilePayload,
} from '@/interface/deferredPayments.interface';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import { CreditProfileSchema, type CreditProfileFormValues } from '../types';

const DEFAULT_PAYMENT_TERM_DAYS = 30;

const toWholeCLP = (creditLimit: string | null | undefined): string => {
	if (!creditLimit) return '';
	const numericCreditLimit = Number(creditLimit);
	return Number.isFinite(numericCreditLimit)
		? String(Math.round(numericCreditLimit))
		: creditLimit;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
	if (error !== null && typeof error === 'object' && 'response' in error) {
		const { response } = error;
		if (response !== null && typeof response === 'object' && 'data' in response) {
			const { data } = response;
			if (data !== null && typeof data === 'object' && 'message' in data) {
				const { message } = data;
				if (typeof message === 'string' && message.trim()) return message;
			}
		}
	}
	return error instanceof Error && error.message ? error.message : fallback;
};

const toFormValues = (profile: IDeferredPaymentCreditProfile | null): CreditProfileFormValues => ({
	is_active: profile?.id === null ? true : (profile?.is_active ?? true),
	payment_term_days: String(profile?.payment_term_days ?? DEFAULT_PAYMENT_TERM_DAYS),
	credit_limit: toWholeCLP(profile?.credit_limit),
	notes: profile?.notes ?? '',
});

interface UseCustomerCreditProfileParams {
	customerSaleId: number;
	subsidiaryId: number | null;
}

const useCustomerCreditProfile = ({
	customerSaleId,
	subsidiaryId,
}: UseCustomerCreditProfileParams) => {
	const [profile, setProfile] = useState<IDeferredPaymentCreditProfile | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const requestIdRef = useRef(0);

	const initialValues = useMemo(() => toFormValues(profile), [profile]);

	const loadProfile = useCallback(
		async (signal?: AbortSignal) => {
			if (subsidiaryId === null) {
				requestIdRef.current += 1;
				setProfile(null);
				setLoadError(null);
				setIsLoading(false);
				return;
			}

			const requestId = requestIdRef.current + 1;
			requestIdRef.current = requestId;
			setIsLoading(true);
			setLoadError(null);
			try {
				const loadedProfile = await deferredPaymentsService.getCreditProfile(
					subsidiaryId,
					customerSaleId,
					signal,
				);
				if (requestId !== requestIdRef.current) return;
				setProfile(loadedProfile);
			} catch (error: unknown) {
				if (signal?.aborted || requestId !== requestIdRef.current) return;
				setProfile(null);
				setLoadError(getErrorMessage(error, 'No se pudo cargar el perfil de crédito'));
			} finally {
				if (!signal?.aborted && requestId === requestIdRef.current) setIsLoading(false);
			}
		},
		[customerSaleId, subsidiaryId],
	);

	useEffect(() => {
		const controller = new AbortController();
		loadProfile(controller.signal).catch(() => undefined);
		return () => controller.abort();
	}, [loadProfile]);

	const formik = useFormik<CreditProfileFormValues>({
		enableReinitialize: true,
		initialValues,
		validationSchema: CreditProfileSchema,
		onSubmit: async (values) => {
			if (subsidiaryId === null || isSaving) return;
			setIsSaving(true);
			setSaveError(null);
			const payload: UpdateDeferredPaymentCreditProfilePayload = {
				is_active: values.is_active,
				payment_term_days: Number(values.payment_term_days),
				credit_limit: values.credit_limit.trim() || null,
				notes: values.notes.trim() || null,
			};
			try {
				const savedProfile = await deferredPaymentsService.updateCreditProfile(
					subsidiaryId,
					customerSaleId,
					payload,
				);
				setProfile(savedProfile);
				setIsEditing(false);
				toast.success('Condiciones de crédito guardadas correctamente');
			} catch (error: unknown) {
				const message = getErrorMessage(
					error,
					'No se pudieron guardar las condiciones de crédito',
				);
				setSaveError(message);
				toast.error(message);
			} finally {
				setIsSaving(false);
			}
		},
	});

	const startEditing = useCallback(() => {
		setSaveError(null);
		formik.resetForm({ values: toFormValues(profile) });
		setIsEditing(true);
	}, [formik, profile]);

	const cancelEditing = useCallback(() => {
		formik.resetForm({ values: toFormValues(profile) });
		setSaveError(null);
		setIsEditing(false);
	}, [formik, profile]);

	return {
		profile,
		isLoading,
		loadError,
		saveError,
		isEditing,
		isSaving,
		formik,
		loadProfile,
		startEditing,
		cancelEditing,
	};
};

export default useCustomerCreditProfile;
