import React, { useEffect } from 'react';
import { Formik, Form } from 'formik';
import { IQuote, QuoteStatus } from '@/interface';
import { toast } from 'react-toastify';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TSelectOptions } from '@/components/form/SelectReact';
import { useAppSelector } from '@/store';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import ApiService from '@/services/ApiService';

// Shared imports
import { FormQuotationValues, SaleableProduct } from '../shared/types';
import {
	quotationSchema,
	IVA_RATE,
	DEFAULT_PAYMENT_METHOD,
	EMPTY_PRODUCT_ITEM,
	EXEMPT_PAYMENT_METHODS,
	paymentMethodOptions,
	paymentTermsOptions,
	statusOptions,
} from '../shared/constants';
import { sanitizeItemsForSubmit } from '../shared/helpers';
import GeneralInfoCard from '../shared/components/GeneralInfoCard';
import PaymentInfoCard from '../shared/components/PaymentInfoCard';
import ItemsListCard from '../shared/components/ItemsListCard';
import TotalsCard from '../shared/components/TotalsCard';

interface CreateQuotationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (quotation: Omit<IQuote, 'id' | 'created_at' | 'updated_at'>) => void;
	loading?: boolean;
}

const CreateQuotationModal: React.FC<CreateQuotationModalProps> = ({
	isOpen,
	onClose,
	onSubmit,
	loading = false,
}) => {
	const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
	const [pendingPayload, setPendingPayload] = React.useState<Omit<
		IQuote,
		'id' | 'created_at' | 'updated_at'
	> | null>(null);
	const user = useAppSelector((state) => state.auth.user);
	const { branchId, subsidiaryId } = useCurrentBranch();

	React.useEffect(() => {
		if (!isOpen) {
			setIsConfirmModalOpen(false);
			setPendingPayload(null);
		}
	}, [isOpen]);

	const [productOptions, setProductOptions] = React.useState<TSelectOptions>([]);
	const [saleableProductsMap, setSaleableProductsMap] = React.useState<
		Record<number, SaleableProduct>
	>({});

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

				const options: TSelectOptions = saleables.map((p) => ({
					value: String(p.id),
					label: `${p.name} · Stock ${p.stock ?? 0}`,
				}));

				setSaleableProductsMap(mapped);
				setProductOptions(options);
			} catch (error) {
				console.error('Error cargando productos:', error);
			}
		};

		if (isOpen && branchId) fetchProductos();
		if (isOpen && branchId) fetchProductos();
	}, [branchId, isOpen]);

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
				// Set default 3% if currently 0 (or undefined)
				if (!values.payment_surcharge_percentage) {
					setFieldValue('payment_surcharge_percentage', 3);
				}
			} else {
				// Reset availability of surcharge if exempt
				if (values.payment_surcharge_percentage !== 0) {
					setFieldValue('payment_surcharge_percentage', 0);
				}
			}
		}, [values.payment_method]); // Listen only to payment_method changes to avoid loops

		return null;
	};

	const getInitialValues = (): FormQuotationValues => {
		const today = new Date().toISOString().split('T')[0];
		const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split('T')[0];

		return {
			subsidiary_id: subsidiaryId ?? 1,
			customer_id: 0,
			quote_date: today,
			expiry_date: expiryDate,
			tax_rate: 0,
			status: 'draft' as QuoteStatus,
			// `efectivo` está en `EXEMPT_METHODS`, así que el default no genera recargo.
			payment_method: DEFAULT_PAYMENT_METHOD,
			document_type: 'boleta',
			purchase_order: '',
			payment_terms: 0,
			customer_rut: '',
			customer_giro: '',
			customer_shipping_address: '',
			customer_billing_address: '',
			customer_contact_name: '',
			customer_email: '',
			subtotal: 0,
			discount_amount: 0,
			discount_percentage: 0,
			fixed_discount: 0,
			tax_percentage: IVA_RATE,
			total_amount: 0,
			notes: '',
			created_by: user?.id ?? 1,
			tax_amount: 0,
			payment_surcharge_percentage: 0,
			payment_surcharge_amount: 0,
			items: [{ ...EMPTY_PRODUCT_ITEM }],
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
				isStaticBackdropAnimation>
				<ModalHeader className='border-b border-zinc-200 pb-4 dark:border-zinc-700'>
					<div>
						<h2 className='text-xl font-bold text-zinc-900 dark:text-white'>
							Nueva cotización
						</h2>
						<p className='text-sm font-normal text-zinc-600 dark:text-zinc-400'>
							Completa los datos del cliente, los ítems y las condiciones de pago.
						</p>
					</div>
				</ModalHeader>
				<Formik<FormQuotationValues>
					initialValues={getInitialValues()}
					validationSchema={quotationSchema}
					onSubmit={(values, { setSubmitting }) => {
						if (!values.customer_id || values.customer_id === 0) {
							toast.error('Debes seleccionar un cliente antes de continuar');
							setSubmitting(false);
							return;
						}

						if (!values.payment_method) {
							toast.error('Debes seleccionar un método de pago');
							setSubmitting(false);
							return;
						}

						if (!values.document_type) {
							toast.error('Debes seleccionar un tipo de documento');
							setSubmitting(false);
							return;
						}

						if (!values.items || values.items.length === 0) {
							toast.error('Debes agregar al menos un producto');
							setSubmitting(false);
							return;
						}

						// Validar que todos los items tengan producto o nombre
						const invalidItems = values.items.filter((item: any) => {
							if (item.type === 'product') {
								return !item.product_id || item.product_id === 0;
							}
							return !item.customer_name || item.customer_name.trim() === '';
						});

						if (invalidItems.length > 0) {
							toast.error('Todos los ítems deben tener un producto o un nombre');
							setSubmitting(false);
							return;
						}

						if (Number(values.total_amount) <= 0) {
							toast.error('El total de la cotización debe ser mayor a 0');
							setSubmitting(false);
							return;
						}

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

						if (!normalizedPayment) {
							toast.error('No se pudo procesar el método de pago');
							setSubmitting(false);
							return;
						}

						const normalizedDocument =
							values.document_type && String(values.document_type).length > 0
								? values.document_type
								: null;

						if (!normalizedDocument) {
							toast.error('No se pudo procesar el tipo de documento');
							setSubmitting(false);
							return;
						}

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
								<PaymentInfoCard values={values} setFieldValue={setFieldValue} />
								<TotalsCard
									values={values}
									setFieldValue={setFieldValue}
									IVA_RATE={IVA_RATE}
								/>
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
										Crear cotización
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
						Confirmar creación
					</h2>
				</ModalHeader>
				<ModalBody>
					<p className='text-sm text-zinc-600 dark:text-zinc-400'>
						¿Deseas crear esta cotización con los datos ingresados?
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
								if (!pendingPayload) {
									toast.error('No hay datos para crear la cotización');
									return;
								}
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

export default CreateQuotationModal;
