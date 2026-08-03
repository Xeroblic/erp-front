import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import type {
	IDeferredPaymentAbono,
	IDeferredPaymentDocument,
} from '@/interface/deferredPayments.interface';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchDeferredPaymentById,
	fetchDeferredPayments,
	fetchDeferredPaymentsSummary,
	markDeferredPaymentPaid,
	registerDeferredPayment,
	uploadDeferredPaymentReceipt,
	voidDeferredPayment,
} from '@/store/slices/deferredPayments/deferredPaymentsSlice';
import { createDeferredPaymentActionSchema, type DeferredPaymentActionFormValues } from '../types';

const today = () => new Date().toISOString().slice(0, 10);
export const useDeferredPaymentActions = (
	document: IDeferredPaymentDocument,
	subsidiaryId: number | null,
	onPaymentCompleted?: () => void,
) => {
	const dispatch = useAppDispatch();
	const filters = useAppSelector((state) => state.deferredPayments.filters);
	const recordingPayment = useAppSelector((state) => state.deferredPayments.recordingPayment);
	const uploadingReceipt = useAppSelector((state) => state.deferredPayments.uploadingReceipt);
	const voidingPaymentId = useAppSelector((state) => state.deferredPayments.voidingPaymentId);
	const markingPaid = useAppSelector((state) => state.deferredPayments.markingPaid);
	const errorPayment = useAppSelector((state) => state.deferredPayments.errorPayment);
	const errorReceipt = useAppSelector((state) => state.deferredPayments.errorReceipt);
	const errorVoid = useAppSelector((state) => state.deferredPayments.errorVoid);
	const errorMarkPaid = useAppSelector((state) => state.deferredPayments.errorMarkPaid);
	const error = errorReceipt ?? errorPayment ?? errorVoid ?? errorMarkPaid;
	const [pendingReceipt, setPendingReceipt] = useState<{ paymentId: number; file: File } | null>(
		null,
	);
	const requests = useRef<Array<{ abort: () => void }>>([]);
	const refresh = useCallback(() => {
		if (subsidiaryId === null) return;
		const summaryFilters = {
			status: filters.status,
			customer_sale_id: filters.customer_sale_id,
			search: filters.search,
			due_before: filters.due_before,
			due_after: filters.due_after,
		};
		requests.current.push(
			dispatch(fetchDeferredPaymentById({ subsidiaryId, documentId: document.id })),
			dispatch(fetchDeferredPayments({ subsidiaryId, filters })),
			dispatch(fetchDeferredPaymentsSummary({ subsidiaryId, filters: summaryFilters })),
		);
	}, [dispatch, document.id, filters, subsidiaryId]);
	const uploadReceipt = useCallback(
		async (paymentId: number, file: File) => {
			if (subsidiaryId === null) return false;
			try {
				await dispatch(
					uploadDeferredPaymentReceipt({
						subsidiaryId,
						documentId: document.id,
						paymentId,
						file,
					}),
				).unwrap();
				setPendingReceipt(null);
				refresh();
				return true;
			} catch {
				setPendingReceipt({ paymentId, file });
				return false;
			}
		},
		[dispatch, document.id, refresh, subsidiaryId],
	);
	const formik = useFormik<DeferredPaymentActionFormValues>({
		initialValues: {
			amount: '',
			paid_at: today(),
			method: 'transfer',
			notes: '',
			receipt: null,
		},
		validationSchema: createDeferredPaymentActionSchema(Number(document.outstanding_amount)),
		onSubmit: async (values) => {
			if (subsidiaryId === null || recordingPayment || uploadingReceipt) return;
			try {
				const payment = await dispatch(
					registerDeferredPayment({
						subsidiaryId,
						documentId: document.id,
						payload: {
							amount: Number(values.amount).toFixed(2),
							paid_at: values.paid_at,
							method: values.method,
							notes: values.notes.trim() || null,
						},
					}),
				).unwrap();
				refresh();
				if (values.receipt && !(await uploadReceipt(payment.id, values.receipt))) return;
				formik.resetForm({
					values: {
						amount: '',
						paid_at: today(),
						method: 'transfer',
						notes: '',
						receipt: null,
					},
				});
				onPaymentCompleted?.();
			} catch {
				/* Redux conserva el mensaje y Formik conserva los valores. */
			}
		},
	});
	const voidPayment = useCallback(
		async (payment: IDeferredPaymentAbono) => {
			if (subsidiaryId === null || voidingPaymentId !== null) return false;
			try {
				await dispatch(
					voidDeferredPayment({
						subsidiaryId,
						documentId: document.id,
						paymentId: payment.id,
					}),
				).unwrap();
				refresh();
				return true;
			} catch {
				return false;
			}
		},
		[dispatch, document.id, refresh, subsidiaryId, voidingPaymentId],
	);
	const markPaid = useCallback(async () => {
		if (subsidiaryId === null || markingPaid) return false;
		try {
			await dispatch(
				markDeferredPaymentPaid({ subsidiaryId, documentId: document.id }),
			).unwrap();
			refresh();
			return true;
		} catch {
			return false;
		}
	}, [dispatch, document.id, markingPaid, refresh, subsidiaryId]);
	useEffect(
		() => () => {
			requests.current.forEach((request) => request.abort());
			requests.current = [];
		},
		[document.id, subsidiaryId],
	);
	return useMemo(
		() => ({
			formik,
			state: {
				recordingPayment,
				uploadingReceipt,
				voidingPaymentId,
				markingPaid,
				error,
				pendingReceipt,
				busy:
					recordingPayment ||
					uploadingReceipt ||
					voidingPaymentId !== null ||
					markingPaid,
			},
			actions: {
				retryReceipt: () =>
					pendingReceipt
						? uploadReceipt(pendingReceipt.paymentId, pendingReceipt.file)
						: Promise.resolve(false),
				voidPayment,
				markPaid,
			},
		}),
		[
			error,
			formik,
			markingPaid,
			pendingReceipt,
			recordingPayment,
			uploadReceipt,
			uploadingReceipt,
			voidPayment,
			voidingPaymentId,
			markPaid,
		],
	);
};
export default useDeferredPaymentActions;
