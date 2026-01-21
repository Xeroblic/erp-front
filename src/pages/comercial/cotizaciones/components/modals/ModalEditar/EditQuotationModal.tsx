/**
 * Modal para EDITAR cotizaciones
 * Usa Formik + Yup, componentes UI (Card, SelectReact, etc.)
 */
import React, { useEffect } from 'react';
import { Formik, Form } from 'formik';
import { IQuote, QuoteStatus } from '../../../../../../interface';
import { toast } from 'react-toastify';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '../../../../../../components/ui/Modal';
import Button from '../../../../../../components/ui/Button';
import { TSelectOptions } from '../../../../../../components/form/SelectReact';
import { normalizeQuoteStatusValue } from '../../../constants/quoteStatuses';
import { selectPersonalizacionUsuario, useAppSelector } from '@/store';
import ApiService from '@/services/ApiService';
import Badge from '@/components/ui/Badge';

// Shared imports
import { FormQuotationValues, SaleableProduct } from '../shared/types';
import {
	quotationSchema,
	IVA_RATE,
	paymentMethodOptions,
	paymentTermsOptions,
	statusOptions,
} from '../shared/constants';
import {
	sanitizeItemsForSubmit,
	ensureFormItems,
	generateCustomerCreationPayload,
} from '../shared/helpers';
import GeneralInfoCard from '../shared/components/GeneralInfoCard';
import PaymentInfoCard from '../shared/components/PaymentInfoCard';
import ItemsListCard from '../shared/components/ItemsListCard';
import TotalsCard from '../shared/components/TotalsCard';

interface EditQuotationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (quotation: Omit<IQuote, 'id' | 'created_at' | 'updated_at'>) => void;
	quotation: IQuote;
	loading?: boolean;
}

const EditQuotationModal: React.FC<EditQuotationModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	quotation,
	loading = false,
}) => {
	const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
	const [pendingPayload, setPendingPayload] = React.useState<Omit<
		IQuote,
		'id' | 'created_at' | 'updated_at'
	> | null>(null);
	const personalizacion = useAppSelector(selectPersonalizacionUsuario);
	const user = useAppSelector((state) => state.auth.user);

	React.useEffect(() => {
		if (!isOpen) {
			setIsConfirmModalOpen(false);
			setPendingPayload(null);
		}
	}, [isOpen]);

	const subsidiaryId = personalizacion?.subsidiary_id || quotation.subsidiary_id || 1;
	const branchId =
		personalizacion?.sucursal_principal ||
		user?.branch?.id ||
		user?.personalizacion?.sucursal_principal ||
		0;

	const [customerOptions, setCustomerOptions] = React.useState<TSelectOptions>([]);
	const [productOptions, setProductOptions] = React.useState<TSelectOptions>([]);
	const [saleableProductsMap, setSaleableProductsMap] = React.useState<
		Record<number, SaleableProduct>
	>({});

	const ensureOptionExists = (
		options: TSelectOptions,
		value?: string | number | null,
		label?: string,
	): TSelectOptions => {
		if (!value) return options;
		const valueStr = String(value);
		if (options.some((opt) => opt.value === valueStr)) {
			return options;
		}
		return [
			...options,
			{
				value: valueStr,
				label: label || valueStr,
			},
		];
	};

	useEffect(() => {
		const fetchClientes = async () => {
			try {
				const clientes = await ApiService.fetchNormalized({
					url: `/subsidiaries/${subsidiaryId}/customer-sales/overview?per_page=1000`,
					method: 'GET',
				});

				const payload = Array.isArray(clientes?.data)
					? clientes.data
					: Array.isArray(clientes)
						? clientes
						: [];

				let options: TSelectOptions = payload.map((c: any) => ({
					value: String(c.id),
					label: c.name || c.contact?.name || 'Cliente sin nombre',
				}));

				if (quotation?.customer_id) {
					options = ensureOptionExists(
						options,
						quotation.customer_id,
						(quotation.customer as any)?.name || 'Cliente seleccionado',
					);
				}

				setCustomerOptions(options);
			} catch (error) {
				console.error('Error cargando clientes:', error);
			}
		};

		if (isOpen) fetchClientes();
	}, [subsidiaryId, isOpen, quotation]);

	useEffect(() => {
		const fetchProductos = async () => {
			if (!branchId) return;
			try {
				const response = await ApiService.fetchNormalized({
					url: `/branches/${branchId}/products/saleables`,
					method: 'GET',
				});

				const saleables: SaleableProduct[] = Array.isArray(response)
					? response
					: Array.isArray(response?.data)
						? response.data
						: [];

				const mapped: Record<number, SaleableProduct> = {};
				saleables.forEach((product) => {
					if (product?.id) {
						mapped[product.id] = product;
					}
				});

				let options: TSelectOptions = saleables.map((p) => ({
					value: String(p.id),
					label: `${p.name} · Stock ${p.stock ?? 0}`,
				}));

				// Asegurar que productos de la cotización existan aunque no estén en los saleables actuales
				(quotation?.items || []).forEach((item) => {
					const pid = item.product_id ? Number(item.product_id) : null;
					if (!pid) return;
					if (!mapped[pid]) {
						mapped[pid] = {
							id: pid,
							sku: item.product?.sku || item.customer_sku || '',
							name: item.product?.name || item.customer_name || `Producto ${pid}`,
							stock: 0,
							unit_price_net: Number(item.unit_price) || 0,
							unit_price_gross: Number(
								(item as any).unit_price_gross || item.total || 0,
							),
						};
					}
					options = ensureOptionExists(
						options,
						pid,
						mapped[pid].name || `Producto ${pid}`,
					);
				});

				setSaleableProductsMap(mapped);
				setProductOptions(options);
			} catch (error) {
				console.error('Error cargando productos:', error);
			}
		};

		if (isOpen && branchId) fetchProductos();
	}, [branchId, isOpen, quotation]);

    // Handle automatic surcharge updates
    const PaymentMethodSurchargeHandler = ({ values, setFieldValue }: { values: FormQuotationValues, setFieldValue: any }) => {
        useEffect(() => {
             const method = Array.isArray(values.payment_method) ? values.payment_method[0] : values.payment_method;
             
             if (!method) return;

             // Exclude surcharge for 'efectivo' and 'transferencia'
             const EXEMPT_METHODS = ['efectivo', 'transferencia'];
             const shouldApplySurcharge = !EXEMPT_METHODS.includes(method.toLowerCase());

             if (shouldApplySurcharge) {
                 // Set default 3% only if it was 0 or undefined, AND we are not loading an existing non-zero value
                 // For edit mode, we trust the existing value unless it's 0 and valid for surcharge
                 if (!values.payment_surcharge_percentage && values.payment_surcharge_percentage !== 0) {
                     setFieldValue('payment_surcharge_percentage', 3);
                 }
                 // If it is 0 but method requires it, maybe we should default to 3? 
                 // User might have explicitly set 0. Let's respect explicit 0 if possible? 
                 // Actually prompt says "automatic". Let's set 3 if 0.
                 if (values.payment_surcharge_percentage === 0) {
                     setFieldValue('payment_surcharge_percentage', 3);
                 }
             } else {
                 // Reset availability of surcharge if exempt
                 if (values.payment_surcharge_percentage !== 0) {
                     setFieldValue('payment_surcharge_percentage', 0);
                 }
             }
        }, [values.payment_method]); // Listen only to payment_method changes

        return null;
    };

	// Valores iniciales para EDITAR cotización
	const getInitialValues = (): FormQuotationValues => {
		const today = new Date().toISOString().split('T')[0];
		const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split('T')[0];

		const numericDiscountPct = Number(
			quotation.discount_percentage ?? quotation.discount_rate ?? 0,
		);
		const numericTaxPct = Number(quotation.tax_percentage ?? quotation.tax_rate ?? 0);

		const normalizedPaymentMethod = Array.isArray(quotation.payment_method)
			? (quotation.payment_method[0] ?? null)
			: (quotation.payment_method ?? null);

        // Filter out surcharge items to prevent duplication/display in items list
        const filteredItems = (quotation.items || []).filter(item => item.customer_sku !== 'RECARGO');

		return {
			subsidiary_id: quotation.subsidiary_id ?? personalizacion?.subsidiary_id ?? 1,
			customer_id: quotation.customer_id ?? 0,
			quote_date: quotation.quote_date ?? today,
			expiry_date: quotation.expiry_date ?? quotation.valid_until ?? expiryDate,
			status: normalizeQuoteStatusValue(quotation.status) as QuoteStatus,
			subtotal: Number(quotation.subtotal ?? 0),
			tax_rate: Number(quotation.tax_rate ?? numericTaxPct ?? 0),
			tax_amount: Number(quotation.tax_amount ?? 0),
			discount_amount: Number(quotation.discount_amount ?? 0),
			discount_percentage: numericDiscountPct,
			tax_percentage: numericTaxPct > 0 ? IVA_RATE : 0,
			total_amount: Number(quotation.total_amount ?? 0),
            payment_surcharge_percentage: Number(quotation.payment_surcharge_percentage ?? 0),
            payment_surcharge_amount: Number(quotation.payment_surcharge_amount ?? 0),
			notes: quotation.notes ?? '',
			created_by: quotation.created_by ?? user?.id ?? undefined,
			approved_by: quotation.approved_by ?? undefined,
			payment_method: normalizedPaymentMethod,
			document_type: quotation.document_type ?? 'boleta',
			purchase_order: quotation.purchase_order ?? '',
			payment_terms: quotation.payment_terms ?? 0,
			fixed_discount: quotation.fixed_discount ?? 0,
			items: ensureFormItems(filteredItems),
			customer: quotation.customer,
			items_count: quotation.items_count,
			can_convert: quotation.can_convert,
			is_converted_to_sale: quotation.is_converted_to_sale,
			converted_at: quotation.converted_at,
		};
	};

	if (!isOpen) return null;

	const handleCustomerCreated = async (customerId: number, customerName: string) => {
		const newOption = {
			value: String(customerId),
			label: customerName,
		};
		setCustomerOptions((prev) => {
			// Verificar si ya existe para evitar duplicados
			const exists = prev.find((opt) => opt.value === String(customerId));
			if (exists) return prev;
			return [...prev, newOption];
		});

		// Mostrar mensaje de éxito
		toast.success(`Cliente "${customerName}" creado y disponible`);
	};

	return (
		<>
			<Modal
				isOpen={isOpen}
				setIsOpen={onClose}
				size='2xl'
				isStaticBackdrop
				isStaticBackdropAnimation
				isAnimation={false}>
				<ModalHeader>
					<div>
						<Badge className='text-xl font-semibold'>Editar Cotización</Badge>
						<p className='text-sm'>Modifica los datos de la cotización seleccionada.</p>
					</div>
				</ModalHeader>

				<ModalBody>
					<Formik<FormQuotationValues>
						initialValues={getInitialValues()}
						validationSchema={quotationSchema}
						onSubmit={(values, { setSubmitting }) => {
							const sanitizedItems = sanitizeItemsForSubmit(values.items);

                            if (Number(values.payment_surcharge_amount) > 0) {
                                sanitizedItems.push({
                                    product_id: null,
                                    customer_name: 'Reajuste valor normal sin descuento transferencia',
                                    quantity: 1,
                                    unit_price: Number(values.payment_surcharge_amount),
                                    description: 'Reajuste por medio de pago seleccionado',
                                    customer_sku: 'RECARGO',
                                } as any);
                            }

							const normalizedPayment = Array.isArray(values.payment_method)
								? (values.payment_method[0] ?? null)
								: values.payment_method && String(values.payment_method).length > 0
									? values.payment_method
									: null;

							const normalizedDocument =
								values.document_type && String(values.document_type).length > 0
									? values.document_type
									: null;

							const payload = {
								...values,
								payment_method: normalizedPayment,
								document_type: normalizedDocument,
								items: sanitizedItems as any,
								tax_percentage: values.tax_percentage === IVA_RATE ? IVA_RATE : 0,
                                payment_surcharge_percentage: values.payment_surcharge_percentage,
                                payment_surcharge_amount: values.payment_surcharge_amount,
							};

							setPendingPayload(payload);
							setIsConfirmModalOpen(true);
							setSubmitting(false);
						}}
						enableReinitialize>
						{({ values, setFieldValue, errors, touched, handleSubmit }) => (
							<Form id='quotation-form' className='space-y-6' onSubmit={handleSubmit}>
                                <PaymentMethodSurchargeHandler values={values} setFieldValue={setFieldValue} />
								<GeneralInfoCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									customerOptions={customerOptions}
									subsidiaryId={subsidiaryId}
									onCustomerCreated={(customerId, customerName) => {
										handleCustomerCreated(customerId, customerName);
										// Usar setTimeout para asegurar que el DOM se actualice
										setTimeout(() => {
											setFieldValue('customer_id', customerId);
										}, 100);
									}}
								/>

								<PaymentInfoCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									paymentMethodOptions={paymentMethodOptions}
									paymentTermsOptions={paymentTermsOptions}
									statusOptions={statusOptions}
								/>

								<ItemsListCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									productOptions={productOptions}
									saleableProductsMap={saleableProductsMap}
								/>

								<TotalsCard
									values={values}
									setFieldValue={setFieldValue}
									IVA_RATE={IVA_RATE}
								/>
							</Form>
						)}
					</Formik>
				</ModalBody>

				<ModalFooter>
					<ModalFooterChild>
						<Button variant='outline' onClick={onClose} isDisable={loading}>
							Cancelar
						</Button>
						<Button
							onClick={() =>
								document
									.getElementById('quotation-form')
									?.dispatchEvent(
										new Event('submit', { bubbles: true, cancelable: true }),
									)
							}
							isLoading={loading}>
							Actualizar Cotización
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			<Modal
				isOpen={isConfirmModalOpen}
				setIsOpen={() => setIsConfirmModalOpen(false)}
				size='sm'
				isStaticBackdrop
				isStaticBackdropAnimation>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>Confirmar actualización</h3>
				</ModalHeader>
				<ModalBody>
					<p className='text-sm text-gray-600 dark:text-gray-200'>
						¿Deseas actualizar esta cotización con los cambios realizados?
					</p>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='outline'
							color='red'
							className='bg-red-400/20'
							onClick={() => {
								setPendingPayload(null);
								setIsConfirmModalOpen(false);
							}}>
							Cancelar
						</Button>
						<Button
							variant='outline'
							color='green'
							className='bg-green-400/20'
							onClick={() => {
								if (!pendingPayload) return;
								onSubmit(pendingPayload);
								setPendingPayload(null);
								/**
 * Modal para EDITAR cotizaciones
 * Usa Formik + Yup, componentes UI (Card, SelectReact, etc.)
 */
import React, { useEffect } from 'react';
import { Formik, Form } from 'formik';
import { IQuote, QuoteStatus } from '../../../../../../interface';
import { toast } from 'react-toastify';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '../../../../../../components/ui/Modal';
import Button from '../../../../../../components/ui/Button';
import { TSelectOptions } from '../../../../../../components/form/SelectReact';
import { normalizeQuoteStatusValue } from '../../../constants/quoteStatuses';
import { selectPersonalizacionUsuario, useAppSelector } from '@/store';
import ApiService from '@/services/ApiService';
import Badge from '@/components/ui/Badge';

// Shared imports
import { FormQuotationValues, SaleableProduct } from '../shared/types';
import {
	quotationSchema,
	IVA_RATE,
	paymentMethodOptions,
	paymentTermsOptions,
	statusOptions,
} from '../shared/constants';
import {
	sanitizeItemsForSubmit,
	ensureFormItems,
	generateCustomerCreationPayload,
} from '../shared/helpers';
import GeneralInfoCard from '../shared/components/GeneralInfoCard';
import PaymentInfoCard from '../shared/components/PaymentInfoCard';
import ItemsListCard from '../shared/components/ItemsListCard';
import TotalsCard from '../shared/components/TotalsCard';

interface EditQuotationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (quotation: Omit<IQuote, 'id' | 'created_at' | 'updated_at'>) => void;
	quotation: IQuote;
	loading?: boolean;
}

const EditQuotationModal: React.FC<EditQuotationModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	quotation,
	loading = false,
}) => {
	const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
	const [pendingPayload, setPendingPayload] = React.useState<Omit<
		IQuote,
		'id' | 'created_at' | 'updated_at'
	> | null>(null);
	const personalizacion = useAppSelector(selectPersonalizacionUsuario);
	const user = useAppSelector((state) => state.auth.user);

	React.useEffect(() => {
		if (!isOpen) {
			setIsConfirmModalOpen(false);
			setPendingPayload(null);
		}
	}, [isOpen]);

	const subsidiaryId = personalizacion?.subsidiary_id || quotation.subsidiary_id || 1;
	const branchId =
		personalizacion?.sucursal_principal ||
		user?.branch?.id ||
		user?.personalizacion?.sucursal_principal ||
		0;

	const [customerOptions, setCustomerOptions] = React.useState<TSelectOptions>([]);
	const [productOptions, setProductOptions] = React.useState<TSelectOptions>([]);
	const [saleableProductsMap, setSaleableProductsMap] = React.useState<
		Record<number, SaleableProduct>
	>({});

	const ensureOptionExists = (
		options: TSelectOptions,
		value?: string | number | null,
		label?: string,
	): TSelectOptions => {
		if (!value) return options;
		const valueStr = String(value);
		if (options.some((opt) => opt.value === valueStr)) {
			return options;
		}
		return [
			...options,
			{
				value: valueStr,
				label: label || valueStr,
			},
		];
	};

	useEffect(() => {
		const fetchClientes = async () => {
			try {
				const clientes = await ApiService.fetchNormalized({
					url: `/subsidiaries/${subsidiaryId}/customer-sales/overview?per_page=1000`,
					method: 'GET',
				});

				const payload = Array.isArray(clientes?.data)
					? clientes.data
					: Array.isArray(clientes)
						? clientes
						: [];

				let options: TSelectOptions = payload.map((c: any) => ({
					value: String(c.id),
					label: c.name || c.contact?.name || 'Cliente sin nombre',
				}));

				if (quotation?.customer_id) {
					options = ensureOptionExists(
						options,
						quotation.customer_id,
						(quotation.customer as any)?.name || 'Cliente seleccionado',
					);
				}

				setCustomerOptions(options);
			} catch (error) {
				console.error('Error cargando clientes:', error);
			}
		};

		if (isOpen) fetchClientes();
	}, [subsidiaryId, isOpen, quotation]);

	useEffect(() => {
		const fetchProductos = async () => {
			if (!branchId) return;
			try {
				const response = await ApiService.fetchNormalized({
					url: `/branches/${branchId}/products/saleables`,
					method: 'GET',
				});

				const saleables: SaleableProduct[] = Array.isArray(response)
					? response
					: Array.isArray(response?.data)
						? response.data
						: [];

				const mapped: Record<number, SaleableProduct> = {};
				saleables.forEach((product) => {
					if (product?.id) {
						mapped[product.id] = product;
					}
				});

				let options: TSelectOptions = saleables.map((p) => ({
					value: String(p.id),
					label: `${p.name} · Stock ${p.stock ?? 0}`,
				}));

				// Asegurar que productos de la cotización existan aunque no estén en los saleables actuales
				(quotation?.items || []).forEach((item) => {
					const pid = item.product_id ? Number(item.product_id) : null;
					if (!pid) return;
					if (!mapped[pid]) {
						mapped[pid] = {
							id: pid,
							sku: item.product?.sku || item.customer_sku || '',
							name: item.product?.name || item.customer_name || `Producto ${pid}`,
							stock: 0,
							unit_price_net: Number(item.unit_price) || 0,
							unit_price_gross: Number(
								(item as any).unit_price_gross || item.total || 0,
							),
						};
					}
					options = ensureOptionExists(
						options,
						pid,
						mapped[pid].name || `Producto ${pid}`,
					);
				});

				setSaleableProductsMap(mapped);
				setProductOptions(options);
			} catch (error) {
				console.error('Error cargando productos:', error);
			}
		};

		if (isOpen && branchId) fetchProductos();
	}, [branchId, isOpen, quotation]);

    // Handle automatic surcharge updates
    const PaymentMethodSurchargeHandler = ({ values, setFieldValue }: { values: FormQuotationValues, setFieldValue: any }) => {
        useEffect(() => {
             const method = Array.isArray(values.payment_method) ? values.payment_method[0] : values.payment_method;
             
             if (!method) return;

             // Exclude surcharge for 'efectivo' and 'transferencia'
             const EXEMPT_METHODS = ['efectivo', 'transferencia'];
             const shouldApplySurcharge = !EXEMPT_METHODS.includes(method.toLowerCase());

             if (shouldApplySurcharge) {
                 // Set default 3% only if it was 0 or undefined, AND we are not loading an existing non-zero value
                 // For edit mode, we trust the existing value unless it's 0 and valid for surcharge
                 if (!values.payment_surcharge_percentage && values.payment_surcharge_percentage !== 0) {
                     setFieldValue('payment_surcharge_percentage', 3);
                 }
                 // If it is 0 but method requires it, maybe we should default to 3? 
                 // User might have explicitly set 0. Let's respect explicit 0 if possible? 
                 // Actually prompt says "automatic". Let's set 3 if 0.
                 if (values.payment_surcharge_percentage === 0) {
                     setFieldValue('payment_surcharge_percentage', 3);
                 }
             } else {
                 // Reset availability of surcharge if exempt
                 if (values.payment_surcharge_percentage !== 0) {
                     setFieldValue('payment_surcharge_percentage', 0);
                 }
             }
        }, [values.payment_method]); // Listen only to payment_method changes

        return null;
    };

	// Valores iniciales para EDITAR cotización
	const getInitialValues = (): FormQuotationValues => {
		const today = new Date().toISOString().split('T')[0];
		const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split('T')[0];

		const numericDiscountPct = Number(
			quotation.discount_percentage ?? quotation.discount_rate ?? 0,
		);
		const numericTaxPct = Number(quotation.tax_percentage ?? quotation.tax_rate ?? 0);

		const normalizedPaymentMethod = Array.isArray(quotation.payment_method)
			? (quotation.payment_method[0] ?? null)
			: (quotation.payment_method ?? null);

        // Filter out surcharge items to prevent duplication/display in items list
        const filteredItems = (quotation.items || []).filter(item => item.customer_sku !== 'RECARGO');

		return {
			subsidiary_id: quotation.subsidiary_id ?? personalizacion?.subsidiary_id ?? 1,
			customer_id: quotation.customer_id ?? 0,
			quote_date: quotation.quote_date ?? today,
			expiry_date: quotation.expiry_date ?? quotation.valid_until ?? expiryDate,
			status: normalizeQuoteStatusValue(quotation.status) as QuoteStatus,
			subtotal: Number(quotation.subtotal ?? 0),
			tax_rate: Number(quotation.tax_rate ?? numericTaxPct ?? 0),
			tax_amount: Number(quotation.tax_amount ?? 0),
			discount_amount: Number(quotation.discount_amount ?? 0),
			discount_percentage: numericDiscountPct,
			tax_percentage: numericTaxPct > 0 ? IVA_RATE : 0,
			total_amount: Number(quotation.total_amount ?? 0),
            payment_surcharge_percentage: Number(quotation.payment_surcharge_percentage ?? 0),
            payment_surcharge_amount: Number(quotation.payment_surcharge_amount ?? 0),
			notes: quotation.notes ?? '',
			created_by: quotation.created_by ?? user?.id ?? undefined,
			approved_by: quotation.approved_by ?? undefined,
			payment_method: normalizedPaymentMethod,
			document_type: quotation.document_type ?? 'boleta',
			purchase_order: quotation.purchase_order ?? '',
			payment_terms: quotation.payment_terms ?? 0,
			fixed_discount: quotation.fixed_discount ?? 0,
			items: ensureFormItems(filteredItems),
			customer: quotation.customer,
			items_count: quotation.items_count,
			can_convert: quotation.can_convert,
			is_converted_to_sale: quotation.is_converted_to_sale,
			converted_at: quotation.converted_at,
		};
	};

	if (!isOpen) return null;

	const handleCustomerCreated = async (customerId: number, customerName: string) => {
		const newOption = {
			value: String(customerId),
			label: customerName,
		};
		setCustomerOptions((prev) => {
			// Verificar si ya existe para evitar duplicados
			const exists = prev.find((opt) => opt.value === String(customerId));
			if (exists) return prev;
			return [...prev, newOption];
		});

		// Mostrar mensaje de éxito
		toast.success(`Cliente "${customerName}" creado y disponible`);
	};

	return (
		<>
			<Modal
				isOpen={isOpen}
				setIsOpen={onClose}
				size='2xl'
				isStaticBackdrop
				isStaticBackdropAnimation
				isAnimation={false}>
				<ModalHeader>
					<div>
						<Badge className='text-xl font-semibold'>Editar Cotización</Badge>
						<p className='text-sm'>Modifica los datos de la cotización seleccionada.</p>
					</div>
				</ModalHeader>

				<ModalBody>
					<Formik<FormQuotationValues>
						initialValues={getInitialValues()}
						validationSchema={quotationSchema}
						onSubmit={(values, { setSubmitting }) => {
							const sanitizedItems = sanitizeItemsForSubmit(values.items);

                            if (Number(values.payment_surcharge_amount) > 0) {
                                sanitizedItems.push({
                                    product_id: null,
                                    customer_name: 'Reajuste valor normal sin descuento transferencia',
                                    quantity: 1,
                                    unit_price: Number(values.payment_surcharge_amount),
                                    description: 'Reajuste por medio de pago seleccionado',
                                    customer_sku: 'RECARGO',
                                } as any);
                            }

							const normalizedPayment = Array.isArray(values.payment_method)
								? (values.payment_method[0] ?? null)
								: values.payment_method && String(values.payment_method).length > 0
									? values.payment_method
									: null;

							const normalizedDocument =
								values.document_type && String(values.document_type).length > 0
									? values.document_type
									: null;

							const payload = {
								...values,
								payment_method: normalizedPayment,
								document_type: normalizedDocument,
								items: sanitizedItems as any,
								tax_percentage: values.tax_percentage === IVA_RATE ? IVA_RATE : 0,
                                payment_surcharge_percentage: values.payment_surcharge_percentage,
                                payment_surcharge_amount: values.payment_surcharge_amount,
							};

							setPendingPayload(payload);
							setIsConfirmModalOpen(true);
							setSubmitting(false);
						}}
						enableReinitialize>
						{({ values, setFieldValue, errors, touched, handleSubmit }) => (
							<Form id='quotation-form' className='space-y-6' onSubmit={handleSubmit}>
                                <PaymentMethodSurchargeHandler values={values} setFieldValue={setFieldValue} />
								<GeneralInfoCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									customerOptions={customerOptions}
									subsidiaryId={subsidiaryId}
									onCustomerCreated={(customerId, customerName) => {
										handleCustomerCreated(customerId, customerName);
										// Usar setTimeout para asegurar que el DOM se actualice
										setTimeout(() => {
											setFieldValue('customer_id', customerId);
										}, 100);
									}}
								/>

								<PaymentInfoCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									paymentMethodOptions={paymentMethodOptions}
									paymentTermsOptions={paymentTermsOptions}
									statusOptions={statusOptions}
								/>

								<ItemsListCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									productOptions={productOptions}
									saleableProductsMap={saleableProductsMap}
								/>

								<TotalsCard
									values={values}
									setFieldValue={setFieldValue}
									IVA_RATE={IVA_RATE}
								/>
							</Form>
						)}
					</Formik>
				</ModalBody>

				<ModalFooter>
					<ModalFooterChild>
						<Button variant='outline' onClick={onClose} isDisable={loading}>
							Cancelar
						</Button>
						<Button
							onClick={() =>
								document
									.getElementById('quotation-form')
									?.dispatchEvent(
										new Event('submit', { bubbles: true, cancelable: true }),
									)
							}
							isLoading={loading}>
							Actualizar Cotización
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			<Modal
				isOpen={isConfirmModalOpen}
				setIsOpen={() => setIsConfirmModalOpen(false)}
				size='sm'
				isStaticBackdrop
				isStaticBackdropAnimation>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>Confirmar actualización</h3>
				</ModalHeader>
				<ModalBody>
					<p className='text-sm text-gray-600 dark:text-gray-200'>
						¿Deseas actualizar esta cotización con los cambios realizados?
					</p>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='outline'
							color='red'
							className='bg-red-400/20'
							onClick={() => {
								setPendingPayload(null);
								setIsConfirmModalOpen(false);
							}}>
							Cancelar
						</Button>
						<Button
							variant='outline'
							color='green'
							className='bg-green-400/20'
							onClick={() => {/**
 * Modal para EDITAR cotizaciones
 * Usa Formik + Yup, componentes UI (Card, SelectReact, etc.)
 */
import React, { useEffect } from 'react';
import { Formik, Form } from 'formik';
import { IQuote, QuoteStatus } from '../../../../../../interface';
import { toast } from 'react-toastify';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '../../../../../../components/ui/Modal';
import Button from '../../../../../../components/ui/Button';
import { TSelectOptions } from '../../../../../../components/form/SelectReact';
import { normalizeQuoteStatusValue } from '../../../constants/quoteStatuses';
import { selectPersonalizacionUsuario, useAppSelector } from '@/store';
import ApiService from '@/services/ApiService';
import Badge from '@/components/ui/Badge';

// Shared imports
import { FormQuotationValues, SaleableProduct } from '../shared/types';
import {
	quotationSchema,
	IVA_RATE,
	paymentMethodOptions,
	paymentTermsOptions,
	statusOptions,
} from '../shared/constants';
import {
	sanitizeItemsForSubmit,
	ensureFormItems,
	generateCustomerCreationPayload,
} from '../shared/helpers';
import GeneralInfoCard from '../shared/components/GeneralInfoCard';
import PaymentInfoCard from '../shared/components/PaymentInfoCard';
import ItemsListCard from '../shared/components/ItemsListCard';
import TotalsCard from '../shared/components/TotalsCard';

interface EditQuotationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (quotation: Omit<IQuote, 'id' | 'created_at' | 'updated_at'>) => void;
	quotation: IQuote;
	loading?: boolean;
}

const EditQuotationModal: React.FC<EditQuotationModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	quotation,
	loading = false,
}) => {
	const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
	const [pendingPayload, setPendingPayload] = React.useState<Omit<
		IQuote,
		'id' | 'created_at' | 'updated_at'
	> | null>(null);
	const personalizacion = useAppSelector(selectPersonalizacionUsuario);
	const user = useAppSelector((state) => state.auth.user);

	React.useEffect(() => {
		if (!isOpen) {
			setIsConfirmModalOpen(false);
			setPendingPayload(null);
		}
	}, [isOpen]);

	const subsidiaryId = personalizacion?.subsidiary_id || quotation.subsidiary_id || 1;
	const branchId =
		personalizacion?.sucursal_principal ||
		user?.branch?.id ||
		user?.personalizacion?.sucursal_principal ||
		0;

	const [customerOptions, setCustomerOptions] = React.useState<TSelectOptions>([]);
	const [productOptions, setProductOptions] = React.useState<TSelectOptions>([]);
	const [saleableProductsMap, setSaleableProductsMap] = React.useState<
		Record<number, SaleableProduct>
	>({});

	const ensureOptionExists = (
		options: TSelectOptions,
		value?: string | number | null,
		label?: string,
	): TSelectOptions => {
		if (!value) return options;
		const valueStr = String(value);
		if (options.some((opt) => opt.value === valueStr)) {
			return options;
		}
		return [
			...options,
			{
				value: valueStr,
				label: label || valueStr,
			},
		];
	};

	useEffect(() => {
		const fetchClientes = async () => {
			try {
				const clientes = await ApiService.fetchNormalized({
					url: `/subsidiaries/${subsidiaryId}/customer-sales/overview?per_page=1000`,
					method: 'GET',
				});

				const payload = Array.isArray(clientes?.data)
					? clientes.data
					: Array.isArray(clientes)
						? clientes
						: [];

				let options: TSelectOptions = payload.map((c: any) => ({
					value: String(c.id),
					label: c.name || c.contact?.name || 'Cliente sin nombre',
				}));

				if (quotation?.customer_id) {
					options = ensureOptionExists(
						options,
						quotation.customer_id,
						(quotation.customer as any)?.name || 'Cliente seleccionado',
					);
				}

				setCustomerOptions(options);
			} catch (error) {
				console.error('Error cargando clientes:', error);
			}
		};

		if (isOpen) fetchClientes();
	}, [subsidiaryId, isOpen, quotation]);

	useEffect(() => {
		const fetchProductos = async () => {
			if (!branchId) return;
			try {
				const response = await ApiService.fetchNormalized({
					url: `/branches/${branchId}/products/saleables`,
					method: 'GET',
				});

				const saleables: SaleableProduct[] = Array.isArray(response)
					? response
					: Array.isArray(response?.data)
						? response.data
						: [];

				const mapped: Record<number, SaleableProduct> = {};
				saleables.forEach((product) => {
					if (product?.id) {
						mapped[product.id] = product;
					}
				});

				let options: TSelectOptions = saleables.map((p) => ({
					value: String(p.id),
					label: `${p.name} · Stock ${p.stock ?? 0}`,
				}));

				// Asegurar que productos de la cotización existan aunque no estén en los saleables actuales
				(quotation?.items || []).forEach((item) => {
					const pid = item.product_id ? Number(item.product_id) : null;
					if (!pid) return;
					if (!mapped[pid]) {
						mapped[pid] = {
							id: pid,
							sku: item.product?.sku || item.customer_sku || '',
							name: item.product?.name || item.customer_name || `Producto ${pid}`,
							stock: 0,
							unit_price_net: Number(item.unit_price) || 0,
							unit_price_gross: Number(
								(item as any).unit_price_gross || item.total || 0,
							),
						};
					}
					options = ensureOptionExists(
						options,
						pid,
						mapped[pid].name || `Producto ${pid}`,
					);
				});

				setSaleableProductsMap(mapped);
				setProductOptions(options);
			} catch (error) {
				console.error('Error cargando productos:', error);
			}
		};

		if (isOpen && branchId) fetchProductos();
	}, [branchId, isOpen, quotation]);

    // Handle automatic surcharge updates
    const PaymentMethodSurchargeHandler = ({ values, setFieldValue }: { values: FormQuotationValues, setFieldValue: any }) => {
        useEffect(() => {
             const method = Array.isArray(values.payment_method) ? values.payment_method[0] : values.payment_method;
             
             if (!method) return;

             // Exclude surcharge for 'efectivo' and 'transferencia'
             const EXEMPT_METHODS = ['efectivo', 'transferencia'];
             const shouldApplySurcharge = !EXEMPT_METHODS.includes(method.toLowerCase());

             if (shouldApplySurcharge) {
                 // Set default 3% only if it was 0 or undefined, AND we are not loading an existing non-zero value
                 // For edit mode, we trust the existing value unless it's 0 and valid for surcharge
                 if (!values.payment_surcharge_percentage && values.payment_surcharge_percentage !== 0) {
                     setFieldValue('payment_surcharge_percentage', 3);
                 }
                 // If it is 0 but method requires it, maybe we should default to 3? 
                 // User might have explicitly set 0. Let's respect explicit 0 if possible? 
                 // Actually prompt says "automatic". Let's set 3 if 0.
                 if (values.payment_surcharge_percentage === 0) {
                     setFieldValue('payment_surcharge_percentage', 3);
                 }
             } else {
                 // Reset availability of surcharge if exempt
                 if (values.payment_surcharge_percentage !== 0) {
                     setFieldValue('payment_surcharge_percentage', 0);
                 }
             }
        }, [values.payment_method]); // Listen only to payment_method changes

        return null;
    };

	// Valores iniciales para EDITAR cotización
	const getInitialValues = (): FormQuotationValues => {
		const today = new Date().toISOString().split('T')[0];
		const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split('T')[0];

		const numericDiscountPct = Number(
			quotation.discount_percentage ?? quotation.discount_rate ?? 0,
		);
		const numericTaxPct = Number(quotation.tax_percentage ?? quotation.tax_rate ?? 0);

		const normalizedPaymentMethod = Array.isArray(quotation.payment_method)
			? (quotation.payment_method[0] ?? null)
			: (quotation.payment_method ?? null);

        // Filter out surcharge items to prevent duplication/display in items list
        const filteredItems = (quotation.items || []).filter(item => item.customer_sku !== 'RECARGO');

		return {
			subsidiary_id: quotation.subsidiary_id ?? personalizacion?.subsidiary_id ?? 1,
			customer_id: quotation.customer_id ?? 0,
			quote_date: quotation.quote_date ?? today,
			expiry_date: quotation.expiry_date ?? quotation.valid_until ?? expiryDate,
			status: normalizeQuoteStatusValue(quotation.status) as QuoteStatus,
			subtotal: Number(quotation.subtotal ?? 0),
			tax_rate: Number(quotation.tax_rate ?? numericTaxPct ?? 0),
			tax_amount: Number(quotation.tax_amount ?? 0),
			discount_amount: Number(quotation.discount_amount ?? 0),
			discount_percentage: numericDiscountPct,
			tax_percentage: numericTaxPct > 0 ? IVA_RATE : 0,
			total_amount: Number(quotation.total_amount ?? 0),
            payment_surcharge_percentage: Number(quotation.payment_surcharge_percentage ?? 0),
            payment_surcharge_amount: Number(quotation.payment_surcharge_amount ?? 0),
			notes: quotation.notes ?? '',
			created_by: quotation.created_by ?? user?.id ?? undefined,
			approved_by: quotation.approved_by ?? undefined,
			payment_method: normalizedPaymentMethod,
			document_type: quotation.document_type ?? 'boleta',
			purchase_order: quotation.purchase_order ?? '',
			payment_terms: quotation.payment_terms ?? 0,
			fixed_discount: quotation.fixed_discount ?? 0,
			items: ensureFormItems(filteredItems),
			customer: quotation.customer,
			items_count: quotation.items_count,
			can_convert: quotation.can_convert,
			is_converted_to_sale: quotation.is_converted_to_sale,
			converted_at: quotation.converted_at,
		};
	};

	if (!isOpen) return null;

	const handleCustomerCreated = async (customerId: number, customerName: string) => {
		const newOption = {
			value: String(customerId),
			label: customerName,
		};
		setCustomerOptions((prev) => {
			// Verificar si ya existe para evitar duplicados
			const exists = prev.find((opt) => opt.value === String(customerId));
			if (exists) return prev;
			return [...prev, newOption];
		});

		// Mostrar mensaje de éxito
		toast.success(`Cliente "${customerName}" creado y disponible`);
	};

	return (
		<>
			<Modal
				isOpen={isOpen}
				setIsOpen={onClose}
				size='2xl'
				isStaticBackdrop
				isStaticBackdropAnimation
				isAnimation={false}>
				<ModalHeader>
					<div>
						<Badge className='text-xl font-semibold'>Editar Cotización</Badge>
						<p className='text-sm'>Modifica los datos de la cotización seleccionada.</p>
					</div>
				</ModalHeader>

				<ModalBody>
					<Formik<FormQuotationValues>
						initialValues={getInitialValues()}
						validationSchema={quotationSchema}
						onSubmit={(values, { setSubmitting }) => {
							const sanitizedItems = sanitizeItemsForSubmit(values.items);

                            if (Number(values.payment_surcharge_amount) > 0) {
                                sanitizedItems.push({
                                    product_id: null,
                                    customer_name: 'Reajuste valor normal sin descuento transferencia',
                                    quantity: 1,
                                    unit_price: Number(values.payment_surcharge_amount),
                                    description: 'Reajuste por medio de pago seleccionado',
                                    customer_sku: 'RECARGO',
                                } as any);
                            }

							const normalizedPayment = Array.isArray(values.payment_method)
								? (values.payment_method[0] ?? null)
								: values.payment_method && String(values.payment_method).length > 0
									? values.payment_method
									: null;

							const normalizedDocument =
								values.document_type && String(values.document_type).length > 0
									? values.document_type
									: null;

							const payload = {
								...values,
								payment_method: normalizedPayment,
								document_type: normalizedDocument,
								items: sanitizedItems as any,
								tax_percentage: values.tax_percentage === IVA_RATE ? IVA_RATE : 0,
                                payment_surcharge_percentage: values.payment_surcharge_percentage,
                                payment_surcharge_amount: values.payment_surcharge_amount,
							};

							setPendingPayload(payload);
							setIsConfirmModalOpen(true);
							setSubmitting(false);
						}}
						enableReinitialize>
						{({ values, setFieldValue, errors, touched, handleSubmit }) => (
							<Form id='quotation-form' className='space-y-6' onSubmit={handleSubmit}>
                                <PaymentMethodSurchargeHandler values={values} setFieldValue={setFieldValue} />
								<GeneralInfoCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									customerOptions={customerOptions}
									subsidiaryId={subsidiaryId}
									onCustomerCreated={(customerId, customerName) => {
										handleCustomerCreated(customerId, customerName);
										// Usar setTimeout para asegurar que el DOM se actualice
										setTimeout(() => {
											setFieldValue('customer_id', customerId);
										}, 100);
									}}
								/>

								<PaymentInfoCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									paymentMethodOptions={paymentMethodOptions}
									paymentTermsOptions={paymentTermsOptions}
									statusOptions={statusOptions}
								/>

								<ItemsListCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									productOptions={productOptions}
									saleableProductsMap={saleableProductsMap}
								/>

								<TotalsCard
									values={values}
									setFieldValue={setFieldValue}
									IVA_RATE={IVA_RATE}
								/>
							</Form>
						)}
					</Formik>
				</ModalBody>

				<ModalFooter>
					<ModalFooterChild>
						<Button variant='outline' onClick={onClose} isDisable={loading}>
							Cancelar
						</Button>
						<Button
							onClick={() =>
								document
									.getElementById('quotation-form')
									?.dispatchEvent(
										new Event('submit', { bubbles: true, cancelable: true }),
									)
							}
							isLoading={loading}>
							Actualizar Cotización
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			<Modal
				isOpen={isConfirmModalOpen}
				setIsOpen={() => setIsConfirmModalOpen(false)}
				size='sm'
				isStaticBackdrop
				isStaticBackdropAnimation>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>Confirmar actualización</h3>
				</ModalHeader>
				<ModalBody>
					<p className='text-sm text-gray-600 dark:text-gray-200'>
						¿Deseas actualizar esta cotización con los cambios realizados?
					</p>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='outline'
							color='red'
							className='bg-red-400/20'
							onClick={() => {
								setPendingPayload(null);
								setIsConfirmModalOpen(false);
							}}>
							Cancelar
						</Button>
						<Button
							variant='outline'
							color='green'
							className='bg-green-400/20'
							onClick={() => {
								if (!pendingPayload) return;
								onSubmit(pendingPayload);
								setPendingPayload(null);
								setIsConfirmModalOpen(false);
							}}>
							Confirmar
						</Button>
					</ModalFooter/**
 * Modal para EDITAR cotizaciones
 * Usa Formik + Yup, componentes UI (Card, SelectReact, etc.)
 */
import React, { useEffect } from 'react';
import { Formik, Form } from 'formik';
import { IQuote, QuoteStatus } from '../../../../../../interface';
import { toast } from 'react-toastify';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '../../../../../../components/ui/Modal';
import Button from '../../../../../../components/ui/Button';
import { TSelectOptions } from '../../../../../../components/form/SelectReact';
import { normalizeQuoteStatusValue } from '../../../constants/quoteStatuses';
import { selectPersonalizacionUsuario, useAppSelector } from '@/store';
import ApiService from '@/services/ApiService';
import Badge from '@/components/ui/Badge';

// Shared imports
import { FormQuotationValues, SaleableProduct } from '../shared/types';
import {
	quotationSchema,
	IVA_RATE,
	paymentMethodOptions,
	paymentTermsOptions,
	statusOptions,
} from '../shared/constants';
import {
	sanitizeItemsForSubmit,
	ensureFormItems,
	generateCustomerCreationPayload,
} from '../shared/helpers';
import GeneralInfoCard from '../shared/components/GeneralInfoCard';
import PaymentInfoCard from '../shared/components/PaymentInfoCard';
import ItemsListCard from '../shared/components/ItemsListCard';
import TotalsCard from '../shared/components/TotalsCard';

interface EditQuotationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (quotation: Omit<IQuote, 'id' | 'created_at' | 'updated_at'>) => void;
	quotation: IQuote;
	loading?: boolean;
}

const EditQuotationModal: React.FC<EditQuotationModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	quotation,
	loading = false,
}) => {
	const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
	const [pendingPayload, setPendingPayload] = React.useState<Omit<
		IQuote,
		'id' | 'created_at' | 'updated_at'
	> | null>(null);
	const personalizacion = useAppSelector(selectPersonalizacionUsuario);
	const user = useAppSelector((state) => state.auth.user);

	React.useEffect(() => {
		if (!isOpen) {
			setIsConfirmModalOpen(false);
			setPendingPayload(null);
		}
	}, [isOpen]);

	const subsidiaryId = personalizacion?.subsidiary_id || quotation.subsidiary_id || 1;
	const branchId =
		personalizacion?.sucursal_principal ||
		user?.branch?.id ||
		user?.personalizacion?.sucursal_principal ||
		0;

	const [customerOptions, setCustomerOptions] = React.useState<TSelectOptions>([]);
	const [productOptions, setProductOptions] = React.useState<TSelectOptions>([]);
	const [saleableProductsMap, setSaleableProductsMap] = React.useState<
		Record<number, SaleableProduct>
	>({});

	const ensureOptionExists = (
		options: TSelectOptions,
		value?: string | number | null,
		label?: string,
	): TSelectOptions => {
		if (!value) return options;
		const valueStr = String(value);
		if (options.some((opt) => opt.value === valueStr)) {
			return options;
		}
		return [
			...options,
			{
				value: valueStr,
				label: label || valueStr,
			},
		];
	};

	useEffect(() => {
		const fetchClientes = async () => {
			try {
				const clientes = await ApiService.fetchNormalized({
					url: `/subsidiaries/${subsidiaryId}/customer-sales/overview?per_page=1000`,
					method: 'GET',
				});

				const payload = Array.isArray(clientes?.data)
					? clientes.data
					: Array.isArray(clientes)
						? clientes
						: [];

				let options: TSelectOptions = payload.map((c: any) => ({
					value: String(c.id),
					label: c.name || c.contact?.name || 'Cliente sin nombre',
				}));

				if (quotation?.customer_id) {
					options = ensureOptionExists(
						options,
						quotation.customer_id,
						(quotation.customer as any)?.name || 'Cliente seleccionado',
					);
				}

				setCustomerOptions(options);
			} catch (error) {
				console.error('Error cargando clientes:', error);
			}
		};

		if (isOpen) fetchClientes();
	}, [subsidiaryId, isOpen, quotation]);

	useEffect(() => {
		const fetchProductos = async () => {
			if (!branchId) return;
			try {
				const response = await ApiService.fetchNormalized({
					url: `/branches/${branchId}/products/saleables`,
					method: 'GET',
				});

				const saleables: SaleableProduct[] = Array.isArray(response)
					? response
					: Array.isArray(response?.data)
						? response.data
						: [];

				const mapped: Record<number, SaleableProduct> = {};
				saleables.forEach((product) => {
					if (product?.id) {
						mapped[product.id] = product;
					}
				});

				let options: TSelectOptions = saleables.map((p) => ({
					value: String(p.id),
					label: `${p.name} · Stock ${p.stock ?? 0}`,
				}));

				// Asegurar que productos de la cotización existan aunque no estén en los saleables actuales
				(quotation?.items || []).forEach((item) => {
					const pid = item.product_id ? Number(item.product_id) : null;
					if (!pid) return;
					if (!mapped[pid]) {
						mapped[pid] = {
							id: pid,
							sku: item.product?.sku || item.customer_sku || '',
							name: item.product?.name || item.customer_name || `Producto ${pid}`,
							stock: 0,
							unit_price_net: Number(item.unit_price) || 0,
							unit_price_gross: Number(
								(item as any).unit_price_gross || item.total || 0,
							),
						};
					}
					options = ensureOptionExists(
						options,
						pid,
						mapped[pid].name || `Producto ${pid}`,
					);
				});

				setSaleableProductsMap(mapped);
				setProductOptions(options);
			} catch (error) {
				console.error('Error cargando productos:', error);
			}
		};

		if (isOpen && branchId) fetchProductos();
	}, [branchId, isOpen, quotation]);

    // Handle automatic surcharge updates
    const PaymentMethodSurchargeHandler = ({ values, setFieldValue }: { values: FormQuotationValues, setFieldValue: any }) => {
        useEffect(() => {
             const method = Array.isArray(values.payment_method) ? values.payment_method[0] : values.payment_method;
             
             if (!method) return;

             // Exclude surcharge for 'efectivo' and 'transferencia'
             const EXEMPT_METHODS = ['efectivo', 'transferencia'];
             const shouldApplySurcharge = !EXEMPT_METHODS.includes(method.toLowerCase());

             if (shouldApplySurcharge) {
                 // Set default 3% only if it was 0 or undefined, AND we are not loading an existing non-zero value
                 // For edit mode, we trust the existing value unless it's 0 and valid for surcharge
                 if (!values.payment_surcharge_percentage && values.payment_surcharge_percentage !== 0) {
                     setFieldValue('payment_surcharge_percentage', 3);
                 }
                 // If it is 0 but method requires it, maybe we should default to 3? 
                 // User might have explicitly set 0. Let's respect explicit 0 if possible? 
                 // Actually prompt says "automatic". Let's set 3 if 0.
                 if (values.payment_surcharge_percentage === 0) {
                     setFieldValue('payment_surcharge_percentage', 3);
                 }
             } else {
                 // Reset availability of surcharge if exempt
                 if (values.payment_surcharge_percentage !== 0) {
                     setFieldValue('payment_surcharge_percentage', 0);
                 }
             }
        }, [values.payment_method]); // Listen only to payment_method changes

        return null;
    };

	// Valores iniciales para EDITAR cotización
	const getInitialValues = (): FormQuotationValues => {
		const today = new Date().toISOString().split('T')[0];
		const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split('T')[0];

		const numericDiscountPct = Number(
			quotation.discount_percentage ?? quotation.discount_rate ?? 0,
		);
		const numericTaxPct = Number(quotation.tax_percentage ?? quotation.tax_rate ?? 0);

		const normalizedPaymentMethod = Array.isArray(quotation.payment_method)
			? (quotation.payment_method[0] ?? null)
			: (quotation.payment_method ?? null);

        // Filter out surcharge items to prevent duplication/display in items list
        const filteredItems = (quotation.items || []).filter(item => item.customer_sku !== 'RECARGO');

		return {
			subsidiary_id: quotation.subsidiary_id ?? personalizacion?.subsidiary_id ?? 1,
			customer_id: quotation.customer_id ?? 0,
			quote_date: quotation.quote_date ?? today,
			expiry_date: quotation.expiry_date ?? quotation.valid_until ?? expiryDate,
			status: normalizeQuoteStatusValue(quotation.status) as QuoteStatus,
			subtotal: Number(quotation.subtotal ?? 0),
			tax_rate: Number(quotation.tax_rate ?? numericTaxPct ?? 0),
			tax_amount: Number(quotation.tax_amount ?? 0),
			discount_amount: Number(quotation.discount_amount ?? 0),
			discount_percentage: numericDiscountPct,
			tax_percentage: numericTaxPct > 0 ? IVA_RATE : 0,
			total_amount: Number(quotation.total_amount ?? 0),
            payment_surcharge_percentage: Number(quotation.payment_surcharge_percentage ?? 0),
            payment_surcharge_amount: Number(quotation.payment_surcharge_amount ?? 0),
			notes: quotation.notes ?? '',
			created_by: quotation.created_by ?? user?.id ?? undefined,
			approved_by: quotation.approved_by ?? undefined,
			payment_method: normalizedPaymentMethod,
			document_type: quotation.document_type ?? 'boleta',
			purchase_order: quotation.purchase_order ?? '',
			payment_terms: quotation.payment_terms ?? 0,
			fixed_discount: quotation.fixed_discount ?? 0,
			items: ensureFormItems(filteredItems),
			customer: quotation.customer,
			items_count: quotation.items_count,
			can_convert: quotation.can_convert,
			is_converted_to_sale: quotation.is_converted_to_sale,
			converted_at: quotation.converted_at,
		};
	};

	if (!isOpen) return null;

	const handleCustomerCreated = async (customerId: number, customerName: string) => {
		const newOption = {
			value: String(customerId),
			label: customerName,
		};
		setCustomerOptions((prev) => {
			// Verificar si ya existe para evitar duplicados
			const exists = prev.find((opt) => opt.value === String(customerId));
			if (exists) return prev;
			return [...prev, newOption];
		});

		// Mostrar mensaje de éxito
		toast.success(`Cliente "${customerName}" creado y disponible`);
	};

	return (
		<>
			<Modal
				isOpen={isOpen}
				setIsOpen={onClose}
				size='2xl'
				isStaticBackdrop
				isStaticBackdropAnimation
				isAnimation={false}>
				<ModalHeader>
					<div>
						<Badge className='text-xl font-semibold'>Editar Cotización</Badge>
						<p className='text-sm'>Modifica los datos de la cotización seleccionada.</p>
					</div>
				</ModalHeader>

				<ModalBody>
					<Formik<FormQuotationValues>
						initialValues={getInitialValues()}
						validationSchema={quotationSchema}
						onSubmit={(values, { setSubmitting }) => {
							const sanitizedItems = sanitizeItemsForSubmit(values.items);

                            if (Number(values.payment_surcharge_amount) > 0) {
                                sanitizedItems.push({
                                    product_id: null,
                                    customer_name: 'Reajuste valor normal sin descuento transferencia',
                                    quantity: 1,
                                    unit_price: Number(values.payment_surcharge_amount),
                                    description: 'Reajuste por medio de pago seleccionado',
                                    customer_sku: 'RECARGO',
                                } as any);
                            }

							const normalizedPayment = Array.isArray(values.payment_method)
								? (values.payment_method[0] ?? null)
								: values.payment_method && String(values.payment_method).length > 0
									? values.payment_method
									: null;

							const normalizedDocument =
								values.document_type && String(values.document_type).length > 0
									? values.document_type
									: null;

							const payload = {
								...values,
								payment_method: normalizedPayment,
								document_type: normalizedDocument,
								items: sanitizedItems as any,
								tax_percentage: values.tax_percentage === IVA_RATE ? IVA_RATE : 0,
                                payment_surcharge_percentage: values.payment_surcharge_percentage,
                                payment_surcharge_amount: values.payment_surcharge_amount,
							};

							setPendingPayload(payload);
							setIsConfirmModalOpen(true);
							setSubmitting(false);
						}}
						enableReinitialize>
						{({ values, setFieldValue, errors, touched, handleSubmit }) => (
							<Form id='quotation-form' className='space-y-6' onSubmit={handleSubmit}>
                                <PaymentMethodSurchargeHandler values={values} setFieldValue={setFieldValue} />
								<GeneralInfoCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									customerOptions={customerOptions}
									subsidiaryId={subsidiaryId}
									onCustomerCreated={(customerId, customerName) => {
										handleCustomerCreated(customerId, customerName);
										// Usar setTimeout para asegurar que el DOM se actualice
										setTimeout(() => {
											setFieldValue('customer_id', customerId);
										}, 100);
									}}
								/>

								<PaymentInfoCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									paymentMethodOptions={paymentMethodOptions}
									paymentTermsOptions={paymentTermsOptions}
									statusOptions={statusOptions}
								/>

								<ItemsListCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									productOptions={productOptions}
									saleableProductsMap={saleableProductsMap}
								/>

								<TotalsCard
									values={values}
									setFieldValue={setFieldValue}
									IVA_RATE={IVA_RATE}
								/>
							</Form>
						)}
					</Formik>
				</ModalBody>

				<ModalFooter>
					<ModalFooterChild>
						<Button variant='outline' onClick={onClose} isDisable={loading}>
							Cancelar
						</Button>
						<Button
							onClick={() =>
								document
									.getElementById('quotation-form')
									?.dispatchEvent(
										new Event('submit', { bubbles: true, cancelable: true }),
									)
							}
							isLoading={loading}>
							Actualizar Cotización
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>

			<Modal
				isOpen={isConfirmModalOpen}
				setIsOpen={() => setIsConfirmModalOpen(false)}
				size='sm'
				isStaticBackdrop
				isStaticBackdropAnimation>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>Confirmar actualización</h3>
				</ModalHeader>
				<ModalBody>
					<p className='text-sm text-gray-600 dark:text-gray-200'>
						¿Deseas actualizar esta cotización con los cambios realizados?
					</p>
				</ModalBody>
				<ModalFooter>
					<ModalFooterChild>
						<Button
							variant='outline'
							color='red'
							className='bg-red-400/20'
							onClick={() => {
								setPendingPayload(null);
								setIsConfirmModalOpen(false);
							}}>
							Cancelar
						</Button>
						<Button
							variant='outline'
							color='green'
							className='bg-green-400/20'
							onClick={() => {
								if (!pendingPayload) return;
								onSubmit(pendingPayload);
								setPendingPayload(null);
								setIsConfirmModalOpen(false);
							}}>
							Confirmar
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default EditQuotationModal;
Child>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default EditQuotationModal;

								if (!pendingPayload) return;
								onSubmit(pendingPayload);
								setPendingPayload(null);
								setIsConfirmModalOpen(false);
							}}>
							Confirmar
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default EditQuotationModal;
setIsConfirmModalOpen(false);
							}}>
							Confirmar
						</Button>
					</ModalFooterChild>
				</ModalFooter>
			</Modal>
		</>
	);
};

export default EditQuotationModal;
