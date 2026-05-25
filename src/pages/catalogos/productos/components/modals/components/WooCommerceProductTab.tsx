import React, { useState, useEffect, useCallback } from 'react';
import { useFormikContext } from 'formik';
import { toast } from 'react-toastify';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import RichTextEditor from '@/components/ui/RichTextEditor';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import ApiService from '@/services/ApiService';
import { useAppSelector } from '@/store';
import { Collapse } from '@/components/utils';

interface WooCommerceProductTabProps {
	setActiveTab: (tab: 'formulario' | 'nuevo_formulario') => void;
	branchId: number | string | null;
	isBusy?: boolean;
}

interface ERPProductSummary {
	id: number;
	name: string;
	sku: string;
	price: number;
	stock: number;
	current_status?: {
		value: string;
		label: string;
	};
}

const FieldContainer: React.FC<{
	id: string;
	label: string;
	children: React.ReactNode;
	error?: string;
}> = ({ id, label, children, error }) => (
	<div className='space-y-1.5'>
		<label className='text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400' htmlFor={id}>
			{label}
		</label>
		{children}
		{error && <p className='text-xs text-red-500 font-medium'>{error}</p>}
	</div>
);

const WooCommerceProductTab: React.FC<WooCommerceProductTabProps> = ({
	setActiveTab,
	branchId,
	isBusy = false,
}) => {
	const defaultBranch = useAppSelector((state) => state.auth.user?.branch_id || 1);
	const activeBranchId = Number(branchId || defaultBranch);

	const [wooName, setWooName] = useState('');
	const [skuProduct, setSkuProduct] = useState('');
	const [wooDescription, setWooDescription] = useState('');
	const [wooPrice, setWooPrice] = useState('');
	const [wooPriceOffer, setWooPriceOffer] = useState('');
	const [wooImageUrl, setWooImageUrl] = useState('');
	const [associatedProductId, setAssociatedProductId] = useState<string>('');

	const [erpProducts, setErpProducts] = useState<ERPProductSummary[]>([]);
	const [loadingProducts, setLoadingProducts] = useState(false);
	const [collapseOpen, setCollapseOpen] = useState(false);
	const fetchERPProducts = useCallback(async (showToast = false) => {
		setLoadingProducts(true);
		try {
			const response = await ApiService.fetchData<any>({
				url: `/branches/${activeBranchId}/products`,
				method: 'get',
				params: {
					per_page: 50,
					fields: 'id,name,sku,price,stock,current_status',
				},
			});

			const rawData = response.data?.data || response.data || [];
			const formattedProducts: ERPProductSummary[] = Array.isArray(rawData)
				? rawData.map((p: any) => ({
					id: p.id,
					name: p.name || 'Sin Nombre',
					sku: p.sku || 'SIN-SKU',
					price: Number(p.price || 0),
					stock: Number(p.stock || 0),
					current_status: p.current_status,
				}))
				: [];

			setErpProducts(formattedProducts);
			if (showToast) {
				toast.success('Lista de productos ERP actualizada ');
			}
		} catch (error) {
			console.error('[WooCommerceTab] Error fetching ERP products:', error);
			toast.error('No se pudieron cargar los productos del ERP');
		} finally {
			setLoadingProducts(false);
		}
	}, [activeBranchId]);

	useEffect(() => {
		void fetchERPProducts();
	}, [fetchERPProducts]);

	const productOptions = erpProducts.map((p) => ({
		value: String(p.id),
		label: `${p.name} (${p.sku}) - $${p.price.toLocaleString('cl-CL')} [Stock: ${p.stock}]`,
	}));

	const selectedProduct = erpProducts.find((p) => String(p.id) === associatedProductId);

	const handleProductAssociationChange = (selectedOption: any) => {
		const val = selectedOption ? String(selectedOption.value) : '';
		setAssociatedProductId(val);

		const prod = erpProducts.find((p) => String(p.id) === val);
		if (prod) {
			setWooName(prod.name);
			setWooPrice(String(prod.price));
			toast.info('Campos autocompletados desde el ERP');
		} else {
			setWooName('');
			setWooPrice('');
		}
	};

	const handleCreateBefore = () => {
		toast.info('Redirigiendo a "Formulario Normal". Crea el producto en el ERP y al regresar haz clic en "Recargar"');
		setActiveTab('formulario');
	};

	return (
		<div className='space-y-6 mt-4'>
			<Card className='border border-neutral-200 dark:border-neutral-800 shadow-sm'>
				<CardHeader className='pb-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30'>
					<div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-lg'>
								<Icon icon='HeroLink' className='h-5 w-5' />
							</div>
							<div>
								<CardTitle className='text-base font-bold text-neutral-800 dark:text-neutral-100'>
									Asociación de Producto ERP
								</CardTitle>
								<p className='text-xs text-neutral-500 mt-0.5'>
									Vincula esta publicación de WooCommerce con un producto de tu inventario Zentria.
								</p>
							</div>
						</div>

						<div className='flex items-center gap-2 self-end md:self-auto'>
							<Button
								variant='outline'
								type='button'
								size='sm'
								onClick={handleCreateBefore}
								className='text-xs font-semibold'
							>
								<Icon icon='HeroPlusCircle' className='mr-1.5 h-4 w-4' />
								Crear en ERP
							</Button>

							<Button
								variant='outline'
								type='button'
								size='sm'
								onClick={() => void fetchERPProducts(true)}
								className='text-xs font-semibold hover:bg-neutral-100'
								isDisable={loadingProducts || isBusy}
							>
								<Icon
									icon='HeroArrowPath'
									className={`mr-1.5 h-4 w-4 ${loadingProducts ? 'animate-spin text-blue-500' : ''}`}
								/>
								Recargar
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardBody className='p-0 space-y-4'>
					<FieldContainer id='associated_product' label='Buscar Producto en Zentria ERP'>
						<SelectReact
							name='associated_product'
							id='associated_product'
							placeholder={loadingProducts ? 'Cargando catálogo ERP...' : 'Selecciona un producto del catálogo...'}
							options={productOptions}
							value={productOptions.find(o => o.value === associatedProductId) || null}
							onChange={handleProductAssociationChange}
							isDisabled={loadingProducts || isBusy}
							isClearable
							isSearchable
						/>
					</FieldContainer>
					{selectedProduct && (
						<div className='flex items-start space-x-4 w-full-mt-4'>

							<div className='flex-shrink-0 pt-2'>
								<div className='flex items-center justify-center gap-2'>
									<Button
										variant='solid'
										color={collapseOpen ? 'red' : 'emerald'}
										onClick={() => setCollapseOpen(!collapseOpen)}
										icon={collapseOpen ? 'HeroXMark' : 'HeroChevronDown'}
										rounded='rounded-full'
										size='sm'
										/>
									{collapseOpen === true ? (
										''
									) : (
										<div className='mt-2'>
											<p
												className='text-center text-[11px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-wider animate-slide-up'>
												Información del Producto
											</p>
										</div>
									)}
								</div>
							</div>

							<Collapse isOpen={collapseOpen}>
								<div className='p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/30 bg-emerald-50/20 dark:bg-emerald-950/10 transition-all duration-300 ease-in-out w-full'>									<div className='flex items-start gap-3'>
										<div className='p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg mt-0.5 animate-pulse'>
											<Icon icon='HeroCheckCircle' className='h-4 w-4' />
										</div>
										<div className='flex-1 space-y-1'>
											<span className='text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider'>
												Sincronización Activa de Inventario 
											</span>
											<p className='text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed'>
												Este producto de WooCommerce quedará enlazado al stock de <strong>{selectedProduct.sku}</strong>.
												Las ventas en WooCommerce deducirán automáticamente del stock disponible para la venta en el ERP.
											</p>
											<div className='flex flex-wrap gap-4 mt-3 pt-2 border-t border-emerald-100/50 dark:border-emerald-950/20 text-xs font-medium'>
												<div className='flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400'>
													<Icon icon='HeroSquare3Stack3D' className='h-3.5 w-3.5 text-neutral-400' />
													Stock ERP: <span className='text-neutral-800 dark:text-neutral-200 font-bold'>{selectedProduct.stock} uds</span>
												</div>
												<div className='flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400'>
													<Icon icon='HeroTag' className='h-3.5 w-3.5 text-neutral-400' />
													Estado: <span className='px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md font-bold text-[10px] uppercase'>
														{selectedProduct.current_status?.label || 'Disponible para Venta'}
													</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</Collapse>
						</div>
					)}
				</CardBody>
			</Card>

			<Card className='border border-neutral-200 dark:border-neutral-800 shadow-sm'>
				<CardHeader className='pb-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30'>
					<div className='flex items-center gap-3'>
						<div className='p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-lg'>
							<Icon icon='HeroShoppingBag' className='h-5 w-5' />
						</div>
						<div>
							<CardTitle className='text-base font-bold text-neutral-800 dark:text-neutral-100'>
								Detalles de Publicación WooCommerce
							</CardTitle>
							<p className='text-xs text-neutral-500 mt-0.5'>
								Configura la información comercial que se mostrará en la tienda digital de WooCommerce.
							</p>
						</div>
					</div>
				</CardHeader>

				<CardBody className='p-5 space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div className='md:col-span-2'>
							<FieldContainer id='woo_name' label='Nombre del Producto en la Tienda'>
								<Input
									id='woo_name'
									name='woo_name'
									placeholder='Ej: Dell Latitude 5320 Reacondicionado'
									value={wooName}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWooName(e.target.value)}
									disabled={isBusy}
									required
								/>
							</FieldContainer>
						</div>

					</div>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<FieldContainer id='woo_price' label='Precio WooCommerce ($)'>
							<Input
								id='woo_price'
								name='woo_price'
								type='number'
								min={0}
								placeholder='Ej: 450000'
								value={wooPrice}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWooPrice(e.target.value)}
								disabled={isBusy}
								required
							/>
						</FieldContainer>
							<FieldContainer id='woo_price_offer' label='Precio rebajado WooCommerce ($)'>
							<Input
								id='woo_price_offer'
								name='woo_price_offer'
								type='number'
								min={0}
								placeholder='Ej: 400000'
								value={wooPriceOffer}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWooPriceOffer(e.target.value)}
								disabled={isBusy}
								required
							/>
						</FieldContainer>
					</div>

					<FieldContainer id='woo_image' label='URL Imagen de Referencia / Portada'>
						<div className='flex gap-3'>
							<div>
								<Input
									id='sku_product'
									name='sku_product'
									placeholder='SKU del producto'
									value={skuProduct}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkuProduct(e.target.value)}
									disabled={isBusy}
								/>
							</div>

							<div className='flex-1'>
								<Input
									id='woo_image'
									name='woo_image'
									placeholder='https://elsitio.com/imagen-producto.jpg'
									value={wooImageUrl}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWooImageUrl(e.target.value)}
									disabled={isBusy}
								/>
							</div>

							{wooImageUrl && (
								<div className='h-10 w-10 shrink-0 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center'>
									<img
										src={wooImageUrl}
										alt='Vista previa'
										className='h-full w-full object-cover'
										onError={(e) => {
											(e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=Error';
										}}
									/>
								</div>
							)}
						</div>
					</FieldContainer>

					<FieldContainer id='woo_description' label='Descripción Larga de la Publicación (Web)'>
						<RichTextEditor
							value={wooDescription}
							onChange={(html) => setWooDescription(html)}
							placeholder='Describe detalladamente las características técnicas, estado estético, accesorios incluidos y garantías del producto...'
							minHeight='220px'
							maxHeight='400px'
							compact={false}
							resizable
						/>
					</FieldContainer>
				</CardBody>
			</Card>

			<div className='flex justify-end gap-3 pt-2'>
				<Button
					color='amber'
					type='button'
					onClick={() => {
						if (!wooName || !wooPrice) {
							toast.warning('Ingresa al menos el nombre y el precio para simular la publicación');
							return;
						}
						toast.success(`¡Listo para publicar en WooCommerce!
						Producto: ${wooName}
						Precio: $${Number(wooPrice).toLocaleString('cl-CL')}
						Asociación ERP: ${selectedProduct ? selectedProduct.sku : 'Ninguno (Publicación huérfana)'}`);
					}}
					isDisable={isBusy}
					icon='HeroShare'
				>
					Publicar en WooCommerce
				</Button>
			</div>
		</div>
	);
};

export default WooCommerceProductTab;
