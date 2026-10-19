import * as Yup from 'yup';
import { validateRut } from '@/utils/validateRut';
import type { IProcurementSupplierCommune } from '@/interface/procurement.interface';

/**
 * Una sola elección en vez de dos checkboxes: el contrato prohíbe combinar
 * `is_active` e `include_inactive`.
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
 * Todo string para que `Input` no alterne entre controlado y no controlado;
 * `toPayload` (en `useSupplierForm`) convierte recién al enviar.
 */
export interface ISupplierFormValues {
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
 * Fuera del schema para que `this.parent` no dispare `react/no-this-in-sfc`.
 * La regla «al menos uno de los dos» se valida en cada campo y no en el
 * objeto: así, si ambos quedan vacíos, se marcan los dos.
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
 * Mismo formato que el backend: `+56` y 9 dígitos, celulares, fijos y
 * regionales. El de `profile.validation.ts` sólo admite celulares.
 */
const PHONE_CL_REGEX = /^\+56\d{9}$/;
// Sin «ej.»: `Validation` parte el mensaje en cada punto.
const PHONE_CL_MESSAGE = 'Ingresa 9 dígitos, por ejemplo 9 1234 5678 o 2 2123 4567.';

/** Largo de `+56` y 9 dígitos, ya sin espacios. */
export const PHONE_CL_MAX_LENGTH = 12;

/**
 * Igual que `normalizePhoneInput` del backend: quita separadores y completa
 * el prefijo `+56`. Nueve dígitos que empiezan con `56` quedan como están:
 * no hay código de área 56, así que es alguien tecleando `56…` a medias y
 * completarlo daría `+5656…`.
 */
export const normalizePhone = (value: string): string => {
	const phone = value.replace(/[\s\-.()]/g, '');
	if (/^\d{9}$/.test(phone) && !phone.startsWith('56')) return `+56${phone}`;
	if (/^56\d{9}$/.test(phone)) return `+${phone}`;
	return phone;
};

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
 * Sólo RUT y razón social o contacto son obligatorios: giro y direcciones los
 * exige el contrato recién al confirmar una factura, así que la vista los
 * advierte sin bloquear el guardado.
 */
export const supplierFormSchema = Yup.object({
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

/**
 * Comuna con su región (`Mejillones, Antofagasta`): el nombre solo se presta
 * a confusión cuando coincide con el de una región (la comuna de Valparaíso
 * no es la región). Sin región resuelta, queda la comuna sola.
 */
export const formatCommuneWithRegion = (
	commune: IProcurementSupplierCommune | null | undefined,
): string | null => {
	if (!commune) return null;
	const region = commune.province?.region?.name;
	return region ? `${commune.name}, ${region}` : commune.name;
};

/** Datos que exige confirmar una factura y faltan, en el orden del formulario. */
export const getMissingInvoicingFields = (values: ISupplierFormValues): string[] =>
	[
		!values.business_activity.trim() && 'giro',
		!values.billing_address.trim() && 'dirección de facturación',
		values.billing_commune_id === null && 'comuna de facturación',
		!values.shipping_address.trim() && 'dirección de despacho',
		values.shipping_commune_id === null && 'comuna de despacho',
	].filter((field): field is string => typeof field === 'string');

export const isIncompleteForInvoicing = (values: ISupplierFormValues): boolean =>
	getMissingInvoicingFields(values).length > 0;
