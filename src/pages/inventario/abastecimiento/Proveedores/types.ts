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
 * El `TestContext` es de Yup, no del componente: definidas fuera del schema
 * para que `this.parent` no dispare `react/no-this-in-sfc` (mismo criterio
 * que `hasUsableName` en `CreateCustomerSaleModal`).
 *
 * Es una regla "al menos uno de los dos", validada en CADA campo (no un
 * `.test()` del objeto con un único `path` fijo): así, si ambos quedan
 * vacíos, los dos se marcan en rojo al enviar — no sólo `company_name` al
 * azar, dejando `contact_name` sin ningún indicio del error.
 */
function hasContactName(this: Yup.TestContext, company?: string) {
	if (company?.trim()) return true;
	const contact = (this.parent as { contact_name?: string }).contact_name;
	return Boolean(contact?.trim());
}

function hasCompanyName(this: Yup.TestContext, contact?: string) {
	if (contact?.trim()) return true;
	const company = (this.parent as { company_name?: string }).company_name;
	return Boolean(company?.trim());
}

const NOMBRE_UTILIZABLE_MESSAGE = 'Ingresa razón social o nombre de contacto.';

/**
 * Mismo formato que valida el backend: `+56` y 9 dígitos. Cubre celulares
 * (`+569…`), fijos de Santiago (`+562…`) y regionales (`+5632…`, `+5641…`).
 * No reutilizar el de `profile.validation.ts`: ese sólo admite celulares.
 */
export const PHONE_CL_REGEX = /^\+56\d{9}$/;
// Sin «ej.»: `Validation` parte el mensaje en cada punto.
const PHONE_CL_MESSAGE = 'Formato: +56 y 9 dígitos (por ejemplo +56912345678 o +56221234567).';

/** Largo de `+56` y 9 dígitos, ya sin espacios. */
export const PHONE_CL_MAX_LENGTH = 12;

/** Quita espacios para que `+56 9 1234 5678` no falle por formato. */
export const normalizePhone = (value: string): string => value.replace(/\s+/g, '');

/**
 * Valor del teléfono tras pegar `pasted` sobre la selección `[start, end)`.
 * Normaliza antes de recortar: si recortara primero, como hace `maxLength`
 * con el texto pegado, los espacios se comerían los últimos dígitos.
 */
export const pastePhone = (current: string, pasted: string, start: number, end: number): string =>
	normalizePhone(current.slice(0, start) + pasted + current.slice(end)).slice(
		0,
		PHONE_CL_MAX_LENGTH,
	);

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
	company_name: Yup.string()
		.max(255, 'Máximo 255 caracteres.')
		.test('nombre-utilizable', NOMBRE_UTILIZABLE_MESSAGE, hasContactName),
	contact_name: Yup.string()
		.max(255, 'Máximo 255 caracteres.')
		.test('nombre-utilizable', NOMBRE_UTILIZABLE_MESSAGE, hasCompanyName),
	business_activity: Yup.string().max(255, 'Máximo 255 caracteres.'),
	billing_address: Yup.string().max(255, 'Máximo 255 caracteres.'),
	billing_commune_id: Yup.number().nullable(),
	shipping_address: Yup.string().max(255, 'Máximo 255 caracteres.'),
	shipping_commune_id: Yup.number().nullable(),
	phone: Yup.string()
		.transform(normalizePhone)
		.matches(PHONE_CL_REGEX, { message: PHONE_CL_MESSAGE, excludeEmptyString: true }),
	email: Yup.string().email('El email no es válido.'),
});

/** `true` cuando falta algo de lo que exige confirmar una factura. */
export const isIncompleteForInvoicing = (values: IProveedorFormValues): boolean =>
	!values.business_activity.trim() ||
	!values.billing_address.trim() ||
	values.billing_commune_id === null ||
	!values.shipping_address.trim() ||
	values.shipping_commune_id === null;
