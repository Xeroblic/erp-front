import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import RichTextEditor from '@/components/ui/RichTextEditor';
import SelectReact, {
	type TSelectOption,
	type TSelectOptions,
} from '@/components/form/SelectReact';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/form/Checkbox';
import Icon from '@/components/icon/Icon';
import { useAppDispatch, useAppSelector } from '@/store';
import { createQuickProductThunk } from '@/store/slices/integrations/woocommerceProductsSlice';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';

interface WooCommerceProductTabProps {
	branchId: number | string | null;
	brands?: IBrand[];
	categories?: ICategory[];
	isBusy?: boolean;
}

const FieldContainer: React.FC<{
	id: string;
	label: string;
	children: React.ReactNode;
	error?: string;
}> = ({ id, label, children, error }) => (
	<div className='space-y-1.5'>
		<label
			className='text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400'
			htmlFor={id}>
			{label}
		</label>
		{children}
		{error && <p className='text-xs font-medium text-red-500'>{error}</p>}
	</div>
);

const WooCommerceProductTab: React.FC<WooCommerceProductTabProps> = ({
	branchId,
	brands = [],
	categories = [],
	isBusy = false,
}) => {
	const defaultBranch = useAppSelector((state) => state.auth.user?.branch_id || 1);
	const activeBranchId = Number(branchId || defaultBranch);

	const dispatch = useAppDispatch();
	const { subsidiaryId } = useCurrentBranch();
	const creating = useAppSelector((state) => state.woocommerceProducts.creating);

	const [wooName, setWooName] = useState('');
	const [skuProduct, setSkuProduct] = useState('');
	const [wooPrice, setWooPrice] = useState('');
	const [wooImageUrl, setWooImageUrl] = useState('');
	const [initialStock, setInitialStock] = useState('');
	const [syncStock, setSyncStock] = useState(true);
	const [shortDescription, setShortDescription] = useState('');
	const [longDescription, setLongDescription] = useState('');
	const [brandId, setBrandId] = useState('');
	const [categoryValues, setCategoryValues] = useState<readonly TSelectOption[]>([]);

	const brandOptions = useMemo<TSelectOptions>(
		() => brands.map((b) => ({ value: String(b.id), label: b.name })),
		[brands],
	);
	// Opciones jerárquicas: ordena padre→hijo→nieto e indenta el label para
	// que la estructura se vea dentro de un único select.
	const categoryOptions = useMemo<TSelectOptions>(() => {
		const byId = new Map<number, ICategory>();
		categories.forEach((c) => byId.set(c.id, c));

		const childrenMap = new Map<number | null, ICategory[]>();
		categories.forEach((c) => {
			const pid = c.parent_id != null && byId.has(c.parent_id) ? c.parent_id : null;
			const arr = childrenMap.get(pid) ?? [];
			arr.push(c);
			childrenMap.set(pid, arr);
		});

		const out: TSelectOption[] = [];
		const walk = (parentId: number | null, depth: number) => {
			const nodes = (childrenMap.get(parentId) ?? [])
				.slice()
				.sort((a, b) => a.name.localeCompare(b.name));
			nodes.forEach((node) => {
				const indent = depth > 0 ? `${' '.repeat(depth * 4)}└ ` : '';
				out.push({ value: String(node.id), label: `${indent}${node.name}` });
				walk(node.id, depth + 1);
			});
		};
		walk(null, 0);
		return out;
	}, [categories]);

	// Una descripción de RichText "vacía" igual trae markup (<p></p>): se manda
	// solo si tiene contenido real.
	const htmlToOptional = (html: string): string | undefined => {
		const text = html
			.replace(/<[^>]*>/g, '')
			.replace(/&nbsp;/g, '')
			.trim();
		return text ? html : undefined;
	};

	const busy = isBusy || creating;

	const handleSubmit = useCallback(async () => {
		if (!wooName.trim() || !wooPrice) {
			toast.warning('Ingresa al menos el nombre y el precio del producto');
			return;
		}
		if (!skuProduct.trim()) {
			toast.warning('Ingresa el SKU del producto');
			return;
		}
		if (!subsidiaryId) {
			toast.error('No hay una subsidiaria activa para publicar');
			return;
		}

		const categoryIds = categoryValues
			.map((opt) => Number(opt.value))
			.filter((n) => Number.isFinite(n));

		try {
			await dispatch(
				createQuickProductThunk({
					subsidiaryId,
					payload: {
						name: wooName.trim(),
						sku: skuProduct.trim(),
						price: Number(wooPrice),
						stock: Number(initialStock) || 0,
						image_url: wooImageUrl.trim() || undefined,
						short_description: htmlToOptional(shortDescription),
						long_description: htmlToOptional(longDescription),
						brand_id: brandId ? Number(brandId) : undefined,
						category_ids: categoryIds.length ? categoryIds : undefined,
						branch_id: activeBranchId,
						sync_stock_with_woo: syncStock,
					},
				}),
			).unwrap();

			toast.success('Producto creado y enviado a publicar en WooCommerce');
			setWooName('');
			setSkuProduct('');
			setWooPrice('');
			setWooImageUrl('');
			setInitialStock('');
			setShortDescription('');
			setLongDescription('');
			setBrandId('');
			setCategoryValues([]);
		} catch (error) {
			toast.error(
				typeof error === 'string' ? error : 'No se pudo crear el producto en WooCommerce',
			);
		}
	}, [
		activeBranchId,
		brandId,
		categoryValues,
		dispatch,
		initialStock,
		longDescription,
		shortDescription,
		skuProduct,
		subsidiaryId,
		syncStock,
		wooImageUrl,
		wooName,
		wooPrice,
	]);

	return (
		<div className='mt-4 space-y-6'>
			<Card className='border border-neutral-200 shadow-sm dark:border-neutral-800'>
				<CardHeader className='border-b border-neutral-100 bg-neutral-50/50 pb-3 dark:border-neutral-800 dark:bg-neutral-900/30'>
					<div className='flex items-center gap-3'>
						<div className='rounded-lg bg-blue-50 p-2 text-blue-500 dark:bg-blue-950/40'>
							<Icon icon='HeroShoppingBag' className='h-5 w-5' />
						</div>
						<div>
							<CardTitle className='text-base font-bold text-neutral-800 dark:text-neutral-100'>
								Detalles de Publicación WooCommerce
							</CardTitle>
							<p className='mt-0.5 text-xs text-neutral-500'>
								Crea el producto en el ERP y publícalo en la tienda digital de
								WooCommerce.
							</p>
						</div>
					</div>
				</CardHeader>

				<CardBody className='space-y-4 p-5'>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<FieldContainer id='woo_name' label='Nombre del Producto en la Tienda'>
							<Input
								id='woo_name'
								name='woo_name'
								placeholder='Ej: Dell Latitude 5320 Reacondicionado'
								value={wooName}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setWooName(e.target.value)
								}
								disabled={busy}
								required
							/>
						</FieldContainer>
						<FieldContainer id='sku_product' label='SKU del producto'>
							<Input
								id='sku_product'
								name='sku_product'
								placeholder='Ej: NB-DELL-5320'
								value={skuProduct}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setSkuProduct(e.target.value)
								}
								disabled={busy}
								required
							/>
						</FieldContainer>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<FieldContainer id='woo_price' label='Precio WooCommerce ($)'>
							<Input
								id='woo_price'
								name='woo_price'
								type='number'
								min={0}
								placeholder='Ej: 450000'
								value={wooPrice}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setWooPrice(e.target.value)
								}
								disabled={busy}
								required
							/>
						</FieldContainer>
						<FieldContainer id='initial_stock' label='Stock inicial'>
							<Input
								id='initial_stock'
								name='initial_stock'
								type='number'
								min={0}
								placeholder='Ej: 10'
								value={initialStock}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setInitialStock(e.target.value)
								}
								disabled={busy}
							/>
						</FieldContainer>
					</div>

					<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
						<FieldContainer id='woo_brand' label='Marca'>
							<SelectReact
								inputId='woo_brand'
								name='woo_brand'
								placeholder='Selecciona una marca'
								options={brandOptions}
								value={brandOptions.find((o) => o.value === brandId) ?? null}
								onChange={(newValue) =>
									setBrandId((newValue as TSelectOption | null)?.value ?? '')
								}
								isDisabled={busy}
								isClearable
								isSearchable
							/>
						</FieldContainer>
						<FieldContainer id='woo_categories' label='Categorías'>
							<SelectReact
								inputId='woo_categories'
								name='woo_categories'
								placeholder='Selecciona categorías'
								options={categoryOptions}
								value={categoryValues}
								onChange={(newValue) =>
									setCategoryValues((newValue as readonly TSelectOption[]) ?? [])
								}
								isDisabled={busy}
								isMulti
								isSearchable
							/>
						</FieldContainer>
					</div>

					<Checkbox
						id='sync_stock_with_woo'
						name='sync_stock_with_woo'
						checked={syncStock}
						onChange={() => setSyncStock((prev) => !prev)}
						disabled={busy}
						dimension='sm'
						label='Sincronizar stock con WooCommerce'
					/>

					<FieldContainer id='woo_image' label='URL Imagen de Referencia / Portada'>
						<div className='flex gap-3'>
							<div className='flex-1'>
								<Input
									id='woo_image'
									name='woo_image'
									placeholder='https://elsitio.com/imagen-producto.jpg'
									value={wooImageUrl}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setWooImageUrl(e.target.value)
									}
									disabled={busy}
								/>
							</div>

							{wooImageUrl && (
								<div className='flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900'>
									<img
										src={wooImageUrl}
										alt='Vista previa'
										className='h-full w-full object-cover'
										onError={(e) => {
											(e.target as HTMLImageElement).src =
												'https://placehold.co/40x40?text=Error';
										}}
									/>
								</div>
							)}
						</div>
					</FieldContainer>

					<FieldContainer id='woo_short_description' label='Descripción corta'>
						<RichTextEditor
							value={shortDescription}
							onChange={(html) => setShortDescription(html)}
							placeholder='Resumen breve para la tienda'
							minHeight='120px'
							maxHeight='240px'
							compact
							resizable
						/>
					</FieldContainer>

					<FieldContainer id='woo_long_description' label='Descripción larga'>
						<RichTextEditor
							value={longDescription}
							onChange={(html) => setLongDescription(html)}
							placeholder='Descripción detallada del producto'
							minHeight='220px'
							maxHeight='400px'
							resizable
						/>
					</FieldContainer>
				</CardBody>
			</Card>

			<div className='flex justify-end gap-3 pt-2'>
				<Button
					color='amber'
					type='button'
					onClick={() => void handleSubmit()}
					isDisable={busy}
					icon='HeroShare'>
					{creating ? 'Creando…' : 'Crear y publicar'}
				</Button>
			</div>
		</div>
	);
};

export default WooCommerceProductTab;
