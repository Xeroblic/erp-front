import { describe, expect, it } from 'vitest';
import { ValidationError } from 'yup';
import { formLockCareValidationSchema } from '../FormLockCare.validation';
import { TicketFormValues } from '../FormLockCare.types';

const validRepair: TicketFormValues = {
	name: 'Ana Pérez',
	email: 'ana@correo.cl',
	phone: '+56911112222',
	termsAccepted: true,
	requiresInvoice: 'no',
	invoiceRut: '',
	invoiceBusinessName: '',
	invoiceAddress: '',
	serviceType: 'reparacion',
	repairBrand: 'Lenovo',
	repairModel: 'ThinkPad T14',
	repairSerialNumber: '',
	repairIncludesCharger: 'si',
	upgradeType: '',
	upgradeBrand: '',
	upgradeModel: '',
	upgradeSerialNumber: '',
	notes: '',
	message: 'No enciende',
	attachments: [],
};

/** Campos con error, ordenados: el mensaje exacto es copy, no comportamiento. */
const invalidFields = async (values: TicketFormValues): Promise<string[]> => {
	try {
		await formLockCareValidationSchema.validate(values, { abortEarly: false });
		return [];
	} catch (error) {
		if (!(error instanceof ValidationError)) throw error;
		return [...new Set(error.inner.map((issue) => issue.path ?? ''))].sort();
	}
};

describe('formLockCareValidationSchema', () => {
	it('acepta una reparación completa sin factura', async () => {
		expect(await invalidFields(validRepair)).toEqual([]);
	});

	it('exige RUT, giro y dirección cuando el cliente pide factura', async () => {
		expect(await invalidFields({ ...validRepair, requiresInvoice: 'si' })).toEqual([
			'invoiceAddress',
			'invoiceBusinessName',
			'invoiceRut',
		]);
	});

	it('acepta la factura con sus tres datos', async () => {
		expect(
			await invalidFields({
				...validRepair,
				requiresInvoice: 'si',
				invoiceRut: '76.123.456-7',
				invoiceBusinessName: 'Servicios SpA',
				invoiceAddress: 'Av. Siempre Viva 742',
			}),
		).toEqual([]);
	});

	it('exige marca, modelo y cargador en una reparación', async () => {
		expect(
			await invalidFields({
				...validRepair,
				repairBrand: '',
				repairModel: '',
				repairIncludesCharger: '',
			}),
		).toEqual(['repairBrand', 'repairIncludesCharger', 'repairModel']);
	});

	it('exige tipo, marca y modelo en una mejora, y no los de reparación', async () => {
		expect(
			await invalidFields({
				...validRepair,
				serviceType: 'upgrade',
				repairBrand: '',
				repairModel: '',
				repairIncludesCharger: '',
			}),
		).toEqual(['upgradeBrand', 'upgradeModel', 'upgradeType']);
	});

	it('rechaza un tipo de mejora fuera de RAM, SSD o ambas', async () => {
		expect(
			await invalidFields({
				...validRepair,
				serviceType: 'upgrade',
				upgradeType: 'gpu',
				upgradeBrand: 'HP',
				upgradeModel: 'EliteBook',
			}),
		).toEqual(['upgradeType']);
	});

	it('exige elegir un tipo de servicio', async () => {
		expect(await invalidFields({ ...validRepair, serviceType: '' })).toEqual(['serviceType']);
	});

	it('exige aceptar los términos', async () => {
		expect(await invalidFields({ ...validRepair, termsAccepted: false })).toEqual([
			'termsAccepted',
		]);
	});

	it('rechaza un correo mal formado', async () => {
		expect(await invalidFields({ ...validRepair, email: 'ana@' })).toEqual(['email']);
	});

	it('trata como vacío un mensaje con sólo espacios', async () => {
		expect(await invalidFields({ ...validRepair, message: '   ' })).toEqual(['message']);
	});

	it('acepta un mensaje de 1000 caracteres y rechaza uno de 1001', async () => {
		expect(await invalidFields({ ...validRepair, message: 'a'.repeat(1000) })).toEqual([]);
		expect(await invalidFields({ ...validRepair, message: 'a'.repeat(1001) })).toEqual([
			'message',
		]);
	});
});
