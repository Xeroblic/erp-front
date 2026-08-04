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
import {
	createDeferredPaymentActionSchema,
	deferredPaymentReceiptSchema,
	type DeferredPaymentActionFormValues,
} from '../types';

const today = () => new Date().toISOString().slice(0, 10);
export const useDeferredPaymentActions = (
	document: IDeferredPaymentDocument | null,
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
	const [pendingMarkPaidReceipt, setPendingMarkPaidReceipt] = useState<{
		paymentId: number;
		file: File;
	} | null>(null);
	const [markPaidReceipt, setMarkPaidReceiptState] = useState<File | null>(null);
	const [markPaidReceiptError, setMarkPaidReceiptError] = useState<string | null>(null);
	const [markPaidReceiptTouched, setMarkPaidReceiptTouched] = useState(false);
	const requests = useRef<Array<{ abort: () => void }>>([]);
	const refresh = useCallback(() => {
		if (subsidiaryId === null || document === null) return;
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
	}, [dispatch, document, filters, subsidiaryId]);
	const uploadMarkPaidReceipt = useCallback(
		async (paymentId: number, file: File) => {
			if (subsidiaryId === null || document === null) return false;
			try {
				const request = dispatch(
					uploadDeferredPaymentReceipt({
						subsidiaryId,
						documentId: document.id,
						paymentId,
						file,
					}),
				);
				requests.current.push(request);
				await request.unwrap();
				setPendingMarkPaidReceipt(null);
				refresh();
				return true;
			} catch {
				setPendingMarkPaidReceipt({ paymentId, file });
				return false;
			}
		},
		[dispatch, document, refresh, subsidiaryId],
	);
	const formik = useFormik<DeferredPaymentActionFormValues>({
		initialValues: {
			amount: '',
			paid_at: today(),
			method: 'transfer',
			notes: '',
			receipt: null,
		},
		validationSchema: createDeferredPaymentActionSchema(
			Number(document?.outstanding_amount ?? 0),
		),
		onSubmit: async (values) => {
			if (subsidiaryId === null || document === null || recordingPayment) return;
			try {
				const request = dispatch(
					registerDeferredPayment({
						subsidiaryId,
						documentId: document.id,
						payload: {
							amount: Number(values.amount).toFixed(2),
							paid_at: values.paid_at,
							method: values.method,
							notes: values.notes?.trim() || null,
							receipt: values.receipt,
						},
					}),
				);
				requests.current.push(request);
				await request.unwrap();
				refresh();
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
			if (subsidiaryId === null || document === null || voidingPaymentId !== null)
				return false;
			try {
				const request = dispatch(
					voidDeferredPayment({
						subsidiaryId,
						documentId: document.id,
						paymentId: payment.id,
					}),
				);
				requests.current.push(request);
				await request.unwrap();
				refresh();
				return true;
			} catch {
				return false;
			}
		},
		[dispatch, document, refresh, subsidiaryId, voidingPaymentId],
	);
	const setMarkPaidReceipt = useCallback(async (file: File | null) => {
		setMarkPaidReceiptState(file);
		setMarkPaidReceiptTouched(true);
		try {
			await deferredPaymentReceiptSchema.validate(file);
			setMarkPaidReceiptError(null);
		} catch (validationError) {
			setMarkPaidReceiptError(
				validationError instanceof Error ? validationError.message : 'Comprobante inválido',
			);
		}
	}, []);
	const resetMarkPaidReceipt = useCallback(() => {
		setMarkPaidReceiptState(null);
		setMarkPaidReceiptError(null);
		setMarkPaidReceiptTouched(false);
	}, []);
	const confirmMarkPaid = useCallback(async () => {
		if (
			subsidiaryId === null ||
			document === null ||
			markingPaid ||
			uploadingReceipt ||
			markPaidReceiptError
		)
			return false;
		if (pendingMarkPaidReceipt)
			return uploadMarkPaidReceipt(
				pendingMarkPaidReceipt.paymentId,
				pendingMarkPaidReceipt.file,
			);
		try {
			const request = dispatch(
				markDeferredPaymentPaid({ subsidiaryId, documentId: document.id }),
			);
			requests.current.push(request);
			const payment = await request.unwrap();
			refresh();
			if (markPaidReceipt && !(await uploadMarkPaidReceipt(payment.id, markPaidReceipt)))
				return false;
			resetMarkPaidReceipt();
			return true;
		} catch {
			return false;
		}
	}, [
		dispatch,
		document,
		markingPaid,
		markPaidReceipt,
		markPaidReceiptError,
		refresh,
		resetMarkPaidReceipt,
		subsidiaryId,
		pendingMarkPaidReceipt,
		uploadMarkPaidReceipt,
		uploadingReceipt,
	]);
	useEffect(() => {
		setPendingMarkPaidReceipt(null);
		resetMarkPaidReceipt();
	}, [document?.id, resetMarkPaidReceipt, subsidiaryId]);
	useEffect(
		() => () => {
			requests.current.forEach((request) => request.abort());
			requests.current = [];
		},
		[document?.id, subsidiaryId],
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
				pendingMarkPaidReceipt,
				markPaidReceipt,
				markPaidReceiptError,
				markPaidReceiptTouched,
				busy:
					recordingPayment ||
					uploadingReceipt ||
					voidingPaymentId !== null ||
					markingPaid,
			},
			actions: {
				voidPayment,
				confirmMarkPaid,
				setMarkPaidReceipt,
				resetMarkPaidReceipt,
			},
		}),
		[
			error,
			formik,
			markingPaid,
			markPaidReceipt,
			markPaidReceiptError,
			markPaidReceiptTouched,
			pendingMarkPaidReceipt,
			recordingPayment,
			resetMarkPaidReceipt,
			setMarkPaidReceipt,
			uploadingReceipt,
			voidPayment,
			voidingPaymentId,
			confirmMarkPaid,
		],
	);
};
export default useDeferredPaymentActions;
