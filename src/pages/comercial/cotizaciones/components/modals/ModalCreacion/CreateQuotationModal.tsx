/**
 * Modal para CREAR cotizaciones
 * Usa Formik + Yup, componentes UI (Card, SelectReact, etc.)
 */
import React, { useEffect } from 'react';
import { Formik, Form } from 'formik';
import { IQuote, QuoteStatus } from '../../../../../../interface';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '../../../../../../components/ui/Modal';
import Button from '../../../../../../components/ui/Button';
import { TSelectOptions } from '../../../../../../components/form/SelectReact';
import { selectPersonalizacionUsuario, useAppSelector } from '@/store';
import ApiService from '@/services/ApiService';
import Badge from '@/components/ui/Badge';

// Shared imports
import { FormQuotationValues, SaleableProduct } from '../shared/types';
import {
	quotationSchema,
	IVA_RATE,
	EMPTY_PRODUCT_ITEM,
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
	const personalizacion = useAppSelector(selectPersonalizacionUsuario);
	const user = useAppSelector((state) => state.auth.user);

	const subsidiaryId = personalizacion?.subsidiary_id || 1;
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

	useEffect(() => {
		const fetchClientes = async () => {
			try {
				const clientes = await ApiService.fetchNormalized({
					url: `/subsidiaries/${subsidiaryId}/customer-sales/overview?per_page=200`,
					method: 'GET',
				});

				const payload = Array.isArray(clientes?.data)
					? clientes.data
					: Array.isArray(clientes)
						? clientes
						: [];

				const options: TSelectOptions = payload.map((c: any) => ({
					value: String(c.id),
					label: c.name || c.contact?.name || 'Cliente sin nombre',
				}));

				setCustomerOptions(options);
			} catch (error) {
				console.error('Error cargando clientes:', error);
			}
		};

		if (isOpen) fetchClientes();
	}, [subsidiaryId, isOpen]);

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
	}, [branchId, isOpen]);

	// Valores iniciales para CREAR cotización
	const getInitialValues = (): FormQuotationValues => {
		const today = new Date().toISOString().split('T')[0];
		const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split('T')[0];

		return {
			subsidiary_id: personalizacion?.subsidiary_id || 1,
			customer_id: 0,
			quote_date: today,
			expiry_date: expiryDate,
			tax_rate: 0,
			status: 'draft' as QuoteStatus,
			payment_method: null,
			document_type: 'boleta',
			purchase_order: '',
			payment_terms: 0,
			subtotal: 0,
			discount_amount: 0,
			discount_percentage: 0,
			fixed_discount: 0,
			tax_percentage: IVA_RATE,
			total_amount: 0,
			notes: '',
			created_by: user?.id ?? 1,
			tax_amount: 0,
			items: [{ ...EMPTY_PRODUCT_ITEM }],
		};
	};

	if (!isOpen) return null;

	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} size='2xl'>
			<ModalHeader>
				<div>
					<Badge className='text-xl font-semibold'>Nueva Cotización</Badge>
					<p className='text-sm text-gray-600'>
						Completa la información para crear una nueva cotización.
					</p>
				</div>
			</ModalHeader>

			<ModalBody>
				<Formik<FormQuotationValues>
					initialValues={getInitialValues()}
					validationSchema={quotationSchema}
					onSubmit={(values, { setSubmitting }) => {
						const sanitizedItems = sanitizeItemsForSubmit(values.items);
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
						};

						onSubmit(payload);
						setSubmitting(false);
					}}
					enableReinitialize>
					{({ values, setFieldValue, errors, touched, handleSubmit }) => (
						<Form id='quotation-form' className='space-y-6' onSubmit={handleSubmit}>
							<GeneralInfoCard
								values={values}
								setFieldValue={setFieldValue}
								errors={errors}
								touched={touched}
								customerOptions={customerOptions}
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
						Crear Cotización
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default CreateQuotationModal;
