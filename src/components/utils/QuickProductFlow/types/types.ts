import * as Yup from 'yup';
import type { FormikProps } from 'formik';
import type { TSelectOption } from '@/components/form/SelectReact';

/**
 * Formulario para creación rápida de producto (mínimo datos)
 * Reutilizable en múltiples contextos
 */
export interface IQuickProductForm {
	name: string;
	sku: string;
	price: string;
	brandId: string;
	tipo: string;
	serialTracking?: string; // '0' | '1' para checkbox
}

export const QuickProductFormSchema = Yup.object().shape({
	name: Yup.string()
		.required('El nombre es requerido')
		.min(3, 'El nombre debe tener al menos 3 caracteres'),
	sku: Yup.string().required('El SKU es requerido'),
	price: Yup.number()
		.typeError('El precio debe ser un número')
		.min(0, 'El precio no puede ser negativo')
		.required('El precio es requerido'),
	brandId: Yup.number()
		.typeError('Debes seleccionar una marca')
		.min(1, 'Debes seleccionar una marca')
		.required('La marca es requerida'),
	tipo: Yup.string().required('El tipo de producto es requerido'),
	serialTracking: Yup.string().optional(),
});

/**
 * Elemento de marca para deduplicación
 */
export interface IBrandForDedup {
	id: number;
	name: string;
}

/**
 * Producto afectado en deduplicación
 */
export interface IDedupProductItem {
	id: number;
	name: string;
	sku: string;
	brandId: number;
	brandName: string;
}

/**
 * Opciones de deduplicación
 */
export interface IDedupOptions {
	enableDedup?: boolean; // Por defecto: true
}

/**
 * Propiedades del hook useQuickProduct
 */
export interface IUseQuickProductOptions extends IDedupOptions {
	branchId: number;
	onProductCreated?: (product: any) => void | Promise<void>;
	onBrandCreated?: (brand: any) => void;
	onBrandDedupResolved?: (keepBrandId: number) => void;
}

/**
 * Return type del hook useQuickProduct
 */
export interface IUseQuickProductReturn {
	// Modal state
	isOpen: boolean;
	onOpen: () => void;
	onClose: () => void;

	// Form
	form: FormikProps<IQuickProductForm>;
	isSubmitting: boolean;

	// Brand handling
	brands: TSelectOption[];
	brandsLoading: boolean;
	onBrandChange: (brandId: string) => void;
	onCreateBrand: (brandName: string) => Promise<void>;

	// Brand Deduplication (optional)
	isDedupModalOpen: boolean;
	dedupCandidates: IBrandForDedup[];
	dedupProductsByBrand: Record<number, IDedupProductItem[]>;
	dedupDefaultKeepId: number | null;
	isDedupLoading: boolean;
	isDedupSubmitting: boolean;
	onCloseDedupModal: () => void;
	onResolveBrandDedup: (keepBrandId: number) => Promise<void>;
}
