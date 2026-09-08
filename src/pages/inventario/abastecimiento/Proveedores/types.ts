import * as Yup from 'yup';
import { validateRut } from '@/utils/validateRut';

/**
 * Tipos y validación de la pantalla de maestro de proveedores (card 02,
 * sección 5 del contrato de abastecimiento). Los tipos de dominio —
 * `IProcurementSupplier`, `IProcurementSupplierPayload`, etc.— viven en
 * `@/interface/procurement.interface.ts`, compartidos con la ficha; acá sólo
 * lo propio de esta pantalla: el filtro de estado y el formulario.
 */

/**
 * Modela «activos por defecto / inactivos / todos» como una sola elección en
 * vez de dos checkboxes independientes — así `is_active` e `include_inactive`
 * no pueden combinarse desde la UI, la restricción del contrato.
 */
export type TSupplierStatusFilter = 'active' | 'inactive' | 'all';

export interface ISupplierStatusFilterOption {
	value: TSupplierStatusFilter;
	label: string;
}

export const SUPPLIER_STATUS_FILTER_OPTIONS: ISupplierStatusFilterOption[] = [
	{ value: 'active', label: 'Activos' },
	{ value: 'inactive', label: 'Inactivos' },
	{ value: 'all', label: 'Todos' },
];

/**
 * Valores del formulario de alta/edición. Todo string para que Formik e
 * `Input` trabajen sin controlar/no controlar; `toPayload` en
 * `useProveedorForm` convierte a `IProcurementSupplierPayload` recién al
 * enviar. Sin `display_name` ni `is_active`: no son campos del formulario.
 */
export interface IProveedorFormValues {
	rut: string;
	company_name: string;
	contact_name: string;
	business_activity: string;
	billing_address: string;
	billing_commune_id: number | null;
	shipping_address: string;
	shipping_commune_id: number | null;
	phone: string;
	email: string;
}

/**
 * El `TestContext` es de Yup, no del componente: definida fuera del schema
 * para que `this.createError` no dispare `react/no-this-in-sfc` (mismo
 * criterio que `hasUsableName` en `CreateCustomerSaleModal`).
 */
function hasCompanyOrContact(
	this: Yup.TestContext,
	values?: { company_name?: string; contact_name?: string },
) {
	const company = values?.company_name?.trim() ?? '';
	const contact = values?.contact_name?.trim() ?? '';
	if (company || contact) return true;
	return this.createError({
		path: 'company_name',
		message: 'Ingresa razón social o nombre de contacto.',
	});
}

/**
 * Únicos obligatorios del contrato: RUT válido y razón social o contacto. El
 * resto —incluidos giro y ambas direcciones— es opcional acá: el contrato los
 * exige recién para confirmar una factura, no para guardar el proveedor
 * (sección 5). Ese requisito se advierte en la vista, no se bloquea acá.
 */
export const proveedorFormSchema = Yup.object({
	rut: Yup.string()
		.required('El RUT es obligatorio.')
		.test('rut-valido', 'El RUT no es válido.', (value) => validateRut(value ?? '')),
	company_name: Yup.string().max(255, 'Máximo 255 caracteres.'),
	contact_name: Yup.string().max(255, 'Máximo 255 caracteres.'),
	business_activity: Yup.string().max(255, 'Máximo 255 caracteres.'),
	billing_address: Yup.string().max(255, 'Máximo 255 caracteres.'),
	billing_commune_id: Yup.number().nullable(),
	shipping_address: Yup.string().max(255, 'Máximo 255 caracteres.'),
	shipping_commune_id: Yup.number().nullable(),
	phone: Yup.string().max(50, 'Máximo 50 caracteres.'),
	email: Yup.string().email('El email no es válido.'),
}).test('nombre-utilizable', 'Ingresa razón social o nombre de contacto.', hasCompanyOrContact);

/** `true` cuando falta algo de lo que exige confirmar una factura. */
export const isIncompleteForInvoicing = (values: IProveedorFormValues): boolean =>
	!values.business_activity.trim() ||
	!values.billing_address.trim() ||
	values.billing_commune_id === null ||
	!values.shipping_address.trim() ||
	values.shipping_commune_id === null;
