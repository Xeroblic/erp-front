import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import type { IProduct } from '@/interface/product.interface';
import type { ProductFormValues, ProductFormSubmitPayload, ProductOption } from '../types/products.types';

const toOption = (value: number | string, label: string): ProductOption => ({
	value: String(value),
	label,
});

export const createBrandOptions = (brands: IBrand[]): ProductOption[] =>
	brands.map((brand) => toOption(brand.id, brand.name));

export const createCategoryOptions = (categories: ICategory[]): ProductOption[] =>
	categories.map((category) => toOption(category.id, category.name));

export const buildInitialValues = (product?: IProduct | null): ProductFormValues => ({
	sku: product?.sku ?? '',
	name: product?.name ?? '',
	brand_id: product?.brand_id ? String(product.brand_id) : '',
	price: product?.price ? String(product.price) : '',
	cost: product?.cost ? String(product.cost) : '',
	offer_price: product?.offer_price ? String(product.offer_price) : '',
	product_type: product?.product_type ?? '',
	condition_policy: product?.condition_policy ?? '',
	uom: product?.uom ?? '',
	warranty_months: product?.warranty_months ? String(product.warranty_months) : '',
	serial_tracking: product?.serial_tracking ?? false,
	is_active: product?.is_active ?? true,
	categories: product?.categories?.map((category) => toOption(category.id, category.name)) ?? [],
});

export const buildSubmitPayload = (values: ProductFormValues): ProductFormSubmitPayload => {
	const categoryIds = values.categories.map((category) => Number(category.value));

	const data: Partial<IProduct> = {
		sku: values.sku.trim(),
		name: values.name.trim(),
		brand_id: Number(values.brand_id),
		price: Number(values.price),
		cost: values.cost ? Number(values.cost) : undefined,
		offer_price: values.offer_price ? Number(values.offer_price) : undefined,
		product_type: values.product_type || undefined,
		condition_policy: values.condition_policy || undefined,
		uom: values.uom || undefined,
		warranty_months: values.warranty_months ? Number(values.warranty_months) : undefined,
		serial_tracking: values.serial_tracking,
		is_active: values.is_active,
	};

	return { data, categoryIds };
};

