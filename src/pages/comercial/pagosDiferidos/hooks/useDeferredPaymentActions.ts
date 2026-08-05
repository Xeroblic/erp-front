import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import type {
	IDeferredPaymentAbono,
	IDeferredPaymentDocument,
} from '@/interface/deferredPayments.interface';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	clearDeferredPaymentMutation,
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

interface PendingMarkPaidReceipt {
	subsidiaryId: number;
	documentId: number;
	paymentId: number;
	file: File;
}

interface AbortableRequest {
	abort: () => void;
}

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
	const [pendingMarkPaidReceipt, setPendingMarkPaidReceipt] =
		useState<PendingMarkPaidReceipt | null>(null);
	const [markPaidReceipt, setMarkPaidReceiptState] = useState<File | null>(null);
	const [markPaidReceiptError, setMarkPaidReceiptError] = useState<string | null>(null);
	const [markPaidReceiptTouched, setMarkPaidReceiptTouched] = useState(false);
	const detailRequests = useRef<AbortableRequest[]>([]);
	const mutationRequests = useRef<AbortableRequest[]>([]);
	const collectionRequests = useRef<AbortableRequest[]>([]);
	const previousDocumentStatus = useRef(document?.status);
	const documentId = document?.id ?? null;
	const documentStatus = document?.status;
	const currentContext = useRef({ subsidiaryId, documentId: document?.id ?? null });
	currentContext.current = { subsidiaryId, documentId: document?.id ?? null };
	const isCurrentContext = useCallback(
		(context: Pick<PendingMarkPaidReceipt, 'subsidiaryId' | 'documentId'>) =>
			currentContext.current.subsidiaryId === context.subsidiaryId &&
			currentContext.current.documentId === context.documentId,
		[],
	);
	const refresh = useCallback(() => {
		if (subsidiaryId === null || document === null) return;
		const summaryFilters = {
			status: filters.status,
			customer_sale_id: filters.customer_sale_id,
			search: filters.search,
			due_before: filters.due_before,
			due_after: filters.due_after,
		};
		detailRequests.current.push(
			dispatch(fetchDeferredPaymentById({ subsidiaryId, documentId: document.id })),
		);
		collectionRequests.current.push(
			dispatch(fetchDeferredPayments({ subsidiaryId, filters })),
			dispatch(fetchDeferredPaymentsSummary({ subsidiaryId, filters: summaryFilters })),
		);
	}, [dispatch, document, filters, subsidiaryId]);
	const refreshDetail = useCallback(() => {
		if (subsidiaryId === null || document === null) return;
		detailRequests.current.push(
			dispatch(fetchDeferredPaymentById({ subsidiaryId, documentId: document.id })),
		);
	}, [dispatch, document, subsidiaryId]);
	const uploadMarkPaidReceipt = useCallback(
		async (pendingReceipt: PendingMarkPaidReceipt) => {
			if (!isCurrentContext(pendingReceipt)) return false;
			const request = dispatch(
				uploadDeferredPaymentReceipt({
					subsidiaryId: pendingReceipt.subsidiaryId,
					documentId: pendingReceipt.documentId,
					paymentId: pendingReceipt.paymentId,
					file: pendingReceipt.file,
				}),
			);
			mutationRequests.current.push(request);
			const result = await request;
			if (uploadDeferredPaymentReceipt.fulfilled.match(result)) {
				if (!isCurrentContext(pendingReceipt)) return false;
				setPendingMarkPaidReceipt(null);
				return true;
			}
			if (!result.meta.aborted && isCurrentContext(pendingReceipt)) {
				setPendingMarkPaidReceipt(pendingReceipt);
			}
			return false;
		},
		[dispatch, isCurrentContext],
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
				mutationRequests.current.push(request);
				await request.unwrap();
				toast.success('Abono registrado correctamente');
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
				mutationRequests.current.push(request);
				await request.unwrap();
				setPendingMarkPaidReceipt(null);
				resetMarkPaidReceipt();
				dispatch(clearDeferredPaymentMutation());
				refresh();
				return true;
			} catch {
				return false;
			}
		},
		[dispatch, document, refresh, resetMarkPaidReceipt, subsidiaryId, voidingPaymentId],
	);
	const dismissMarkPaidReceipt = useCallback(() => {
		setPendingMarkPaidReceipt(null);
		resetMarkPaidReceipt();
		dispatch(clearDeferredPaymentMutation());
	}, [dispatch, resetMarkPaidReceipt]);
	const clearMutationErrors = useCallback(() => {
		dispatch(clearDeferredPaymentMutation());
	}, [dispatch]);
	const retryMarkPaidReceipt = useCallback(async () => {
		if (uploadingReceipt || !pendingMarkPaidReceipt) return false;
		if (!isCurrentContext(pendingMarkPaidReceipt)) {
			setPendingMarkPaidReceipt(null);
			return false;
		}
		const uploaded = await uploadMarkPaidReceipt(pendingMarkPaidReceipt);
		if (uploaded) {
			resetMarkPaidReceipt();
			refreshDetail();
		}
		return uploaded;
	}, [
		isCurrentContext,
		pendingMarkPaidReceipt,
		refreshDetail,
		resetMarkPaidReceipt,
		uploadMarkPaidReceipt,
		uploadingReceipt,
	]);
	const markPaid = useCallback(async () => {
		if (
			subsidiaryId === null ||
			document === null ||
			markingPaid ||
			uploadingReceipt ||
			markPaidReceiptError
		)
			return false;
		const actionContext = { subsidiaryId, documentId: document.id };
		try {
			const request = dispatch(
				markDeferredPaymentPaid({ subsidiaryId, documentId: document.id }),
			);
			mutationRequests.current.push(request);
			const payment = await request.unwrap();
			if (!isCurrentContext(actionContext)) return false;
			toast.success('Documento marcado como pagado correctamente');
			if (markPaidReceipt) {
				const uploaded = await uploadMarkPaidReceipt({
					...actionContext,
					paymentId: payment.id,
					file: markPaidReceipt,
				});
				if (!isCurrentContext(actionContext)) return false;
				refresh();
				if (!uploaded) return true;
			} else {
				refresh();
			}
			resetMarkPaidReceipt();
			return true;
		} catch {
			return false;
		}
	}, [
		dispatch,
		document,
		isCurrentContext,
		markingPaid,
		markPaidReceipt,
		markPaidReceiptError,
		refresh,
		resetMarkPaidReceipt,
		subsidiaryId,
		uploadMarkPaidReceipt,
		uploadingReceipt,
	]);
	useEffect(() => {
		if (documentId === null) return;
		setPendingMarkPaidReceipt((pendingReceipt) =>
			pendingReceipt && !isCurrentContext(pendingReceipt) ? null : pendingReceipt,
		);
		resetMarkPaidReceipt();
		dispatch(clearDeferredPaymentMutation());
	}, [dispatch, documentId, isCurrentContext, resetMarkPaidReceipt, subsidiaryId]);
	useEffect(() => {
		if (documentId === null || documentStatus === undefined) return;
		const previousStatus = previousDocumentStatus.current;
		previousDocumentStatus.current = documentStatus;
		if (previousStatus === 'paid' && documentStatus !== 'paid') {
			setPendingMarkPaidReceipt(null);
			resetMarkPaidReceipt();
			dispatch(clearDeferredPaymentMutation());
		}
	}, [dispatch, documentId, documentStatus, resetMarkPaidReceipt]);
	useEffect(
		() => () => {
			detailRequests.current.forEach((request) => request.abort());
			mutationRequests.current.forEach((request) => request.abort());
			detailRequests.current = [];
			mutationRequests.current = [];
		},
		[document?.id, subsidiaryId],
	);
	useEffect(
		() => () => {
			collectionRequests.current.forEach((request) => request.abort());
			collectionRequests.current = [];
		},
		[subsidiaryId],
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
				errorPayment,
				errorReceipt,
				errorVoid,
				errorMarkPaid,
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
				markPaid,
				retryMarkPaidReceipt,
				setMarkPaidReceipt,
				resetMarkPaidReceipt,
				dismissMarkPaidReceipt,
				clearMutationErrors,
			},
		}),
		[
			error,
			errorPayment,
			errorReceipt,
			errorVoid,
			errorMarkPaid,
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
			markPaid,
			retryMarkPaidReceipt,
			dismissMarkPaidReceipt,
			clearMutationErrors,
		],
	);
};
export default useDeferredPaymentActions;
