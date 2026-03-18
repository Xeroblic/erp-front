import * as Yup from 'yup';

/**
 * Tipos locales del módulo IngresoStock
 * Segregación de interfaces para máxima reutilización (Principle: Interface Segregation)
 */

export type IMovementType = 'ingreso' | 'egreso';

/** Representa un producto en la tabla de catálogo */
export interface IProductRow {
	id: number;
	name: string;
	sku: string;
	stock: number;
	price: number;
	branchId: number;
	subsidiaryId: number;
}

/** Representa un producto agregado al workspace de ajuste */
export interface IWorkItem {
	productId: number;
	name: string;
	sku: string;
	stock: number;
	price: number;
	quantity: string; // Input temporal, envía como number
	branchId: number;
	subsidiaryId: number;
}

/** Respuesta del endpoint de ajuste de stock */
export interface IBatchAdjustmentResponse {
	success?: boolean;
	message?: string;
	batch_id?: string;
}

/** Item enviado al API (payload final) */
export interface IStockAdjustmentItem {
	product_id: number;
	quantity_change: number;
}

/** Payload del POST /subsidiaries/{id}/stock-adjustments */
export interface IStockAdjustmentPayload {
	branch_id: number;
	reason: string;
	notes?: string;
	items: IStockAdjustmentItem[];
}

/** Formulario de Creación Rápida */
export interface IQuickProductForm {
	name: string;
	sku: string;
	price: string;
	brandId: string;
}

export const QuickProductSchema = Yup.object().shape({
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
});

/** Formulario de Ajuste de Stock (Modal final) */
export interface IAdjustmentForm {
	movementType: IMovementType;
	branchId: string;
	reason: string;
	notes: string;
}

export const AdjustmentSchema = Yup.object().shape({
	movementType: Yup.mixed<IMovementType>()
		.oneOf(['ingreso', 'egreso'])
		.required('El tipo de movimiento es requerido'),
	branchId: Yup.number()
		.typeError('Selecciona una sucursal válida')
		.min(1, 'Sucursal inválida')
		.required('La sucursal es requerida'),
	reason: Yup.string()
		.required('Debes indicar la razón del ajuste')
		.min(5, 'La razón es muy corta'),
	notes: Yup.string().optional(),
});
