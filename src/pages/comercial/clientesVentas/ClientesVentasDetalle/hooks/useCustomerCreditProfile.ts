import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import type {
	IDeferredPaymentCreditProfile,
	IDeferredPaymentsSummary,
	UpdateDeferredPaymentCreditProfilePayload,
} from '@/interface/deferredPayments.interface';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import getDeferredPaymentErrorMessage from '@/utils/deferredPaymentsError.utils';
import { CreditProfileSchema, type CreditProfileFormValues } from '../types';

const DEFAULT_PAYMENT_TERM_DAYS = 30;

interface IdentityBoundValue<T> {
	identity: string;
	value: T;
}

const toWholeCLP = (creditLimit: string | null | undefined): string => {
	if (!creditLimit) return '';
	const numericCreditLimit = Number(creditLimit);
	return Number.isFinite(numericCreditLimit)
		? String(Math.round(numericCreditLimit))
		: creditLimit;
};

const toFormValues = (profile: IDeferredPaymentCreditProfile | null): CreditProfileFormValues => ({
	is_active: profile?.id === null ? true : (profile?.is_active ?? true),
	payment_term_days: String(profile?.payment_term_days ?? DEFAULT_PAYMENT_TERM_DAYS),
	credit_limit: toWholeCLP(profile?.credit_limit),
	collection_email: profile?.collection_email ?? '',
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
	const identity = `${subsidiaryId ?? 'none'}:${customerSaleId}`;
	const identityRef = useRef(identity);
	const mountedRef = useRef(true);
	const loadRequestIdRef = useRef(0);
	const saveRequestIdRef = useRef(0);
	const saveControllerRef = useRef<AbortController | null>(null);
	const [profileState, setProfileState] = useState<
		IdentityBoundValue<IDeferredPaymentCreditProfile | null>
	>({ identity, value: null });
	const [summaryState, setSummaryState] = useState<
		IdentityBoundValue<IDeferredPaymentsSummary | null>
	>({ identity, value: null });
	const [loadingIdentity, setLoadingIdentity] = useState<string | null>(null);
	const [loadErrorState, setLoadErrorState] = useState<IdentityBoundValue<string> | null>(null);
	const [saveErrorState, setSaveErrorState] = useState<IdentityBoundValue<string> | null>(null);
	const [editingIdentity, setEditingIdentity] = useState<string | null>(null);
	const [savingIdentity, setSavingIdentity] = useState<string | null>(null);

	if (identityRef.current !== identity) identityRef.current = identity;

	const profile = profileState.identity === identity ? profileState.value : null;
	const summary = summaryState.identity === identity ? summaryState.value : null;
	const isLoading = loadingIdentity === identity;
	const loadError = loadErrorState?.identity === identity ? loadErrorState.value : null;
	const saveError = saveErrorState?.identity === identity ? saveErrorState.value : null;
	const isEditing = editingIdentity === identity;
	const isSaving = savingIdentity === identity;

	const outstandingAmount =
		profile?.id !== null && profile?.is_active ? (summary?.total_outstanding ?? null) : null;

	const initialValues = useMemo(() => toFormValues(profile), [profile]);

	const loadProfile = useCallback(
		async (signal?: AbortSignal) => {
			const requestIdentity = identity;
			if (subsidiaryId === null) {
				return;
			}

			const requestId = loadRequestIdRef.current + 1;
			loadRequestIdRef.current = requestId;
			setLoadingIdentity(requestIdentity);
			setLoadErrorState(null);
			try {
				const loadedProfile = await deferredPaymentsService.getCreditProfile(
					subsidiaryId,
					customerSaleId,
					signal,
				);
				const loadedSummary =
					loadedProfile.id !== null &&
					loadedProfile.is_active &&
					loadedProfile.credit_limit !== null
						? await deferredPaymentsService.getSummary(
								subsidiaryId,
								{ customer_sale_id: customerSaleId },
								signal,
							)
						: null;
				if (
					!mountedRef.current ||
					requestIdentity !== identityRef.current ||
					requestId !== loadRequestIdRef.current
				)
					return;
				setProfileState({ identity: requestIdentity, value: loadedProfile });
				setSummaryState({ identity: requestIdentity, value: loadedSummary });
			} catch (error: unknown) {
				if (
					signal?.aborted ||
					!mountedRef.current ||
					requestIdentity !== identityRef.current ||
					requestId !== loadRequestIdRef.current
				)
					return;
				setProfileState({ identity: requestIdentity, value: null });
				setSummaryState({ identity: requestIdentity, value: null });
				setLoadErrorState({
					identity: requestIdentity,
					value: getDeferredPaymentErrorMessage(
						error,
						'No se pudo cargar el perfil de crédito',
					),
				});
			} finally {
				if (
					!signal?.aborted &&
					mountedRef.current &&
					requestIdentity === identityRef.current &&
					requestId === loadRequestIdRef.current
				) {
					setLoadingIdentity(null);
				}
			}
		},
		[customerSaleId, identity, subsidiaryId],
	);

	const formik = useFormik<CreditProfileFormValues>({
		enableReinitialize: true,
		initialValues,
		validationSchema: CreditProfileSchema,
		onSubmit: async (values) => {
			const saveIdentity = identity;
			if (subsidiaryId === null || savingIdentity === saveIdentity) return;
			const requestId = saveRequestIdRef.current + 1;
			const controller = new AbortController();
			saveRequestIdRef.current = requestId;
			saveControllerRef.current?.abort();
			saveControllerRef.current = controller;
			setSavingIdentity(saveIdentity);
			setSaveErrorState(null);
			const payload: UpdateDeferredPaymentCreditProfilePayload = {
				is_active: values.is_active,
				payment_term_days: Number(values.payment_term_days),
				credit_limit: values.credit_limit.trim() || null,
				collection_email: values.collection_email.trim() || null,
				notes: values.notes.trim() || null,
			};
			try {
				const savedProfile = await deferredPaymentsService.updateCreditProfile(
					subsidiaryId,
					customerSaleId,
					payload,
					controller.signal,
				);
				if (
					!mountedRef.current ||
					saveIdentity !== identityRef.current ||
					requestId !== saveRequestIdRef.current
				)
					return;
				setProfileState({ identity: saveIdentity, value: savedProfile });
				setEditingIdentity(null);
				toast.success('Condiciones de crédito guardadas correctamente');
			} catch (error: unknown) {
				if (
					controller.signal.aborted ||
					!mountedRef.current ||
					saveIdentity !== identityRef.current ||
					requestId !== saveRequestIdRef.current
				)
					return;
				const message = getDeferredPaymentErrorMessage(
					error,
					'No se pudieron guardar las condiciones de crédito',
				);
				setSaveErrorState({ identity: saveIdentity, value: message });
				toast.error(message);
			} finally {
				if (
					mountedRef.current &&
					saveIdentity === identityRef.current &&
					requestId === saveRequestIdRef.current
				) {
					saveControllerRef.current = null;
					setSavingIdentity(null);
				}
			}
		},
	});
	const { resetForm } = formik;

	useEffect(() => {
		setProfileState({ identity, value: null });
		setSummaryState({ identity, value: null });
		setLoadingIdentity(null);
		setLoadErrorState(null);
		setSaveErrorState(null);
		setEditingIdentity(null);
		setSavingIdentity(null);
		saveControllerRef.current?.abort();
		loadRequestIdRef.current += 1;
		saveRequestIdRef.current += 1;
		resetForm({ values: toFormValues(null) });
	}, [identity, resetForm]);

	useEffect(() => {
		if (subsidiaryId === null) return undefined;
		const controller = new AbortController();
		loadProfile(controller.signal).catch(() => undefined);
		return () => controller.abort();
	}, [loadProfile, subsidiaryId]);

	useEffect(
		() => () => {
			mountedRef.current = false;
			saveControllerRef.current?.abort();
			saveRequestIdRef.current += 1;
		},
		[],
	);

	const startEditing = useCallback(() => {
		setSaveErrorState(null);
		formik.resetForm({ values: toFormValues(profile) });
		setEditingIdentity(identity);
	}, [formik, identity, profile]);

	const cancelEditing = useCallback(() => {
		formik.resetForm({ values: toFormValues(profile) });
		setSaveErrorState(null);
		setEditingIdentity(null);
	}, [formik, profile]);

	return {
		profile,
		outstandingAmount,
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
