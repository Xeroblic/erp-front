/**
 * Modal para EDITAR cotizaciones
 * Usa Formik + Yup, componentes UI (Card, SelectReact, etc.)
 */
import React, { useEffect } from 'react';
import { Formik, Form } from 'formik';
import { useAppSelector } from '@/store';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import ApiService from '@/services/ApiService';
import {
	formatCustomerLabel,
	type CustomerSaleOption,
} from '@/components/customers/CustomerSaleSelect';
import { IQuote, QuoteStatus } from '../../../../../../interface';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '../../../../../../components/ui/Modal';
import Button from '../../../../../../components/ui/Button';
import { TSelectOptions } from '../../../../../../components/form/SelectReact';
import { normalizeQuoteStatusValue } from '../../../constants/quoteStatuses';

// Shared imports
import { FormQuotationValues, SaleableProduct } from '../shared/types';
import {
	quotationSchema,
	IVA_RATE,
	DEFAULT_PAYMENT_METHOD,
	EXEMPT_PAYMENT_METHODS,
	paymentMethodOptions,
	paymentTermsOptions,
	statusOptions,
} from '../shared/constants';
import { sanitizeItemsForSubmit, ensureFormItems } from '../shared/helpers';
import GeneralInfoCard from '../shared/components/GeneralInfoCard';
import PaymentInfoCard from '../shared/components/PaymentInfoCard';
import ItemsListCard from '../shared/components/ItemsListCard';
import TotalsCard from '../shared/components/TotalsCard';

/**
 * `IQuote['customer']` admite dos formas (`QuoteCustomerSummary` o `ICustomer`), así que
 * los campos se leen por nombre sin asumir cuál llegó.
 */
const asCustomerRecord = (value: unknown): Record<string, unknown> | undefined =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;

const readCustomerString = (
	customer: Record<string, unknown> | undefined,
	key: string,
): string | undefined =>
	typeof customer?.[key] === 'string' ? (customer[key] as string) : undefined;

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
	const user = useAppSelector((state) => state.auth.user);
	const { branchId, subsidiaryId: currentSubsidiaryId } = useCurrentBranch();

	React.useEffect(() => {
		if (!isOpen) {
			setIsConfirmModalOpen(false);
			setPendingPayload(null);
		}
	}, [isOpen]);

	const subsidiaryId = currentSubsidiaryId ?? quotation.subsidiary_id ?? null;

	/** El cliente ya guardado debe seguir visible aunque la búsqueda no lo devuelva. */
	const savedCustomerOption = React.useMemo<CustomerSaleOption | null>(() => {
		const customer = asCustomerRecord(quotation.customer);
		if (!quotation.customer_id) return null;
		return {
			id: quotation.customer_id,
			label:
				formatCustomerLabel(
					readCustomerString(customer, 'billing_company'),
					readCustomerString(customer, 'contact_name'),
					readCustomerString(customer, 'name'),
					readCustomerString(customer, 'rut'),
				) || 'Cliente seleccionado',
			isActive: true,
		};
	}, [quotation.customer, quotation.customer_id]);

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
	const PaymentMethodSurchargeHandler = ({
		values,
		setFieldValue,
	}: {
		values: FormQuotationValues;
		setFieldValue: any;
	}) => {
		useEffect(() => {
			const method = Array.isArray(values.payment_method)
				? values.payment_method[0]
				: values.payment_method;

			if (!method) return;

			const shouldApplySurcharge = !EXEMPT_PAYMENT_METHODS.includes(method.toLowerCase());

			if (shouldApplySurcharge) {
				// Set default 3% only if it was 0 or undefined, AND we are not loading an existing non-zero value
				// For edit mode, we trust the existing value unless it's 0 and valid for surcharge
				if (
					!values.payment_surcharge_percentage &&
					values.payment_surcharge_percentage !== 0
				) {
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

		const savedCustomer = asCustomerRecord(quotation.customer);
		const numericDiscountPct = Number(
			quotation.discount_percentage ?? quotation.discount_rate ?? 0,
		);
		const numericTaxPct = Number(quotation.tax_percentage ?? quotation.tax_rate ?? 0);

		// Se respeta lo guardado; sólo una cotización sin medio de pago cae al default.
		const savedPaymentMethod = Array.isArray(quotation.payment_method)
			? (quotation.payment_method[0] ?? null)
			: (quotation.payment_method ?? null);
		const normalizedPaymentMethod = savedPaymentMethod || DEFAULT_PAYMENT_METHOD;

		// Filter out surcharge items to prevent duplication/display in items list
		const filteredItems = (quotation.items || []).filter(
			(item) => item.customer_sku !== 'RECARGO',
		);

		return {
			subsidiary_id: quotation.subsidiary_id ?? currentSubsidiaryId ?? 1,
			customer_id: quotation.customer_id ?? 0,
			customer_rut:
				readCustomerString(savedCustomer, 'rut') ??
				readCustomerString(savedCustomer, 'document_number') ??
				'',
			customer_giro:
				readCustomerString(savedCustomer, 'giro') ??
				readCustomerString(savedCustomer, 'trade_activity') ??
				'',
			customer_shipping_address:
				readCustomerString(savedCustomer, 'shipping_address_1') ??
				readCustomerString(savedCustomer, 'address') ??
				'',
			customer_billing_address:
				readCustomerString(savedCustomer, 'billing_address_1') ??
				readCustomerString(savedCustomer, 'address') ??
				'',
			customer_contact_name:
				readCustomerString(savedCustomer, 'contact_name') ??
				readCustomerString(savedCustomer, 'name') ??
				'',
			customer_email: readCustomerString(savedCustomer, 'email') ?? '',
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

	return (
		<>
			<Modal
				isOpen={isOpen}
				setIsOpen={onClose}
				size='2xl'
				isScrollable
				isStaticBackdrop
				isStaticBackdropAnimation
				isAnimation={false}>
				<ModalHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-700'>
					<div>
						<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
							Editar cotización
						</h2>
						<p className='text-sm font-normal text-zinc-600 dark:text-zinc-400'>
							Modifica los datos de la cotización seleccionada.
						</p>
					</div>
				</ModalHeader>
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
						<Form
							className='flex min-h-0 flex-1 flex-col overflow-hidden'
							onSubmit={handleSubmit}>
							<ModalBody className='min-h-0 flex-1 space-y-5 overflow-y-auto bg-zinc-50 dark:bg-zinc-950'>
								<PaymentMethodSurchargeHandler
									values={values}
									setFieldValue={setFieldValue}
								/>
								<GeneralInfoCard
									values={values}
									setFieldValue={setFieldValue}
									errors={errors}
									touched={touched}
									subsidiaryId={subsidiaryId}
									isActive={isOpen}
									fallbackCustomerOption={savedCustomerOption}
									paymentMethodOptions={paymentMethodOptions}
									paymentTermsOptions={paymentTermsOptions}
									statusOptions={statusOptions}
								/>
								<ItemsListCard
									values={values}
									setFieldValue={setFieldValue}
									productOptions={productOptions}
									saleableProductsMap={saleableProductsMap}
								/>
								<div className='grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr] xl:items-start'>
									<PaymentInfoCard
										values={values}
										setFieldValue={setFieldValue}
									/>
									<TotalsCard
										values={values}
										setFieldValue={setFieldValue}
										IVA_RATE={IVA_RATE}
									/>
								</div>
							</ModalBody>
							<ModalFooter className='shrink-0 border-t border-zinc-200 bg-white pt-4 dark:border-zinc-700 dark:bg-zinc-950'>
								<ModalFooterChild>
									<Button
										type='button'
										variant='outline'
										isDisable={loading}
										onClick={onClose}>
										Cancelar
									</Button>
								</ModalFooterChild>
								<ModalFooterChild>
									<Button
										type='submit'
										variant='solid'
										color='blue'
										icon='HeroCheck'
										isLoading={loading}
										isDisable={loading}>
										Guardar cambios
									</Button>
								</ModalFooterChild>
							</ModalFooter>
						</Form>
					)}
				</Formik>
			</Modal>

			<Modal
				isOpen={isConfirmModalOpen}
				setIsOpen={() => setIsConfirmModalOpen(false)}
				size='sm'
				isStaticBackdrop
				isStaticBackdropAnimation>
				<ModalHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-700'>
					<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
						Confirmar actualización
					</h2>
				</ModalHeader>
				<ModalBody>
					<p className='text-sm text-zinc-600 dark:text-zinc-400'>
						¿Deseas actualizar esta cotización con los cambios realizados?
					</p>
				</ModalBody>
				<ModalFooter className='border-t border-zinc-200 pt-4 dark:border-zinc-700'>
					<ModalFooterChild>
						<Button
							type='button'
							variant='outline'
							onClick={() => {
								setPendingPayload(null);
								setIsConfirmModalOpen(false);
							}}>
							Cancelar
						</Button>
					</ModalFooterChild>
					<ModalFooterChild>
						<Button
							type='button'
							variant='solid'
							color='blue'
							icon='HeroCheck'
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
