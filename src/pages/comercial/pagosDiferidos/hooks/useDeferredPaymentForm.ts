import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import type {
	CreateDeferredPaymentPayload,
	IDeferredPaymentDocument,
} from '@/interface/deferredPayments.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
import USE_DEFERRED_PAYMENTS_MOCK from '@/store/slices/deferredPayments/deferredPaymentsConfig';
import {
	clearDeferredPaymentMutation,
	createDeferredPayment,
	fetchDeferredPayments,
	fetchDeferredPaymentsSummary,
	updateDeferredPayment,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import {
	calculateDeferredPaymentEstimatedTotal,
	createDeferredPaymentInitialValues,
	DeferredPaymentDocumentSchema,
	type DeferredPaymentFormValues,
} from '../types';

export type DeferredPaymentFormMode = 'create' | 'edit';

interface UseDeferredPaymentFormProps {
	mode: DeferredPaymentFormMode;
	document?: IDeferredPaymentDocument | null;
	paymentTermDays?: number;
	onSuccess?: (document: IDeferredPaymentDocument) => void;
}

const DEFAULT_PAYMENT_TERM_DAYS = 30;

const formatLocalDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

export const addDaysToDateOnly = (dateOnly: string, days: number): string => {
	const [year, month, day] = dateOnly.split('-').map(Number);
	if (!year || !month || !day) return dateOnly;
	const date = new Date(year, month - 1, day);
	date.setDate(date.getDate() + Math.max(0, days));
	return formatLocalDate(date);
};

export const mapDeferredPaymentDocumentToForm = (
	document: IDeferredPaymentDocument,
): DeferredPaymentFormValues => ({
	customer_sale_id: document.customer.id,
	document_type: document.document_type,
	document_number: document.document_number,
	issue_date: document.issue_date,
	due_date: document.due_date,
	purchase_order: document.purchase_order,
	notes: document.notes,
	assignee_ids: document.assignees.map((assignee) => assignee.id),
	items: document.items.map((item) => ({
		client_key: `deferred-item-existing-${item.id}`,
		product_id: null,
		code: item.code,
		description: item.description,
		quantity: item.quantity,
		unit_price: Number(item.unit_price),
		serials: [...item.serials],
	})),
});

export const mapDeferredPaymentFormToPayload = (
	values: DeferredPaymentFormValues,
	currentUserId?: number,
): CreateDeferredPaymentPayload | null => {
	if (values.customer_sale_id === null) return null;
	return {
		...values,
		customer_sale_id: values.customer_sale_id,
		assignee_ids:
			values.assignee_ids.length === 0 && currentUserId && currentUserId > 0
				? [currentUserId]
				: values.assignee_ids,
		document_number: values.document_number.trim(),
		purchase_order: values.purchase_order?.trim() || null,
		notes: values.notes?.trim() || null,
		items: values.items.map((item) => ({
			product_id: null,
			code: item.code.trim(),
			description: item.description.trim(),
			quantity: item.quantity,
			unit_price: item.unit_price,
			serials: item.serials.map((serial) => serial.trim()),
		})),
	};
};

const useDeferredPaymentForm = ({
	mode,
	document = null,
	paymentTermDays = DEFAULT_PAYMENT_TERM_DAYS,
	onSuccess,
}: UseDeferredPaymentFormProps) => {
	const dispatch = useAppDispatch();
	const { subsidiaryId } = useCurrentBranch();
	const currentUserId = useAppSelector((state) => state.auth?.user?.id);
	const creating = useAppSelector((state) => state.deferredPayments.creating);
	const updating = useAppSelector((state) => state.deferredPayments.updating);
	const creditLimitExceeded = useAppSelector(
		(state) => state.deferredPayments.lastMutationCreditLimitExceeded,
	);
	const filters = useAppSelector((state) => state.deferredPayments.filters);
	const submittingRef = useRef(false);
	const effectiveSubsidiaryId = subsidiaryId ?? (USE_DEFERRED_PAYMENTS_MOCK ? 0 : null);
	const today = useMemo(() => formatLocalDate(new Date()), []);
	const initialPaymentTermDays = useRef(paymentTermDays).current;
	const initialValues = useMemo(
		() =>
			mode === 'edit' && document
				? mapDeferredPaymentDocumentToForm(document)
				: {
						...createDeferredPaymentInitialValues(today),
						due_date: addDaysToDateOnly(today, initialPaymentTermDays),
					},
		[document, initialPaymentTermDays, mode, today],
	);
	const isPaidEdit = mode === 'edit' && document?.status === 'paid';

	const formik = useFormik<DeferredPaymentFormValues>({
		initialValues,
		validationSchema: DeferredPaymentDocumentSchema,
		enableReinitialize: true,
		onSubmit: async (values) => {
			if (submittingRef.current || effectiveSubsidiaryId === null || isPaidEdit) return;
			const payload = mapDeferredPaymentFormToPayload(values, currentUserId);
			if (!payload) return;

			submittingRef.current = true;
			try {
				const result =
					mode === 'edit' && document
						? await dispatch(
								updateDeferredPayment({
									subsidiaryId: effectiveSubsidiaryId,
									documentId: document.id,
									payload,
								}),
							).unwrap()
						: await dispatch(
								createDeferredPayment({
									subsidiaryId: effectiveSubsidiaryId,
									payload,
								}),
							).unwrap();
				await Promise.all([
					dispatch(
						fetchDeferredPayments({ subsidiaryId: effectiveSubsidiaryId, filters }),
					),
					dispatch(fetchDeferredPaymentsSummary({ subsidiaryId: effectiveSubsidiaryId })),
				]);
				onSuccess?.(result.document);
				toast.success(
					mode === 'edit'
						? 'Documento actualizado correctamente'
						: 'Documento creado correctamente',
				);
			} catch (submitError: unknown) {
				const fallbackMessage =
					mode === 'edit'
						? 'No se pudo actualizar el documento de pago diferido'
						: 'No se pudo crear el documento de pago diferido';
				let message = fallbackMessage;
				if (typeof submitError === 'string' && submitError.trim()) {
					message = submitError;
				} else if (submitError instanceof Error && submitError.message) {
					message = submitError.message;
				}
				toast.error(message);
			} finally {
				submittingRef.current = false;
			}
		},
	});

	const previousPaymentTermDaysRef = useRef(paymentTermDays);
	useEffect(() => {
		if (mode !== 'create' || paymentTermDays === previousPaymentTermDaysRef.current) return;
		previousPaymentTermDaysRef.current = paymentTermDays;
		formik
			.setFieldValue(
				'due_date',
				addDaysToDateOnly(formik.values.issue_date, paymentTermDays),
				false,
			)
			.catch(() => undefined);
	}, [formik, mode, paymentTermDays]);

	const previousIssueDateRef = useRef(formik.values.issue_date);
	useEffect(() => {
		if (mode !== 'create' || formik.values.issue_date === previousIssueDateRef.current) return;
		previousIssueDateRef.current = formik.values.issue_date;
		formik
			.setFieldValue(
				'due_date',
				addDaysToDateOnly(formik.values.issue_date, paymentTermDays),
				false,
			)
			.catch(() => undefined);
	}, [formik, mode, paymentTermDays]);

	useEffect(
		() => () => {
			dispatch(clearDeferredPaymentMutation());
		},
		[dispatch],
	);

	const clearMutationFeedback = useCallback(() => {
		dispatch(clearDeferredPaymentMutation());
	}, [dispatch]);

	return {
		formik,
		estimatedTotal: calculateDeferredPaymentEstimatedTotal(formik.values.items),
		isSubmitting: formik.isSubmitting || creating || updating,
		isPaidEdit,
		hasDataContext: effectiveSubsidiaryId !== null,
		creditLimitExceeded,
		actions: { clearMutationFeedback },
	};
};

export default useDeferredPaymentForm;
