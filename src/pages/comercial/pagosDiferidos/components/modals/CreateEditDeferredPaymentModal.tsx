import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldArray, Form, FormikProvider } from 'formik';
import type { InputActionMeta } from 'react-select';
import { useDebounce } from 'use-debounce';
import { toast } from 'react-toastify';
import type {
	IDeferredPaymentCreditProfile,
	IDeferredPaymentDocument,
} from '@/interface/deferredPayments.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Icon, { preloadIcons } from '@/components/icon/Icon';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';
import DateInput from '@/components/form/DateInput';
import Input from '@/components/form/Input';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Textarea from '@/components/form/Textarea';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchCustomerDetailThunk,
	fetchCustomersOverviewThunk,
} from '@/store/slices/customerSales/customerSalesSlice';
import { fetchUsers } from '@/store/slices/usersAdmin/usersAdminSlice';
import { formatCLP } from '@/utils/format.utils';
import getDeferredPaymentErrorMessage from '@/utils/deferredPaymentsError.utils';
import deferredPaymentsService from '@/services/deferredPaymentsService';
import DeferredPaymentField from '../parts/DeferredPaymentField';
import DeferredPaymentSerialsInput from '../parts/DeferredPaymentSerialsInput';
import DeferredPaymentAttachmentsEditor from '../parts/DeferredPaymentAttachmentsEditor';
import CustomerCreditProfileCard from '@/pages/comercial/clientesVentas/ClientesVentasDetalle/components/CustomerCreditProfileCard';
import CreateCustomerSaleModal from '@/pages/comercial/clientesVentas/components/modals/CreateCustomerSaleModal';
import type { ICustomerSale, ICustomerSaleOverview } from '@/interface/customerSales.interface';
import useDeferredPaymentForm from '../../hooks/useDeferredPaymentForm';
import { useDeferredPaymentAttachments } from '../../hooks/useDeferredPaymentAttachments';
import { createEmptyDeferredPaymentItem, DEFERRED_PAYMENT_TOTAL_ERROR } from '../../types';
import { DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS } from '../../utils';

interface CreateEditDeferredPaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	deferredPaymentDocument?: IDeferredPaymentDocument | null;
	onSaved?: (document: IDeferredPaymentDocument) => void;
}

interface CustomerOptionData {
	id: number;
	label: string;
	isActive: boolean;
}

interface PendingUploadRecovery {
	document: IDeferredPaymentDocument;
	subsidiaryId: number;
	requestId: number;
}

const MAX_DATE = new Date(2100, 11, 31);
const MAX_YEAR = 2100;
const DEFERRED_PAYMENT_MODAL_ICONS = [
	'HeroArrowPath',
	'HeroInformationCircle',
	'HeroClock',
	'HeroBanknotes',
	'HeroChartBar',
	'HeroArrowTrendingUp',
	'HeroLockClosed',
	'HeroUserMinus',
	'HeroExclamationTriangle',
	'HeroPlus',
	'HeroPencilSquare',
	'HeroTrash',
	'HeroCheck',
] as const;

preloadIcons(DEFERRED_PAYMENT_MODAL_ICONS);

const hasValidationErrorOtherThan = (value: unknown, excludedMessage: string): boolean => {
	if (typeof value === 'string') return value !== excludedMessage;
	if (Array.isArray(value))
		return value.some((entry) => hasValidationErrorOtherThan(entry, excludedMessage));
	if (value !== null && typeof value === 'object')
		return Object.values(value).some((entry) =>
			hasValidationErrorOtherThan(entry, excludedMessage),
		);
	return false;
};
const documentTypeOptions: TSelectOption[] = Object.entries(
	DEFERRED_PAYMENT_DOCUMENT_TYPE_LABELS,
).map(([value, label]) => ({ value, label }));

const isSelectOption = (value: unknown): value is TSelectOption => {
	if (!value || typeof value !== 'object') return false;
	const option = value as Record<string, unknown>;
	return typeof option.value === 'string' && typeof option.label === 'string';
};

const asMultiOptions = (value: unknown): TSelectOption[] => {
	if (!Array.isArray(value)) return [];
	const candidates: unknown[] = value;
	return candidates.filter(isSelectOption);
};

const toCLPAmount = (value: string): string => value.replace(/\D/g, '');

const formatCustomerLabel = (...values: Array<string | null | undefined>): string => {
	const labelParts: string[] = [];
	values.forEach((value) => {
		const normalizedValue = value?.trim();
		if (
			normalizedValue &&
			!labelParts.some(
				(labelPart) =>
					labelPart.toLocaleLowerCase() === normalizedValue.toLocaleLowerCase(),
			)
		)
			labelParts.push(normalizedValue);
	});
	return labelParts.join(' · ');
};

const toOverviewCustomerOption = (customer: ICustomerSaleOverview): CustomerOptionData => ({
	id: customer.id,
	label: formatCustomerLabel(customer.name, customer.contact?.name, customer.rut),
	isActive: customer.is_active,
});

const getCreditProfileEmptyMessage = (
	isCreditProfileLoading: boolean,
	hasSelectedCustomer: boolean,
): string => {
	if (isCreditProfileLoading) return 'Cargando información de crédito…';
	if (hasSelectedCustomer) return 'Este cliente no tiene un perfil de crédito creado.';
	return 'Selecciona un cliente para consultar sus condiciones de crédito.';
};

const CreateEditDeferredPaymentModal: React.FC<CreateEditDeferredPaymentModalProps> = ({
	isOpen,
	onClose,
	deferredPaymentDocument = null,
	onSaved,
}) => {
	const dispatch = useAppDispatch();
	const customers = useAppSelector((state) => state.customerSales.overview);
	const customersLoading = useAppSelector((state) => state.customerSales.overviewLoading);
	const users = useAppSelector((state) => state.usersAdmin.users);
	const usersLoading = useAppSelector((state) => state.usersAdmin.loading.users);
	const currentUser = useAppSelector((state) => state.auth?.user);
	const { branchId, subsidiaryId } = useCurrentBranch();
	const [paymentTermDays, setPaymentTermDays] = useState(30);
	const [customerSearch, setCustomerSearch] = useState('');
	const [debouncedCustomerSearch] = useDebounce(customerSearch, 300);
	const [selectedCustomerOption, setSelectedCustomerOption] = useState<CustomerOptionData | null>(
		null,
	);
	const [creditProfile, setCreditProfile] = useState<IDeferredPaymentCreditProfile | null>(null);
	const [outstandingAmount, setOutstandingAmount] = useState<number | null>(null);
	const [isCreditProfileLoading, setIsCreditProfileLoading] = useState(false);
	const [creditProfileError, setCreditProfileError] = useState<string | null>(null);
	const [hasCreditProfileLoaded, setHasCreditProfileLoaded] = useState(false);
	const [isCreditProfileCreatorOpen, setIsCreditProfileCreatorOpen] = useState(false);
	const [isCreditProfileCreatorSaving, setIsCreditProfileCreatorSaving] = useState(false);
	const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
	const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
	const [editingCustomer, setEditingCustomer] = useState<ICustomerSale | null>(null);
	const [isLoadingCustomerDetail, setIsLoadingCustomerDetail] = useState(false);
	const [pendingUploadRecovery, setPendingUploadRecovery] =
		useState<PendingUploadRecovery | null>(null);
	const creditProfileRequestIdRef = useRef(0);
	const creditProfileAbortRef = useRef<AbortController | null>(null);
	const customerDetailRequestIdRef = useRef(0);
	const customerDetailAbortRef = useRef<(() => void) | null>(null);
	/** Subsidiaria vigente cuando se abrió el alta/edición rápida de clientes. */
	const customerModalSubsidiaryIdRef = useRef<number | null>(null);
	const latestSubsidiaryIdRef = useRef(subsidiaryId);
	const recoveryRequestIdRef = useRef(0);
	const savedDocumentIdRef = useRef<number | null>(null);
	latestSubsidiaryIdRef.current = subsidiaryId;
	const mode = deferredPaymentDocument ? 'edit' : 'create';
	const attachmentActions = useDeferredPaymentAttachments({
		isOpen,
		subsidiaryId,
		document: deferredPaymentDocument,
	});
	const currentPendingUploadRecovery =
		pendingUploadRecovery !== null &&
		pendingUploadRecovery.subsidiaryId === subsidiaryId &&
		isOpen
			? pendingUploadRecovery
			: null;
	const isAttachmentOperationActive =
		attachmentActions.isUploading || attachmentActions.busyAttachmentId !== null;
	const completeSavedDocument = useCallback(
		(savedDocument: IDeferredPaymentDocument) => {
			if (savedDocumentIdRef.current === savedDocument.id) return;
			savedDocumentIdRef.current = savedDocument.id;
			onSaved?.(savedDocument);
		},
		[onSaved],
	);
	const { formik, estimatedTotal, documentTotal, isSubmitting, isPaidEdit, actions } =
		useDeferredPaymentForm({
			mode,
			deferredPaymentDocument,
			paymentTermDays,
			isOpen,
			onSuccess: async (savedDocument) => {
				savedDocumentIdRef.current = null;
				const savedSubsidiaryId = latestSubsidiaryIdRef.current;
				if (savedSubsidiaryId === null) return false;
				const uploaded = await attachmentActions.uploadPending(savedDocument);
				if (latestSubsidiaryIdRef.current !== savedSubsidiaryId) return false;
				if (!uploaded) {
					recoveryRequestIdRef.current += 1;
					setPendingUploadRecovery({
						document: savedDocument,
						subsidiaryId: savedSubsidiaryId,
						requestId: recoveryRequestIdRef.current,
					});
					return false;
				}
				completeSavedDocument(savedDocument);
				onClose();
				return true;
			},
		});
	const { resetForm } = formik;
	const retryPendingAttachments = useCallback(async () => {
		if (currentPendingUploadRecovery === null) return;
		const uploaded = await attachmentActions.uploadPending(
			currentPendingUploadRecovery.document,
		);
		if (!uploaded) return;
		setPendingUploadRecovery(null);
		completeSavedDocument(currentPendingUploadRecovery.document);
		onClose();
	}, [attachmentActions, completeSavedDocument, currentPendingUploadRecovery, onClose]);
	const discardPendingAttachments = useCallback(() => {
		if (currentPendingUploadRecovery === null) return;
		completeSavedDocument(currentPendingUploadRecovery.document);
		attachmentActions.discardPending();
		setPendingUploadRecovery(null);
		onClose();
	}, [attachmentActions, completeSavedDocument, currentPendingUploadRecovery, onClose]);
	const latestCustomerSaleIdRef = useRef(formik.values.customer_sale_id);
	const latestIsOpenRef = useRef(isOpen);
	latestCustomerSaleIdRef.current = formik.values.customer_sale_id;
	latestIsOpenRef.current = isOpen;
	useEffect(() => {
		if (
			pendingUploadRecovery !== null &&
			(!isOpen || pendingUploadRecovery.subsidiaryId !== subsidiaryId)
		)
			setPendingUploadRecovery(null);
	}, [isOpen, pendingUploadRecovery, subsidiaryId]);

	const clearCreditProfile = useCallback(() => {
		creditProfileAbortRef.current?.abort();
		creditProfileAbortRef.current = null;
		creditProfileRequestIdRef.current += 1;
		setCreditProfile(null);
		setOutstandingAmount(null);
		setCreditProfileError(null);
		setHasCreditProfileLoaded(false);
		setIsCreditProfileLoading(false);
	}, []);

	const loadCreditProfile = useCallback(
		async (customerSaleId: number, allowEdit = false) => {
			if (subsidiaryId === null || (mode !== 'create' && !allowEdit)) return;
			const requestSubsidiaryId = subsidiaryId;
			const requestCustomerSaleId = customerSaleId;
			creditProfileAbortRef.current?.abort();
			const controller = new AbortController();
			creditProfileAbortRef.current = controller;
			const requestId = creditProfileRequestIdRef.current + 1;
			creditProfileRequestIdRef.current = requestId;
			setIsCreditProfileLoading(true);
			setCreditProfileError(null);
			setHasCreditProfileLoaded(false);
			setCreditProfile(null);
			setOutstandingAmount(null);
			try {
				const profile = await deferredPaymentsService.getCreditProfile(
					subsidiaryId,
					customerSaleId,
					controller.signal,
				);
				const summary =
					profile.id !== null && profile.is_active && profile.credit_limit !== null
						? await deferredPaymentsService.getSummary(
								subsidiaryId,
								{ customer_sale_id: customerSaleId },
								controller.signal,
							)
						: null;
				if (
					requestId !== creditProfileRequestIdRef.current ||
					latestSubsidiaryIdRef.current !== requestSubsidiaryId ||
					latestCustomerSaleIdRef.current !== requestCustomerSaleId ||
					!latestIsOpenRef.current
				)
					return;
				const parsedOutstandingAmount =
					summary === null ? null : Number(summary.total_outstanding);
				if (parsedOutstandingAmount !== null && !Number.isFinite(parsedOutstandingAmount)) {
					throw new Error('No se pudo obtener el saldo pendiente del cliente');
				}
				setCreditProfile(profile);
				setOutstandingAmount(parsedOutstandingAmount);
				setHasCreditProfileLoaded(true);
				if (mode === 'create') {
					setPaymentTermDays(profile.payment_term_days);
				}
			} catch (error: unknown) {
				if (
					controller.signal.aborted ||
					requestId !== creditProfileRequestIdRef.current ||
					latestSubsidiaryIdRef.current !== requestSubsidiaryId ||
					latestCustomerSaleIdRef.current !== requestCustomerSaleId ||
					!latestIsOpenRef.current
				)
					return;
				setCreditProfileError(
					getDeferredPaymentErrorMessage(
						error,
						'No se pudo cargar el perfil de crédito del cliente',
					),
				);
			} finally {
				if (
					requestId === creditProfileRequestIdRef.current &&
					latestSubsidiaryIdRef.current === requestSubsidiaryId &&
					latestCustomerSaleIdRef.current === requestCustomerSaleId &&
					latestIsOpenRef.current
				) {
					setIsCreditProfileLoading(false);
				}
			}
		},
		[mode, subsidiaryId],
	);

	const resetCustomerModals = useCallback(() => {
		customerDetailAbortRef.current?.();
		customerDetailAbortRef.current = null;
		customerDetailRequestIdRef.current += 1;
		customerModalSubsidiaryIdRef.current = null;
		setIsLoadingCustomerDetail(false);
		setEditingCustomer(null);
		setIsEditCustomerOpen(false);
		setIsCreateCustomerOpen(false);
	}, []);

	useEffect(
		() => () => {
			creditProfileAbortRef.current?.abort();
			creditProfileRequestIdRef.current += 1;
			customerDetailAbortRef.current?.();
			customerDetailRequestIdRef.current += 1;
		},
		[],
	);

	useEffect(() => {
		if (isOpen && mode === 'create') return;
		clearCreditProfile();
		if (!isOpen) {
			setPendingUploadRecovery(null);
			setIsCreditProfileCreatorOpen(false);
			setIsCreditProfileCreatorSaving(false);
			resetCustomerModals();
		}
		if (!isOpen && mode === 'create') {
			setSelectedCustomerOption(null);
			setCustomerSearch('');
			setPaymentTermDays(30);
			resetForm();
		}
	}, [clearCreditProfile, isOpen, mode, resetCustomerModals, resetForm]);

	const previousSubsidiaryIdRef = useRef(subsidiaryId);
	useEffect(() => {
		const previousSubsidiaryId = previousSubsidiaryIdRef.current;
		previousSubsidiaryIdRef.current = subsidiaryId;
		if (previousSubsidiaryId === subsidiaryId || !isOpen) return;

		clearCreditProfile();
		setIsCreditProfileCreatorOpen(false);
		setIsCreditProfileCreatorSaving(false);
		resetCustomerModals();
		if (mode === 'create' && subsidiaryId !== null && formik.values.customer_sale_id !== null)
			loadCreditProfile(formik.values.customer_sale_id).catch(() => undefined);
	}, [
		clearCreditProfile,
		formik.values.customer_sale_id,
		isOpen,
		loadCreditProfile,
		mode,
		resetCustomerModals,
		subsidiaryId,
	]);

	useEffect(() => {
		if (!isOpen || mode !== 'edit' || deferredPaymentDocument === null) return;
		loadCreditProfile(deferredPaymentDocument.customer.id, true).catch(() => undefined);
	}, [deferredPaymentDocument, isOpen, loadCreditProfile, mode]);

	useEffect(() => {
		if (!isOpen || subsidiaryId === null) return undefined;
		const query = debouncedCustomerSearch.trim();
		if (!query) return undefined;
		const customerRequest = dispatch(
			fetchCustomersOverviewThunk({
				subsidiary: subsidiaryId,
				per_page: 100,
				params: { q: query },
			}),
		);
		return () => customerRequest.abort();
	}, [debouncedCustomerSearch, dispatch, isOpen, subsidiaryId]);

	useEffect(() => {
		if (!isOpen || subsidiaryId === null) return undefined;
		const usersRequest = dispatch(
			fetchUsers({ subsidiary_id: subsidiaryId, status: 'active', per_page: 100 }),
		);
		return () => usersRequest.abort();
	}, [dispatch, isOpen, subsidiaryId]);

	const customerData = useMemo<CustomerOptionData[]>(() => {
		const remoteCustomers = debouncedCustomerSearch.trim()
			? customers.map(toOverviewCustomerOption)
			: [];
		const editedCustomer =
			mode === 'edit' && deferredPaymentDocument
				? {
						id: deferredPaymentDocument.customer.id,
						label: formatCustomerLabel(
							deferredPaymentDocument.customer.billing_company,
							deferredPaymentDocument.customer.contact_name,
							deferredPaymentDocument.customer.rut,
						),
						isActive: true,
					}
				: null;
		return Array.from(
			new Map(
				[
					...(editedCustomer ? [editedCustomer] : []),
					...remoteCustomers,
					...(selectedCustomerOption ? [selectedCustomerOption] : []),
				].map((customer) => [customer.id, customer]),
			).values(),
		);
	}, [customers, debouncedCustomerSearch, deferredPaymentDocument, mode, selectedCustomerOption]);
	const customerOptions = useMemo<TSelectOption[]>(
		() => customerData.map(({ id, label }) => ({ value: String(id), label })),
		[customerData],
	);
	const handleUnitPriceChange = (index: number, value: string) => {
		const field = `items.${index}.unit_price`;
		formik.setFieldTouched(field, true, false).catch(() => undefined);
		formik.setFieldValue(field, toCLPAmount(value)).catch(() => undefined);
	};
	const handleDocumentTotalChange = (value: string) => {
		formik.setFieldTouched('total_amount', true, false).catch(() => undefined);
		formik.setFieldValue('total_amount', toCLPAmount(value)).catch(() => undefined);
	};
	const assigneeOptions = useMemo<TSelectOption[]>(() => {
		const currentUserName = [currentUser?.first_name, currentUser?.last_name]
			.filter((value): value is string => Boolean(value?.trim()))
			.join(' ');
		const currentUserOption =
			currentUser && Number.isFinite(currentUser.id)
				? {
						value: String(currentUser.id),
						label: currentUserName
							? `${currentUserName} · ${currentUser.email}`
							: currentUser.email,
					}
				: null;
		const remoteOptions = users
			.filter((user) => user.is_active)
			.map((user) => ({
				value: String(user.id),
				label:
					'name' in user && typeof user.name === 'string'
						? `${user.name} · ${user.email}`
						: `${user.first_name} ${user.last_name} · ${user.email}`,
			}));
		const editedOptions =
			mode === 'edit' && deferredPaymentDocument
				? deferredPaymentDocument.assignees.map((assignee) => ({
						value: String(assignee.id),
						label: `${assignee.name} · ${assignee.email}`,
					}))
				: [];
		return Array.from(
			new Map(
				[
					...editedOptions,
					...(currentUserOption ? [currentUserOption] : []),
					...remoteOptions,
				].map((option) => [option.value, option]),
			).values(),
		);
	}, [currentUser, deferredPaymentDocument, mode, users]);
	const selectedCustomer = customerData.find(
		(customer) => customer.id === formik.values.customer_sale_id,
	);
	const customerValue = customerOptions.find(
		(option) => option.value === String(formik.values.customer_sale_id ?? ''),
	);
	const assigneeValue = assigneeOptions.filter((option) =>
		formik.values.assignee_ids.includes(Number(option.value)),
	);
	const itemErrors = typeof formik.errors.items === 'string' ? formik.errors.items : undefined;
	const totalAmountError =
		formik.touched.total_amount && typeof formik.errors.total_amount === 'string'
			? formik.errors.total_amount
			: undefined;
	const itemTotalDiffersFromDocumentTotal =
		Number.isFinite(documentTotal) && documentTotal > 0 && estimatedTotal !== documentTotal;
	const hasSelectedCustomer = formik.values.customer_sale_id !== null;
	const hasCreatedCreditProfile = creditProfile !== null && creditProfile.id !== null;
	const shouldShowCreditProfileEmptyState =
		!hasCreatedCreditProfile &&
		!creditProfileError &&
		(isCreditProfileLoading || hasCreditProfileLoaded || !hasSelectedCustomer);
	const creditProfileEmptyMessage = getCreditProfileEmptyMessage(
		isCreditProfileLoading,
		hasSelectedCustomer,
	);
	const creditProfileIcon = isCreditProfileLoading ? 'HeroArrowPath' : 'HeroInformationCircle';
	const creditProfileIconClassName = isCreditProfileLoading
		? 'animate-spin text-blue-600'
		: 'text-zinc-500';
	const creditLimit = creditProfile?.credit_limit ?? null;
	const creditLimitAmount = creditLimit === null ? null : Number(creditLimit);
	const availableCredit =
		creditLimitAmount === null || outstandingAmount === null
			? null
			: Math.max(creditLimitAmount - outstandingAmount, 0);
	const creditMetrics = [
		{
			label: 'Plazo',
			value: creditProfile ? `${creditProfile.payment_term_days} días` : '—',
			icon: 'HeroClock' as const,
			iconClassName: 'bg-blue-600',
		},
		{
			label: 'Cupo',
			value: creditLimitAmount === null ? '—' : formatCLP(creditLimitAmount),
			icon: 'HeroBanknotes' as const,
			iconClassName: 'bg-amber-600',
		},
		{
			label: 'Cupo usado',
			value:
				creditLimitAmount === null || outstandingAmount === null
					? '—'
					: formatCLP(outstandingAmount),
			icon: 'HeroChartBar' as const,
			iconClassName: 'bg-red-600',
		},
		{
			label: 'Cupo disponible',
			value:
				availableCredit === null || outstandingAmount === null
					? '—'
					: formatCLP(availableCredit),
			icon: 'HeroArrowTrendingUp' as const,
			iconClassName: 'bg-emerald-600',
		},
	];
	const handleClose = () => {
		if (
			!isSubmitting &&
			!isAttachmentOperationActive &&
			currentPendingUploadRecovery === null
		) {
			clearCreditProfile();
			setIsCreditProfileCreatorOpen(false);
			setIsCreditProfileCreatorSaving(false);
			resetCustomerModals();
			onClose();
		}
	};
	const handleCloseCreditProfileCreator = () => {
		if (isCreditProfileCreatorSaving) return;
		setIsCreditProfileCreatorOpen(false);
		if (formik.values.customer_sale_id !== null)
			loadCreditProfile(formik.values.customer_sale_id, true).catch(() => undefined);
	};
	const handleRetryCreditProfile = () => {
		const customerSaleId = formik.values.customer_sale_id;
		if (customerSaleId !== null)
			loadCreditProfile(customerSaleId, mode === 'edit').catch(() => undefined);
	};
	const toCustomerOption = (customer: ICustomerSale): CustomerOptionData => ({
		id: customer.id,
		label: formatCustomerLabel(
			customer.billing_company,
			customer.contact_name,
			customer.name,
			customer.rut,
		),
		isActive: customer.is_active,
	});
	/**
	 * El alta rápida puede resolver después de que el usuario cambió de subsidiaria o
	 * cerró este modal: adoptar ese cliente seleccionaría un deudor de otra subsidiaria
	 * y consultaría su perfil de crédito con el contexto equivocado.
	 */
	const isCustomerModalStillCurrent = () =>
		latestIsOpenRef.current && customerModalSubsidiaryIdRef.current === subsidiaryId;
	const handleCustomerCreated = (customer: ICustomerSale) => {
		if (!isCustomerModalStillCurrent()) {
			resetCustomerModals();
			return;
		}
		resetCustomerModals();
		clearCreditProfile();
		latestCustomerSaleIdRef.current = customer.id;
		setSelectedCustomerOption(toCustomerOption(customer));
		formik.setFieldValue('customer_sale_id', customer.id).catch(() => undefined);
		if (mode === 'create') {
			actions.resetDueDateManualOverride(30).catch(() => undefined);
			setPaymentTermDays(30);
		}
		loadCreditProfile(customer.id, true).catch(() => undefined);
	};
	const handleCustomerUpdated = (customer: ICustomerSale) => {
		if (!isCustomerModalStillCurrent()) {
			resetCustomerModals();
			return;
		}
		if (formik.values.customer_sale_id === customer.id)
			setSelectedCustomerOption(toCustomerOption(customer));
		setEditingCustomer(null);
	};
	const handleOpenEditCustomer = () => {
		const customerSaleId = formik.values.customer_sale_id;
		if (customerSaleId === null) return;
		if (subsidiaryId === null) {
			toast.error('No se pudo determinar la subsidiaria activa');
			return;
		}
		customerDetailAbortRef.current?.();
		const requestId = customerDetailRequestIdRef.current + 1;
		customerDetailRequestIdRef.current = requestId;
		const requestSubsidiaryId = subsidiaryId;
		customerModalSubsidiaryIdRef.current = requestSubsidiaryId;
		const requestCustomerSaleId = customerSaleId;
		setEditingCustomer(null);
		setIsEditCustomerOpen(false);
		setIsLoadingCustomerDetail(true);
		const customerRequest = dispatch(
			fetchCustomerDetailThunk({
				subsidiary: requestSubsidiaryId,
				id: requestCustomerSaleId,
			}),
		);
		customerDetailAbortRef.current = () => customerRequest.abort();
		customerRequest
			.unwrap()
			.then((customer) => {
				if (
					requestId !== customerDetailRequestIdRef.current ||
					latestSubsidiaryIdRef.current !== requestSubsidiaryId ||
					latestCustomerSaleIdRef.current !== requestCustomerSaleId ||
					!latestIsOpenRef.current
				)
					return;
				setEditingCustomer(customer);
				setIsEditCustomerOpen(true);
			})
			.catch((error: unknown) => {
				if (
					requestId === customerDetailRequestIdRef.current &&
					latestSubsidiaryIdRef.current === requestSubsidiaryId &&
					latestCustomerSaleIdRef.current === requestCustomerSaleId &&
					latestIsOpenRef.current
				)
					toast.error(
						getDeferredPaymentErrorMessage(error, 'No se pudo cargar el cliente'),
					);
			})
			.finally(() => {
				if (requestId === customerDetailRequestIdRef.current) {
					customerDetailAbortRef.current = null;
					setIsLoadingCustomerDetail(false);
				}
			});
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} size='2xl' isScrollable isStaticBackdrop>
			<ModalHeader>
				<div>
					<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
						{mode === 'create' ? 'Nuevo documento' : 'Editar documento'}
					</h2>
					<p className='text-sm font-normal text-zinc-500'>
						Registra la deuda y define quién realizará su seguimiento.
					</p>
				</div>
			</ModalHeader>
			<FormikProvider value={formik}>
				<Form
					className='flex min-h-0 flex-1 flex-col overflow-hidden'
					onSubmit={(event) => {
						event.preventDefault();
						formik
							.validateForm()
							.then((errors) => {
								if (
									documentTotal <= 0 &&
									!hasValidationErrorOtherThan(
										errors,
										DEFERRED_PAYMENT_TOTAL_ERROR,
									)
								)
									toast.error(DEFERRED_PAYMENT_TOTAL_ERROR);
								return formik.submitForm();
							})
							.catch(() => undefined);
					}}>
					<ModalBody className='min-h-0 flex-1 space-y-5 overflow-y-auto bg-zinc-50 dark:bg-zinc-950'>
						{isPaidEdit && (
							<Alert color='amber' variant='outline' icon='HeroLockClosed'>
								Los documentos pagados no se pueden editar.
							</Alert>
						)}

						{selectedCustomer && !selectedCustomer.isActive && (
							<Alert color='amber' variant='outline' icon='HeroUserMinus'>
								Este cliente está suspendido. Confirma su situación antes de
								guardar.
							</Alert>
						)}

						<Card className='border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
							<CardHeader className='pb-2'>
								<CardTitle className='text-lg'>Datos del documento</CardTitle>
							</CardHeader>
							<CardBody className='grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-3'>
								<DeferredPaymentField
									name='customer_sale_id'
									label='Cliente'
									labelAction={
										<>
											{hasSelectedCustomer && (
												<ProtectedButton
													permission={
														ERP_PERMISSIONS.CUSTOMER_SALES.UPDATE
													}
													subsidiaryId={subsidiaryId}
													scope='access'
													type='button'
													variant='outline'
													size='xs'
													icon='HeroPencilSquare'
													isLoading={isLoadingCustomerDetail}
													isDisable={isPaidEdit}
													aria-label='Editar cliente'
													onClick={handleOpenEditCustomer}
												/>
											)}
											<ProtectedButton
												permission={ERP_PERMISSIONS.CUSTOMER_SALES.CREATE}
												subsidiaryId={subsidiaryId}
												scope='access'
												type='button'
												variant='outline'
												size='xs'
												icon='HeroPlus'
												isDisable={isPaidEdit}
												aria-label='Crear cliente'
												onClick={() => {
													customerModalSubsidiaryIdRef.current =
														subsidiaryId;
													setIsCreateCustomerOpen(true);
												}}
											/>
										</>
									}
									className='md:col-span-2 lg:col-span-1'>
									{({ error, isTouched, isValid }) => (
										<SelectReact
											name='customer_sale_id'
											inputId='customer_sale_id'
											options={customerOptions}
											value={customerValue ?? null}
											filterOption={null}
											isLoading={customersLoading}
											isDisabled={isPaidEdit}
											placeholder='Busca por razón social o RUT'
											noOptionsMessage={() => 'Sin resultados'}
											onInputChange={(
												value: string,
												actionMeta?: InputActionMeta,
											) => {
												if (actionMeta?.action === 'input-change')
													setCustomerSearch(value);
											}}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
											onChange={(value) => {
												const option = isSelectOption(value) ? value : null;
												const customer = customerData.find(
													(entry) => entry.id === Number(option?.value),
												);
												const customerChanged =
													customer?.id !== formik.values.customer_sale_id;
												setSelectedCustomerOption(customer ?? null);
												if (customerChanged) {
													latestCustomerSaleIdRef.current =
														customer?.id ?? null;
													resetCustomerModals();
													setIsCreditProfileCreatorOpen(false);
													setIsCreditProfileCreatorSaving(false);
													clearCreditProfile();
												}
												if (mode === 'create' && customerChanged) {
													actions
														.resetDueDateManualOverride(30)
														.catch(() => undefined);
													setPaymentTermDays(30);
												}
												if (customer && customerChanged)
													loadCreditProfile(customer.id, true).catch(
														() => undefined,
													);
												formik
													.setFieldValue(
														'customer_sale_id',
														customer?.id ?? null,
													)
													.catch(() => undefined);
											}}
										/>
									)}
								</DeferredPaymentField>
								<DeferredPaymentField name='document_type' label='Tipo'>
									{({ error, isTouched, isValid }) => (
										<SelectReact
											name='document_type'
											inputId='document_type'
											options={documentTypeOptions}
											value={
												documentTypeOptions.find(
													(option) =>
														option.value ===
														formik.values.document_type,
												) ?? null
											}
											isDisabled={isPaidEdit}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
											onChange={(value) => {
												if (isSelectOption(value))
													formik
														.setFieldValue('document_type', value.value)
														.catch(() => undefined);
											}}
										/>
									)}
								</DeferredPaymentField>
								<DeferredPaymentField
									name='document_number'
									label='Número de documento'>
									{({ error, isTouched, isValid }) => (
										<Input
											id='document_number'
											name='document_number'
											placeholder='Ej.: FAC-001234'
											value={formik.values.document_number}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											disabled={isPaidEdit}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
										/>
									)}
								</DeferredPaymentField>
								<DeferredPaymentField name='issue_date' label='Fecha de emisión'>
									{({ error, isTouched, isValid }) => (
										<DateInput
											id='issue_date'
											name='issue_date'
											value={formik.values.issue_date}
											maxDate={MAX_DATE}
											maxYear={MAX_YEAR}
											disabled={isPaidEdit}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
											onChange={formik.handleChange}
											onBlur={() =>
												formik.setFieldTouched('issue_date', true)
											}
										/>
									)}
								</DeferredPaymentField>
								<DeferredPaymentField name='due_date' label='Fecha de vencimiento'>
									{({ error, isTouched, isValid }) => (
										<DateInput
											id='due_date'
											name='due_date'
											value={formik.values.due_date}
											maxDate={MAX_DATE}
											maxYear={MAX_YEAR}
											disabled={isPaidEdit}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
											onChange={(event) =>
												actions
													.setDueDateManually(event.target.value)
													.catch(() => undefined)
											}
											onBlur={() => formik.setFieldTouched('due_date', true)}
										/>
									)}
								</DeferredPaymentField>
								<DeferredPaymentField
									name='purchase_order'
									label='Orden de compra (opcional)'>
									{({ error, isTouched, isValid }) => (
										<Input
											id='purchase_order'
											name='purchase_order'
											placeholder='Ej.: OC-12345'
											value={formik.values.purchase_order ?? ''}
											maxLength={100}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											disabled={isPaidEdit}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
										/>
									)}
								</DeferredPaymentField>
								<DeferredPaymentField name='assignee_ids' label='Responsables'>
									{() => (
										<SelectReact
											name='assignee_ids'
											inputId='assignee_ids'
											isMulti
											options={assigneeOptions}
											value={assigneeValue}
											isLoading={usersLoading}
											isDisabled={isPaidEdit}
											placeholder='Selecciona responsables'
											styles={{
												multiValue: (base) => ({
													...base,
													backgroundColor: 'var(--color-primary-700)',
												}),
												multiValueLabel: (base) => ({
													...base,
													color: '#fff',
												}),
												multiValueRemove: (base) => ({
													...base,
													color: '#fff',
												}),
											}}
											onChange={(value) =>
												formik
													.setFieldValue(
														'assignee_ids',
														asMultiOptions(value).map((option) =>
															Number(option.value),
														),
													)
													.catch(() => undefined)
											}
										/>
									)}
								</DeferredPaymentField>
								<DeferredPaymentField
									name='notes'
									label='Notas (opcional)'
									className='md:col-span-2 lg:col-span-3'>
									{({ error, isTouched, isValid }) => (
										<Textarea
											id='notes'
											name='notes'
											rows={3}
											color='zinc'
											colorIntensity='300'
											className='bg-zinc-50 dark:bg-zinc-900'
											value={formik.values.notes ?? ''}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											disabled={isPaidEdit}
											isValid={isValid}
											isTouched={isTouched}
											invalidFeedback={error}
										/>
									)}
								</DeferredPaymentField>
							</CardBody>
						</Card>

						<Card className='border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
							<CardBody>
								<DeferredPaymentAttachmentsEditor
									attachments={attachmentActions.attachments}
									pending={attachmentActions.pending}
									error={
										currentPendingUploadRecovery
											? `El documento se guardó. No se pudieron subir ${attachmentActions.pending.length} archivos`
											: attachmentActions.error
									}
									isUploading={attachmentActions.isUploading}
									busyAttachmentId={attachmentActions.busyAttachmentId}
									branchId={branchId}
									subsidiaryId={subsidiaryId}
									disabled={
										isPaidEdit ||
										isSubmitting ||
										currentPendingUploadRecovery !== null
									}
									onAddFiles={attachmentActions.addFiles}
									onRemovePending={attachmentActions.removePending}
									onSetPendingSharing={attachmentActions.setPendingSharing}
									onDelete={(id) => {
										attachmentActions
											.deleteAttachment(id)
											.catch(() => undefined);
									}}
									onUpdateSharing={(attachment, value) => {
										attachmentActions
											.updateSharing(attachment, value)
											.catch(() => undefined);
									}}
									onRetry={
										currentPendingUploadRecovery
											? retryPendingAttachments
											: undefined
									}
									onDiscard={
										currentPendingUploadRecovery
											? discardPendingAttachments
											: undefined
									}
								/>
							</CardBody>
						</Card>

						<Card className='border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
							<CardHeader className='items-center pb-2'>
								<CardTitle className='text-lg'>Información de crédito</CardTitle>
								{hasSelectedCustomer &&
									!isCreditProfileLoading &&
									(hasCreatedCreditProfile || hasCreditProfileLoaded) && (
										<ProtectedButton
											permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.UPDATE}
											subsidiaryId={subsidiaryId}
											scope='access'
											type='button'
											variant='outline'
											icon={
												hasCreatedCreditProfile
													? 'HeroPencilSquare'
													: 'HeroPlus'
											}
											onClick={() => setIsCreditProfileCreatorOpen(true)}>
											{hasCreatedCreditProfile
												? 'Editar perfil'
												: 'Crear perfil'}
										</ProtectedButton>
									)}
							</CardHeader>
							<CardBody>
								{hasCreatedCreditProfile && (
									<div
										className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'
										aria-live='polite'>
										{creditMetrics.map((metric) => (
											<div
												key={metric.label}
												className='flex min-w-0 items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950'>
												<div
													className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${metric.iconClassName}`}>
													<Icon
														icon={metric.icon}
														size='text-xl'
														color='white'
													/>
												</div>
												<div className='min-w-0'>
													<p className='text-xs font-medium text-zinc-500 dark:text-zinc-400'>
														{metric.label}
													</p>
													<p className='truncate text-lg font-bold tabular-nums text-zinc-900 dark:text-white'>
														{metric.value}
													</p>
												</div>
											</div>
										))}
									</div>
								)}
								{!hasCreatedCreditProfile && creditProfileError && (
									<Alert
										color='red'
										variant='outline'
										icon='HeroExclamationTriangle'>
										<div className='space-y-3'>
											<p>{creditProfileError}</p>
											{formik.values.customer_sale_id !== null && (
												<Button
													variant='outline'
													color='red'
													type='button'
													onClick={handleRetryCreditProfile}>
													Reintentar
												</Button>
											)}
										</div>
									</Alert>
								)}
								{shouldShowCreditProfileEmptyState && (
									<div className='flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300'>
										<Icon
											icon={creditProfileIcon}
											size='text-2xl'
											className={creditProfileIconClassName}
										/>
										<p aria-live='polite'>{creditProfileEmptyMessage}</p>
									</div>
								)}
							</CardBody>
						</Card>

						<Card className='border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
							<CardHeader className='pb-2'>
								<CardTitle className='text-lg'>Ítems del documento</CardTitle>
							</CardHeader>
							<CardBody className='space-y-4'>
								<FieldArray name='items'>
									{(arrayHelpers) => (
										<>
											{formik.values.items.map((item, index) => (
												<div
													key={item.client_key}
													className='grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900 md:grid-cols-12'>
													<DeferredPaymentField
														name={`items.${index}.code`}
														label='Código'
														className='md:col-span-2'>
														{({ error, isTouched, isValid }) => (
															<Input
																id={`items.${index}.code`}
																name={`items.${index}.code`}
																placeholder='Ej.: PROD-001'
																value={item.code}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
																disabled={isPaidEdit}
																invalidFeedback={error}
																isTouched={isTouched}
																isValid={isValid}
															/>
														)}
													</DeferredPaymentField>
													<DeferredPaymentField
														name={`items.${index}.description`}
														label='Descripción'
														className='md:col-span-4'>
														{({ error, isTouched, isValid }) => (
															<Input
																id={`items.${index}.description`}
																name={`items.${index}.description`}
																placeholder='Describe el producto o servicio'
																value={item.description}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
																disabled={isPaidEdit}
																invalidFeedback={error}
																isTouched={isTouched}
																isValid={isValid}
															/>
														)}
													</DeferredPaymentField>
													<DeferredPaymentField
														name={`items.${index}.quantity`}
														label='Cantidad'
														className='md:col-span-2'>
														{({ error, isTouched, isValid }) => (
															<Input
																id={`items.${index}.quantity`}
																name={`items.${index}.quantity`}
																type='number'
																min={1}
																value={item.quantity}
																onChange={formik.handleChange}
																onBlur={formik.handleBlur}
																disabled={isPaidEdit}
																invalidFeedback={error}
																isTouched={isTouched}
																isValid={isValid}
															/>
														)}
													</DeferredPaymentField>
													<DeferredPaymentField
														name={`items.${index}.unit_price`}
														hiddenErrorMessage={
															DEFERRED_PAYMENT_TOTAL_ERROR
														}
														label='Precio unitario (bruto, IVA incluido)'
														className='md:col-span-3'>
														{({ error, isTouched, isValid }) => (
															<Input
																id={`items.${index}.unit_price`}
																name={`items.${index}.unit_price`}
																type='text'
																inputMode='numeric'
																placeholder='$ 0'
																value={
																	item.unit_price === ''
																		? ''
																		: formatCLP(item.unit_price)
																}
																onChange={(event) =>
																	handleUnitPriceChange(
																		index,
																		event.target.value,
																	)
																}
																onBlur={formik.handleBlur}
																disabled={isPaidEdit}
																invalidFeedback={error}
																isTouched={isTouched}
																isValid={isValid}
															/>
														)}
													</DeferredPaymentField>
													<div className='flex items-start pt-7 md:col-span-1'>
														<Button
															type='button'
															variant='outline'
															color='red'
															icon='HeroTrash'
															aria-label={`Quitar ítem ${index + 1}`}
															isDisable={
																isPaidEdit ||
																formik.values.items.length === 1
															}
															onClick={() =>
																arrayHelpers.remove(index)
															}
														/>
													</div>
													<DeferredPaymentField
														name={`items.${index}.serials`}
														className='md:col-span-12'>
														{() => (
															<DeferredPaymentSerialsInput
																id={`items.${index}.serials`}
																value={item.serials}
																disabled={isPaidEdit}
																onChange={(serials) =>
																	formik
																		.setFieldValue(
																			`items.${index}.serials`,
																			serials,
																		)
																		.catch(() => undefined)
																}
															/>
														)}
													</DeferredPaymentField>
												</div>
											))}
											<Button
												type='button'
												variant='outline'
												icon='HeroPlus'
												isDisable={isPaidEdit}
												onClick={() =>
													arrayHelpers.push(
														createEmptyDeferredPaymentItem(),
													)
												}>
												Agregar ítem
											</Button>
										</>
									)}
								</FieldArray>
								{itemErrors && <p className='text-sm text-red-600'>{itemErrors}</p>}
								<div className='grid gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-700 md:grid-cols-2'>
									<div>
										<p className='text-sm text-zinc-500'>
											Suma referencial de ítems
										</p>
										<p className='text-2xl font-bold'>
											{formatCLP(estimatedTotal)}
										</p>
									</div>
									<DeferredPaymentField
										name='total_amount'
										label='Total del documento — debe coincidir con la factura'
										className='md:col-span-1'>
										{() => (
											<Input
												id='total_amount'
												name='total_amount'
												type='text'
												inputMode='numeric'
												placeholder='$ 0'
												value={
													formik.values.total_amount === ''
														? ''
														: formatCLP(formik.values.total_amount)
												}
												onChange={(event) =>
													handleDocumentTotalChange(event.target.value)
												}
												onBlur={formik.handleBlur}
												disabled={isPaidEdit}
												isTouched={formik.touched.total_amount}
												isValid={!totalAmountError}
												invalidFeedback={totalAmountError}
											/>
										)}
									</DeferredPaymentField>
								</div>
								{itemTotalDiffersFromDocumentTotal && (
									<Alert
										color='amber'
										variant='outline'
										icon='HeroExclamationTriangle'>
										La suma de los ítems no coincide con el total del documento.
										Verifica la factura; la diferencia puede corresponder a
										descuentos o despacho.
									</Alert>
								)}
							</CardBody>
						</Card>
					</ModalBody>
					<ModalFooter className='shrink-0 border-t border-zinc-200 bg-white pt-4 dark:border-zinc-800 dark:bg-zinc-950'>
						<ModalFooterChild>
							<Button
								type='button'
								variant='outline'
								isDisable={
									isSubmitting ||
									isAttachmentOperationActive ||
									currentPendingUploadRecovery !== null
								}
								onClick={handleClose}>
								Cancelar
							</Button>
						</ModalFooterChild>
						<ModalFooterChild>
							<Button
								type='submit'
								variant='solid'
								color='blue'
								icon='HeroCheck'
								isLoading={isSubmitting}
								isDisable={
									isSubmitting ||
									isPaidEdit ||
									isAttachmentOperationActive ||
									currentPendingUploadRecovery !== null
								}>
								{mode === 'create' ? 'Crear documento' : 'Guardar cambios'}
							</Button>
						</ModalFooterChild>
					</ModalFooter>
				</Form>
			</FormikProvider>
			<Modal
				isOpen={isCreditProfileCreatorOpen}
				setIsOpen={handleCloseCreditProfileCreator}
				size='lg'
				isStaticBackdrop>
				<ModalHeader>
					{hasCreatedCreditProfile
						? 'Editar perfil de crédito'
						: 'Crear perfil de crédito'}
				</ModalHeader>
				<ModalBody>
					{formik.values.customer_sale_id !== null && (
						<CustomerCreditProfileCard
							customerSaleId={formik.values.customer_sale_id}
							startInEditMode
							onSavingChange={setIsCreditProfileCreatorSaving}
						/>
					)}
				</ModalBody>
			</Modal>
			{/*
			 * `refreshStoreOnSuccess={false}`: el overview lo administra la búsqueda de
			 * este modal (per_page 100 + q). Un refetch con los parámetros por defecto
			 * la reduciría a los 5 clientes más recientes y vaciaría el select.
			 */}
			<CreateCustomerSaleModal
				isOpen={isCreateCustomerOpen}
				setIsOpen={setIsCreateCustomerOpen}
				subsidiaryId={subsidiaryId}
				refreshStoreOnSuccess={false}
				onSuccess={handleCustomerCreated}
			/>
			<CreateCustomerSaleModal
				isOpen={isEditCustomerOpen && editingCustomer !== null}
				setIsOpen={setIsEditCustomerOpen}
				subsidiaryId={subsidiaryId}
				isEdit
				initialData={editingCustomer}
				refreshStoreOnSuccess={false}
				onSuccess={handleCustomerUpdated}
			/>
		</Modal>
	);
};

export default CreateEditDeferredPaymentModal;
