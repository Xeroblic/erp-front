/**
 * Selector de clientes de venta: búsqueda server-side con debounce, opciones cacheadas
 * en Redux y validadas contra la subsidiaria activa, más alta y edición rápidas sujetas
 * a permisos. Es la única implementación del selector; la comparten Pagos Diferidos y
 * Cotizaciones.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { InputActionMeta } from 'react-select';
import { useDebounce } from 'use-debounce';
import { toast } from 'react-toastify';
import SelectReact, {
	type TSelectOption,
	type TSelectOptions,
} from '@/components/form/SelectReact';
import ProtectedButton from '@/components/ui/ProtectedButton';
import CreateCustomerSaleModal from '@/pages/comercial/clientesVentas/components/modals/CreateCustomerSaleModal';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchCustomerDetailThunk,
	fetchCustomersOverviewThunk,
} from '@/store/slices/customerSales/customerSalesSlice';
import getDeferredPaymentErrorMessage from '@/utils/deferredPaymentsError.utils';
import type { ICustomerSale, ICustomerSaleOverview } from '@/interface/customerSales.interface';

/** Cliente tal como se ofrece en la lista del selector. */
export interface CustomerSaleOption {
	id: number;
	label: string;
	isActive: boolean;
}

/** Piezas que el consumidor ubica en su propio layout. */
export interface CustomerSaleSelectParts {
	select: ReactNode;
	createButton: ReactNode;
	/** `null` mientras no hay cliente elegido. */
	editButton: ReactNode;
	selectedCustomer: CustomerSaleOption | null;
}

interface CustomerSaleSelectProps {
	subsidiaryId: number | null;
	/** Id del cliente elegido; `null` cuando no hay ninguno. */
	value: number | null;
	onChange: (customer: CustomerSaleOption | null) => void;
	/**
	 * Mientras es `false` (modal anfitrión cerrado) no se consulta al backend y se
	 * descarta la selección local, para no arrastrar opciones de una apertura a otra.
	 */
	isActive?: boolean;
	name?: string;
	inputId?: string;
	placeholder?: string;
	isDisabled?: boolean;
	isClearable?: boolean;
	isValid?: boolean;
	isTouched?: boolean;
	invalidFeedback?: string;
	/**
	 * Opción garantizada en la lista aunque la búsqueda no la devuelva (el cliente ya
	 * guardado del documento en edición). Memoizala en el consumidor.
	 */
	fallbackOption?: CustomerSaleOption | null;
	onCustomerCreated?: (customer: ICustomerSale) => void;
	onCustomerUpdated?: (customer: ICustomerSale) => void;
	/**
	 * Avisa cuando el alta o la edición rápida se abre o cierra, para que el anfitrión
	 * suspenda lo que no puede convivir con un modal hijo encima. Memoizala.
	 */
	onModalOpenChange?: (isModalOpen: boolean) => void;
	children?: (parts: CustomerSaleSelectParts) => ReactNode;
}

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_PER_PAGE = 100;

const isSelectOption = (value: unknown): value is TSelectOption =>
	value !== null &&
	typeof value === 'object' &&
	!Array.isArray(value) &&
	typeof (value as { value?: unknown }).value === 'string';

/** Une los datos disponibles del cliente sin repetir el mismo texto dos veces. */
export const formatCustomerLabel = (...values: Array<string | null | undefined>): string => {
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

export const toOverviewCustomerOption = (customer: ICustomerSaleOverview): CustomerSaleOption => ({
	id: customer.id,
	label: formatCustomerLabel(customer.name, customer.contact?.name, customer.rut),
	isActive: customer.is_active,
});

export const toCustomerSaleOption = (customer: ICustomerSale): CustomerSaleOption => ({
	id: customer.id,
	label: formatCustomerLabel(
		customer.billing_company,
		customer.contact_name,
		customer.name,
		customer.rut,
	),
	isActive: customer.is_active,
});

const CustomerSaleSelect: React.FC<CustomerSaleSelectProps> = ({
	subsidiaryId,
	value,
	onChange,
	isActive = true,
	name = 'customer_sale_id',
	inputId,
	placeholder = 'Busca por razón social o RUT',
	isDisabled = false,
	isClearable = false,
	isValid,
	isTouched,
	invalidFeedback,
	fallbackOption = null,
	onCustomerCreated,
	onCustomerUpdated,
	onModalOpenChange,
	children,
}) => {
	const dispatch = useAppDispatch();
	const storedCustomers = useAppSelector((state) => state.customerSales.overview);
	const storedCustomersLoading = useAppSelector((state) => state.customerSales.overviewLoading);
	const overviewSubsidiaryId = useAppSelector(
		(state) => state.customerSales.overviewSubsidiaryId,
	);
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebounce(search, SEARCH_DEBOUNCE_MS);
	const [selectedOption, setSelectedOption] = useState<CustomerSaleOption | null>(null);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [modalSubsidiaryId, setModalSubsidiaryId] = useState<number | null>(null);
	const [editingCustomer, setEditingCustomer] = useState<ICustomerSale | null>(null);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);
	const detailRequestIdRef = useRef(0);
	const detailAbortRef = useRef<(() => void) | null>(null);
	const latestSubsidiaryIdRef = useRef(subsidiaryId);
	const latestValueRef = useRef(value);
	const latestIsActiveRef = useRef(isActive);
	const modalSubsidiaryIdRef = useRef<number | null>(modalSubsidiaryId);
	latestSubsidiaryIdRef.current = subsidiaryId;
	latestValueRef.current = value;
	latestIsActiveRef.current = isActive;
	modalSubsidiaryIdRef.current = modalSubsidiaryId;

	/**
	 * El overview vive en el store global: si quedó cargado con otra subsidiaria, sus
	 * clientes pertenecen a otro tenant y no pueden ofrecerse aquí.
	 */
	const isOverviewContextCurrent =
		subsidiaryId !== null &&
		overviewSubsidiaryId !== null &&
		Number(overviewSubsidiaryId) === subsidiaryId;
	const customers = useMemo(
		() => (isOverviewContextCurrent ? storedCustomers : []),
		[isOverviewContextCurrent, storedCustomers],
	);
	const isSearching = isOverviewContextCurrent ? storedCustomersLoading : false;
	const isModalContextCurrent = modalSubsidiaryId !== null && modalSubsidiaryId === subsidiaryId;
	const isCurrentCreateOpen = isCreateOpen && isModalContextCurrent;
	const isCurrentEditOpen = isEditOpen && editingCustomer !== null && isModalContextCurrent;
	const isCustomerModalOpen = isCurrentCreateOpen || isCurrentEditOpen;

	useEffect(() => {
		onModalOpenChange?.(isCustomerModalOpen);
	}, [isCustomerModalOpen, onModalOpenChange]);

	const resetModals = useCallback(() => {
		detailAbortRef.current?.();
		detailAbortRef.current = null;
		detailRequestIdRef.current += 1;
		setModalSubsidiaryId(null);
		setIsLoadingDetail(false);
		setEditingCustomer(null);
		setIsEditOpen(false);
		setIsCreateOpen(false);
	}, []);

	useEffect(
		() => () => {
			detailAbortRef.current?.();
			detailRequestIdRef.current += 1;
		},
		[],
	);

	useEffect(() => {
		if (isActive) return;
		resetModals();
		setSelectedOption(null);
		setSearch('');
	}, [isActive, resetModals]);

	const previousSubsidiaryIdRef = useRef(subsidiaryId);
	useEffect(() => {
		const previousSubsidiaryId = previousSubsidiaryIdRef.current;
		previousSubsidiaryIdRef.current = subsidiaryId;
		if (previousSubsidiaryId === subsidiaryId) return;
		resetModals();
	}, [resetModals, subsidiaryId]);

	useEffect(() => {
		if (!isActive || subsidiaryId === null) return undefined;
		const query = debouncedSearch.trim();
		if (!query) return undefined;
		const request = dispatch(
			fetchCustomersOverviewThunk({
				subsidiary: subsidiaryId,
				per_page: SEARCH_PER_PAGE,
				params: { q: query },
			}),
		);
		return () => request.abort();
	}, [debouncedSearch, dispatch, isActive, subsidiaryId]);

	const customerData = useMemo<CustomerSaleOption[]>(() => {
		const remoteCustomers = debouncedSearch.trim()
			? customers.map(toOverviewCustomerOption)
			: [];
		return Array.from(
			new Map(
				[
					...(fallbackOption ? [fallbackOption] : []),
					...remoteCustomers,
					...(selectedOption ? [selectedOption] : []),
				].map((customer) => [customer.id, customer]),
			).values(),
		);
	}, [customers, debouncedSearch, fallbackOption, selectedOption]);
	const options = useMemo<TSelectOptions>(
		() => customerData.map(({ id, label }) => ({ value: String(id), label })),
		[customerData],
	);
	const selectedCustomer = customerData.find((customer) => customer.id === value) ?? null;
	const selectedValue = options.find((option) => option.value === String(value ?? '')) ?? null;

	/**
	 * La respuesta puede llegar después de que el usuario cambió de subsidiaria, eligió
	 * otro cliente o cerró el modal: adoptarla mostraría datos de otro contexto.
	 */
	const isDetailRequestCurrent = (
		requestId: number,
		requestSubsidiaryId: number,
		requestCustomerId: number,
	) =>
		requestId === detailRequestIdRef.current &&
		latestSubsidiaryIdRef.current === requestSubsidiaryId &&
		latestValueRef.current === requestCustomerId &&
		latestIsActiveRef.current;

	const isModalStillCurrent = () =>
		latestIsActiveRef.current && modalSubsidiaryIdRef.current === latestSubsidiaryIdRef.current;

	const handleSelectChange = (nextValue: unknown) => {
		const option = isSelectOption(nextValue) ? nextValue : null;
		const customer = customerData.find((entry) => entry.id === Number(option?.value)) ?? null;
		if ((customer?.id ?? null) !== value) resetModals();
		setSelectedOption(customer);
		onChange(customer);
	};

	const handleOpenCreate = () => {
		if (subsidiaryId === null) {
			toast.error('No se pudo determinar la subsidiaria activa');
			return;
		}
		setModalSubsidiaryId(subsidiaryId);
		setIsCreateOpen(true);
	};

	const handleOpenEdit = () => {
		if (value === null) return;
		if (subsidiaryId === null) {
			toast.error('No se pudo determinar la subsidiaria activa');
			return;
		}
		detailAbortRef.current?.();
		const requestId = detailRequestIdRef.current + 1;
		detailRequestIdRef.current = requestId;
		const requestSubsidiaryId = subsidiaryId;
		const requestCustomerId = value;
		setModalSubsidiaryId(requestSubsidiaryId);
		setEditingCustomer(null);
		setIsEditOpen(false);
		setIsLoadingDetail(true);
		const request = dispatch(
			fetchCustomerDetailThunk({ subsidiary: requestSubsidiaryId, id: requestCustomerId }),
		);
		detailAbortRef.current = () => request.abort();
		request
			.unwrap()
			.then((customer) => {
				if (!isDetailRequestCurrent(requestId, requestSubsidiaryId, requestCustomerId))
					return;
				setEditingCustomer(customer);
				setIsEditOpen(true);
			})
			.catch((error: unknown) => {
				if (!isDetailRequestCurrent(requestId, requestSubsidiaryId, requestCustomerId))
					return;
				toast.error(getDeferredPaymentErrorMessage(error, 'No se pudo cargar el cliente'));
			})
			.finally(() => {
				if (requestId === detailRequestIdRef.current) {
					detailAbortRef.current = null;
					setIsLoadingDetail(false);
				}
			});
	};

	const handleCustomerCreated = (customer: ICustomerSale) => {
		if (!isModalStillCurrent()) {
			resetModals();
			return;
		}
		resetModals();
		setSelectedOption(toCustomerSaleOption(customer));
		onCustomerCreated?.(customer);
	};

	const handleCustomerUpdated = (customer: ICustomerSale) => {
		if (!isModalStillCurrent()) {
			resetModals();
			return;
		}
		if (latestValueRef.current === customer.id)
			setSelectedOption(toCustomerSaleOption(customer));
		setEditingCustomer(null);
		onCustomerUpdated?.(customer);
	};

	const select = (
		<SelectReact
			name={name}
			inputId={inputId}
			options={options}
			value={selectedValue}
			filterOption={null}
			isLoading={isSearching}
			isDisabled={isDisabled}
			isClearable={isClearable}
			placeholder={placeholder}
			noOptionsMessage={() => 'Sin resultados'}
			onInputChange={(inputValue: string, actionMeta?: InputActionMeta) => {
				if (actionMeta?.action === 'input-change') setSearch(inputValue);
			}}
			isValid={isValid}
			isTouched={isTouched}
			invalidFeedback={invalidFeedback}
			onChange={handleSelectChange}
		/>
	);

	const createButton = (
		<ProtectedButton
			permission={ERP_PERMISSIONS.CUSTOMER_SALES.CREATE}
			subsidiaryId={subsidiaryId}
			scope='access'
			type='button'
			variant='outline'
			size='xs'
			icon='HeroPlus'
			className='whitespace-nowrap'
			isDisable={isDisabled}
			onClick={handleOpenCreate}>
			Crear cliente
		</ProtectedButton>
	);

	const editButton =
		value === null ? null : (
			<ProtectedButton
				permission={ERP_PERMISSIONS.CUSTOMER_SALES.UPDATE}
				subsidiaryId={subsidiaryId}
				scope='access'
				type='button'
				variant='outline'
				size='xs'
				icon='HeroPencilSquare'
				isLoading={isLoadingDetail}
				isDisable={isDisabled}
				aria-label='Editar cliente'
				onClick={handleOpenEdit}
			/>
		);

	return (
		<>
			{children ? (
				children({ select, createButton, editButton, selectedCustomer })
			) : (
				<div className='flex w-full items-center gap-2'>
					<div className='min-w-0 flex-1'>{select}</div>
					{editButton}
					{createButton}
				</div>
			)}
			{/*
			 * Los modales de cliente se pintan en un portal, pero React propaga sus
			 * eventos por el árbol de componentes: sin este corte, guardar un cliente
			 * enviaría también el formulario que hospeda al selector.
			 */}
			<div className='contents' onSubmit={(event) => event.stopPropagation()}>
				{/*
				 * `refreshStoreOnSuccess={false}`: el overview lo administra la búsqueda
				 * de este selector (per_page 100 + q). Un refetch con los parámetros por
				 * defecto lo reduciría a los 5 clientes más recientes y vaciaría la lista.
				 */}
				<CreateCustomerSaleModal
					isOpen={isCurrentCreateOpen}
					setIsOpen={(nextIsOpen) => {
						if (!nextIsOpen) resetModals();
					}}
					subsidiaryId={modalSubsidiaryId}
					refreshStoreOnSuccess={false}
					onSuccess={handleCustomerCreated}
				/>
				<CreateCustomerSaleModal
					isOpen={isCurrentEditOpen}
					setIsOpen={(nextIsOpen) => {
						if (!nextIsOpen) resetModals();
					}}
					subsidiaryId={modalSubsidiaryId}
					isEdit
					initialData={editingCustomer}
					refreshStoreOnSuccess={false}
					onSuccess={handleCustomerUpdated}
				/>
			</div>
		</>
	);
};

export default CustomerSaleSelect;
