import { describe, expect, it, vi } from 'vitest';
import {
	PROCUREMENT_ERROR_DEFINITIONS,
	applyProcurementFieldErrors,
	getProcurementErrorMessage,
	resolveProcurementError,
} from '@/utils/procurementErrors.util';
import {
	buildProcurementWriteHeaders,
	createIdempotencyKey,
	isTransportError,
	readEtagHeader,
	shouldRetryWithSameKey,
} from '@/utils/procurementWrite.util';

const axiosError = (status: number, data: unknown) => ({
	isAxiosError: true,
	response: { status, data },
});

describe('resolveProcurementError', () => {
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
	});

	it('no presenta el código ni el mensaje de Axios cuando el cuerpo no es JSON', () => {
		// Forma real de un AxiosError: trae su propio `code` y `message` en inglés.
		const withBody = (status: number, data: unknown) => ({
			isAxiosError: true,
			code: 'ERR_BAD_REQUEST',
			message: `Request failed with status code ${status}`,
			response: { status, data },
		});

		const emptyPrecondition = resolveProcurementError(withBody(428, ''));
		expect(emptyPrecondition.code).toBe('PRECONDITION_REQUIRED');
		expect(emptyPrecondition.message).toBe(
			'Falta la versión del registro. Recarga y vuelve a intentarlo.',
		);

		const proxyHtml = resolveProcurementError(
			withBody(502, '<html>Bad Gateway</html>'),
			'No pudimos cargar el stock.',
		);
		expect(proxyHtml.code).toBe('UNKNOWN');
		expect(proxyHtml.status).toBe(502);
		expect(proxyHtml.message).toBe('No pudimos cargar el stock.');
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

	it('extrae context.existing_supplier del 409 de RUT duplicado', () => {
		const resolved = resolveProcurementError(
			axiosError(409, {
				message: 'Ya existe un proveedor con este RUT en esta filial.',
				code: 'SUPPLIER_RUT_ALREADY_EXISTS',
				context: {
					existing_supplier: { id: 7, display_name: 'PCExpress', is_active: false },
				},
			}),
		);

		expect(resolved.existingSupplier).toEqual({
			id: 7,
			display_name: 'PCExpress',
			is_active: false,
		});
	});

	it('ignora la copia deprecada de existing_supplier en la raíz del cuerpo', () => {
		const resolved = resolveProcurementError(
			axiosError(409, {
				message: 'Ya existe un proveedor con este RUT en esta filial.',
				code: 'SUPPLIER_RUT_ALREADY_EXISTS',
				existing_supplier: { id: 7, display_name: 'PCExpress', is_active: false },
			}),
		);

		expect(resolved.existingSupplier).toBeNull();
	});

	it('deja existingSupplier en null fuera del conflicto de RUT', () => {
		const resolved = resolveProcurementError(
			axiosError(422, { message: 'RUT inválido.', code: 'INVALID_CHILEAN_RUT' }),
		);

		expect(resolved.existingSupplier).toBeNull();
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
		const timeout = { isAxiosError: true, code: 'ECONNABORTED', request: {} };
		const resolved = resolveProcurementError(timeout);

		expect(resolved.action).toBe('retry_same_key');
		expect(shouldRetryWithSameKey(timeout)).toBe(true);
		// El código de Axios no se presenta como si fuera un código del contrato.
		expect(resolved.code).not.toBe('ECONNABORTED');
		expect(resolved.status).toBeNull();
	});

	it('reusa la clave ante un timeout y ante una operación en curso', () => {
		// Reintentar un timeout con clave nueva convierte el reintento en una segunda recepción.
		const timeout = { isAxiosError: true, code: 'ECONNABORTED', request: {} };

		expect(isTransportError(timeout)).toBe(true);
		expect(shouldRetryWithSameKey(timeout)).toBe(true);
		expect(shouldRetryWithSameKey(axiosError(409, { code: 'OPERATION_IN_PROGRESS' }))).toBe(
			true,
		);
	});

	it('pinta el primer mensaje de cada campo traducible y omite el resto', () => {
		const setFieldError = vi.fn();

		applyProcurementFieldErrors(
			{ supplier_id: ['Elige un proveedor.', 'Otro'], unknown: ['x'], sku: [] },
			(apiField) => ({ supplier_id: 'supplierId', sku: 'sku' })[apiField] ?? null,
			setFieldError,
		);

		expect(setFieldError.mock.calls).toEqual([['supplierId', 'Elige un proveedor.']]);
	});

	it('una escritura cancelada se trata como resultado incierto y reusa la clave', () => {
		const canceled = { isAxiosError: true, code: 'ERR_CANCELED', request: {} };

		expect(isTransportError(canceled)).toBe(true);
		expect(shouldRetryWithSameKey(canceled)).toBe(true);
	});

	it('no reusa la clave tras un error definitivo de validación', () => {
		expect(shouldRetryWithSameKey(axiosError(422, { code: 'UNIT_COST_REQUIRED' }))).toBe(false);
		expect(shouldRetryWithSameKey(axiosError(409, { code: 'IDEMPOTENCY_KEY_REUSED' }))).toBe(
			false,
		);
	});
});
