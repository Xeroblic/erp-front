import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import type {
	CreateDeferredPaymentPayload,
	IDeferredPaymentDocument,
} from '@/interface/deferredPayments.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { useAppDispatch, useAppSelector } from '@/store';
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
	deferredPaymentDocument?: IDeferredPaymentDocument | null;
	paymentTermDays?: number;
	isOpen?: boolean;
	onSuccess?: (document: IDeferredPaymentDocument) => void | boolean | Promise<void | boolean>;
}

interface AbortableRequest {
	abort: () => void;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
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
	deferredPaymentDocument: IDeferredPaymentDocument,
): DeferredPaymentFormValues => ({
	customer_sale_id: deferredPaymentDocument.customer.id,
	document_type: deferredPaymentDocument.document_type,
	document_number: deferredPaymentDocument.document_number,
	issue_date: deferredPaymentDocument.issue_date,
	due_date: deferredPaymentDocument.due_date,
	total_amount: Number(deferredPaymentDocument.total_amount),
	purchase_order: deferredPaymentDocument.purchase_order ?? null,
	notes: deferredPaymentDocument.notes ?? null,
	assignee_ids: deferredPaymentDocument.assignees.map((assignee) => assignee.id),
	items: deferredPaymentDocument.items.map((item) => ({
		// Clave efímera de Formik; el backend reemplaza los ítems y no conserva esta identidad.
		client_key: `deferred-item-existing-${item.id}`,
		product_id: null,
		code: item.code,
		description: item.description,
		quantity: item.quantity,
		unit_price: Number(item.unit_price),
		entered_unit_price: Number(item.unit_price),
		// El precio persistido ya es bruto; al editar no se debe reinterpretar como neto.
		calculates_vat: false,
		serials: [...item.serials],
	})),
});

export const mapDeferredPaymentFormToPayload = (
	values: DeferredPaymentFormValues,
	currentUserId?: number,
): CreateDeferredPaymentPayload | null => {
	if (values.customer_sale_id === null) return null;
	return {
		customer_sale_id: values.customer_sale_id,
		document_type: values.document_type,
		document_number: values.document_number.trim(),
		issue_date: values.issue_date,
		due_date: values.due_date,
		total_amount: Number(values.total_amount),
		purchase_order: values.purchase_order?.trim() || null,
		notes: values.notes?.trim() || null,
		assignee_ids:
			values.assignee_ids.length === 0 && currentUserId && currentUserId > 0
				? [currentUserId]
				: values.assignee_ids,
		items: values.items.map((item) => ({
			product_id: null,
			code: item.code.trim(),
			description: item.description.trim(),
			quantity: item.quantity,
			unit_price: Number(item.unit_price),
			serials: item.serials.map((serial) => serial.trim()),
		})),
	};
};

const useDeferredPaymentForm = ({
	mode,
	deferredPaymentDocument = null,
	paymentTermDays = DEFAULT_PAYMENT_TERM_DAYS,
	isOpen = true,
	onSuccess,
}: UseDeferredPaymentFormProps) => {
	const dispatch = useAppDispatch();
	const { subsidiaryId } = useCurrentBranch();
	const currentUserId = useAppSelector((state) => state.auth?.user?.id);
	const creating = useAppSelector((state) => state.deferredPayments.creating);
	const updating = useAppSelector((state) => state.deferredPayments.updating);
	const filters = useAppSelector((state) => state.deferredPayments.filters);
	const submittingRef = useRef(false);
	const dueDateManuallySetRef = useRef(false);
	const activeSubmissionRef = useRef<symbol | null>(null);
	const activeRequestsRef = useRef<AbortableRequest[]>([]);
	const effectiveSubsidiaryId = subsidiaryId;
	const latestSubsidiaryIdRef = useRef(effectiveSubsidiaryId);
	latestSubsidiaryIdRef.current = effectiveSubsidiaryId;
	const today = useMemo(() => formatLocalDate(new Date()), []);
	const initialPaymentTermDays = useRef(paymentTermDays).current;
	const initialValues = useMemo(
		() =>
			mode === 'edit' && deferredPaymentDocument
				? mapDeferredPaymentDocumentToForm(deferredPaymentDocument)
				: {
						...createDeferredPaymentInitialValues(today),
						due_date: addDaysToDateOnly(today, initialPaymentTermDays),
					},
		[deferredPaymentDocument, initialPaymentTermDays, mode, today],
	);
	const isPaidEdit = mode === 'edit' && deferredPaymentDocument?.status === 'paid';

	const formik = useFormik<DeferredPaymentFormValues>({
		initialValues,
		validationSchema: DeferredPaymentDocumentSchema,
		enableReinitialize: true,
		onSubmit: async (values) => {
			if (submittingRef.current || effectiveSubsidiaryId === null || isPaidEdit) return;
			const payload = mapDeferredPaymentFormToPayload(values, currentUserId);
			if (!payload) return;

			const submissionId = Symbol('deferred-payment-submission');
			submittingRef.current = true;
			activeSubmissionRef.current = submissionId;
			try {
				const mutationRequest =
					mode === 'edit' && deferredPaymentDocument
						? dispatch(
								updateDeferredPayment({
									subsidiaryId: effectiveSubsidiaryId,
									documentId: deferredPaymentDocument.id,
									payload,
								}),
							)
						: dispatch(
								createDeferredPayment({
									subsidiaryId: effectiveSubsidiaryId,
									payload,
								}),
							);
				activeRequestsRef.current = [mutationRequest];
				const result = await mutationRequest.unwrap();
				if (
					activeSubmissionRef.current !== submissionId ||
					latestSubsidiaryIdRef.current !== effectiveSubsidiaryId
				)
					return;
				toast.success(
					mode === 'edit'
						? 'Documento actualizado correctamente'
						: 'Documento creado correctamente',
				);

				const listRequest = dispatch(
					fetchDeferredPayments({ subsidiaryId: effectiveSubsidiaryId, filters }),
				);
				const summaryRequest = dispatch(
					fetchDeferredPaymentsSummary({ subsidiaryId: effectiveSubsidiaryId, filters }),
				);
				activeRequestsRef.current = [listRequest, summaryRequest];
				await Promise.all([listRequest, summaryRequest]);
				if (
					activeSubmissionRef.current !== submissionId ||
					latestSubsidiaryIdRef.current !== effectiveSubsidiaryId
				)
					return;

				await onSuccess?.(result.document);
			} catch (submitError: unknown) {
				if (
					activeSubmissionRef.current !== submissionId ||
					latestSubsidiaryIdRef.current !== effectiveSubsidiaryId
				)
					return;
				const fallbackMessage =
					mode === 'edit'
						? 'No se pudo actualizar el documento de pago diferido'
						: 'No se pudo crear el documento de pago diferido';
				let message = fallbackMessage;
				const submitErrorRecord = asRecord(submitError);
				const fieldErrors = asRecord(submitErrorRecord?.errors);
				if (fieldErrors) {
					await Promise.all(
						Object.entries(fieldErrors).flatMap(([field, fieldMessage]) => {
							if (typeof fieldMessage !== 'string' || !fieldMessage.trim()) return [];
							formik.setFieldError(field, fieldMessage);
							return [formik.setFieldTouched(field, true, false)];
						}),
					);
				}
				if (
					typeof submitErrorRecord?.message === 'string' &&
					submitErrorRecord.message.trim()
				) {
					message = submitErrorRecord.message;
				} else if (typeof submitError === 'string' && submitError.trim()) {
					message = submitError;
				} else if (submitError instanceof Error && submitError.message) {
					message = submitError.message;
				}
				toast.error(message);
			} finally {
				if (activeSubmissionRef.current === submissionId) {
					activeSubmissionRef.current = null;
					activeRequestsRef.current = [];
					submittingRef.current = false;
				}
			}
		},
	});

	const { setFieldValue } = formik;
	useEffect(() => {
		if (!isOpen) dueDateManuallySetRef.current = false;
	}, [isOpen]);
	const issueDate = formik.values.issue_date;
	const previousPaymentTermDaysRef = useRef(paymentTermDays);
	useEffect(() => {
		if (
			mode !== 'create' ||
			dueDateManuallySetRef.current ||
			paymentTermDays === previousPaymentTermDaysRef.current
		)
			return;
		previousPaymentTermDaysRef.current = paymentTermDays;
		setFieldValue('due_date', addDaysToDateOnly(issueDate, paymentTermDays), true).catch(
			() => undefined,
		);
	}, [issueDate, mode, paymentTermDays, setFieldValue]);

	const previousIssueDateRef = useRef(issueDate);
	useEffect(() => {
		if (
			mode !== 'create' ||
			dueDateManuallySetRef.current ||
			issueDate === previousIssueDateRef.current
		)
			return;
		previousIssueDateRef.current = issueDate;
		setFieldValue('due_date', addDaysToDateOnly(issueDate, paymentTermDays), true).catch(
			() => undefined,
		);
	}, [issueDate, mode, paymentTermDays, setFieldValue]);

	useEffect(() => {
		activeSubmissionRef.current = null;
		activeRequestsRef.current.forEach((request) => request.abort());
		activeRequestsRef.current = [];
		submittingRef.current = false;

		return () => {
			activeSubmissionRef.current = null;
			activeRequestsRef.current.forEach((request) => request.abort());
			activeRequestsRef.current = [];
			submittingRef.current = false;
		};
	}, [effectiveSubsidiaryId]);
	useEffect(
		() => () => {
			dispatch(clearDeferredPaymentMutation());
		},
		[dispatch],
	);

	const setDueDateManually = useCallback(
		(value: string) => {
			dueDateManuallySetRef.current = true;
			return setFieldValue('due_date', value, true);
		},
		[setFieldValue],
	);
	const resetDueDateManualOverride = useCallback(
		(nextPaymentTermDays = paymentTermDays) => {
			dueDateManuallySetRef.current = false;
			return setFieldValue(
				'due_date',
				addDaysToDateOnly(formik.values.issue_date, nextPaymentTermDays),
				true,
			);
		},
		[formik.values.issue_date, paymentTermDays, setFieldValue],
	);

	return {
		formik,
		estimatedTotal: calculateDeferredPaymentEstimatedTotal(formik.values.items),
		documentTotal: Number(formik.values.total_amount),
		isSubmitting: formik.isSubmitting || creating || updating,
		isPaidEdit,
		hasDataContext: effectiveSubsidiaryId !== null,
		actions: { resetDueDateManualOverride, setDueDateManually },
	};
};

export default useDeferredPaymentForm;
