import { describe, expect, it } from 'vitest';
import {
	PROCUREMENT_ERROR_DEFINITIONS,
	getProcurementErrorMessage,
	resolveProcurementError,
} from '@/utils/procurementErrors.util';
import {
	buildProcurementWriteHeaders,
	createIdempotencyKey,
	isTransportError,
	readEtagHeader,
	requiresResourceReload,
	shouldRetryWithSameKey,
} from '@/utils/procurementWrite.util';

const axiosError = (status: number, data: unknown) => ({
	isAxiosError: true,
	response: { status, data },
});

describe('resolveProcurementError', () => {
	it('cubre los códigos estables de la sección 16 del contrato', () => {
		// La tabla se copia del contrato: si el backend agrega un código, la lista
		// crece acá y no en cada pantalla.
		expect(Object.keys(PROCUREMENT_ERROR_DEFINITIONS)).toHaveLength(28);
		expect(PROCUREMENT_ERROR_DEFINITIONS.RESOURCE_VERSION_CONFLICT.status).toBe(412);
		expect(PROCUREMENT_ERROR_DEFINITIONS.IDEMPOTENCY_KEY_REUSED.status).toBe(409);
	});

	it('prefiere el mensaje del backend por sobre el de respaldo', () => {
		const resolved = resolveProcurementError(
			axiosError(409, {
				message: 'Ya existe un proveedor con este RUT en esta filial.',
				code: 'SUPPLIER_RUT_ALREADY_EXISTS',
			}),
		);

		expect(resolved.code).toBe('SUPPLIER_RUT_ALREADY_EXISTS');
		expect(resolved.message).toBe('Ya existe un proveedor con este RUT en esta filial.');
		expect(resolved.action).toBe('fix_input');
	});

	it('usa el mensaje de respaldo cuando la respuesta no trae texto', () => {
		const resolved = resolveProcurementError(
			axiosError(409, { code: 'OPERATION_IN_PROGRESS' }),
		);

		expect(resolved.message).toBe(
			PROCUREMENT_ERROR_DEFINITIONS.OPERATION_IN_PROGRESS.fallbackMessage,
		);
		expect(resolved.action).toBe('retry_same_key');
	});

	it('trata el 428 como falta de precondición aunque no traiga código', () => {
		const resolved = resolveProcurementError(axiosError(428, {}));

		expect(resolved.code).toBe('PRECONDITION_REQUIRED');
		expect(resolved.action).toBe('reload_resource');
		expect(requiresResourceReload(axiosError(428, {}))).toBe(true);
	});

	it('extrae los errores por campo de un 422 y el context de un 409', () => {
		const withFields = resolveProcurementError(
			axiosError(422, {
				message: 'Datos inválidos.',
				code: 'UNIT_COST_REQUIRED',
				errors: { 'items.0.unit_cost': ['Indica el costo unitario.'] },
			}),
		);
		const withContext = resolveProcurementError(
			axiosError(409, {
				message: 'Sin stock.',
				code: 'INSUFFICIENT_LOCATION_STOCK',
				context: { warehouse_id: 8, available: 3 },
			}),
		);

		expect(withFields.fieldErrors).toEqual({
			'items.0.unit_cost': ['Indica el costo unitario.'],
		});
		expect(withContext.context).toEqual({ warehouse_id: 8, available: 3 });
		expect(withContext.action).toBe('reload_selection');
	});

	it('acepta el string plano con el que un thunk rechaza', () => {
		expect(getProcurementErrorMessage('No pudimos guardar')).toBe('No pudimos guardar');
	});

	it('cae al mensaje de respaldo del caller ante un código desconocido', () => {
		expect(
			getProcurementErrorMessage(axiosError(500, { code: 'ALGO_NUEVO' }), 'Fallback propio'),
		).toBe('Fallback propio');
	});
});

describe('cabeceras de escritura', () => {
	it('genera un UUID v4 distinto por operación', () => {
		const first = createIdempotencyKey();
		const second = createIdempotencyKey();

		expect(first).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);
		expect(first).not.toBe(second);
	});

	it('agrega If-Match solo cuando hay ETag', () => {
		expect(buildProcurementWriteHeaders({ idempotencyKey: 'k1' })).toEqual({
			'Idempotency-Key': 'k1',
		});
		expect(buildProcurementWriteHeaders({ idempotencyKey: 'k1', etag: 'W/"7"' })).toEqual({
			'Idempotency-Key': 'k1',
			'If-Match': 'W/"7"',
		});
	});

	it('lee el ETag sin depender de la capitalización de la cabecera', () => {
		expect(readEtagHeader({ etag: 'W/"7"' })).toBe('W/"7"');
		expect(readEtagHeader({ ETag: 'W/"7"' })).toBe('W/"7"');
		expect(readEtagHeader({})).toBeNull();
	});

	it('clasifica el timeout como reintento con la misma clave, sin contradecirse', () => {
		// `action` y `shouldRetryWithSameKey` tienen que decir lo mismo. Cuando la
		// clasificación devolvía `fix_input` para un fallo de transporte, la
		// pantalla leía «corrige los datos» —que implica clave nueva— mientras el
		// helper decía «reintenta con la misma»: instrucciones incompatibles para
		// el caso donde equivocarse duplica una recepción.
		const timeout = { isAxiosError: true, code: 'ECONNABORTED', request: {} };
		const resolved = resolveProcurementError(timeout);

		expect(resolved.action).toBe('retry_same_key');
		expect(shouldRetryWithSameKey(timeout)).toBe(true);
		// El código de Axios no se presenta como si fuera un código del contrato.
		expect(resolved.code).not.toBe('ECONNABORTED');
		expect(resolved.status).toBeNull();
	});

	it('reusa la clave ante un timeout y ante una operación en curso', () => {
		// La regla que más fácil se invierte: reintentar un timeout con clave nueva
		// convierte el reintento en una segunda recepción.
		const timeout = { isAxiosError: true, code: 'ECONNABORTED', request: {} };

		expect(isTransportError(timeout)).toBe(true);
		expect(shouldRetryWithSameKey(timeout)).toBe(true);
		expect(shouldRetryWithSameKey(axiosError(409, { code: 'OPERATION_IN_PROGRESS' }))).toBe(
			true,
		);
	});

	it('no reusa la clave tras un error definitivo de validación', () => {
		expect(shouldRetryWithSameKey(axiosError(422, { code: 'UNIT_COST_REQUIRED' }))).toBe(false);
		expect(shouldRetryWithSameKey(axiosError(409, { code: 'IDEMPOTENCY_KEY_REUSED' }))).toBe(
			false,
		);
	});
});
