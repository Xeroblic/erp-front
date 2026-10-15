import { describe, expect, it } from 'vitest';
import {
	TRANSFER_FORBIDDEN_MESSAGE,
	TRANSFER_SERVER_ERROR_MESSAGE,
	resolveTransferError,
	splitTransferFieldErrors,
	toTransferError,
} from '@/utils/transferErrors.util';

const axiosError = (status: number, data: unknown) => ({
	isAxiosError: true,
	response: { status, data },
});

describe('resolveTransferError', () => {
	it('el 403 explica que falta acceso a la sucursal de destino', () => {
		const error = resolveTransferError(
			axiosError(403, { message: 'This action is unauthorized.' }),
		);

		expect(error).toEqual({
			status: 403,
			kind: 'forbidden',
			message: TRANSFER_FORBIDDEN_MESSAGE,
			fieldErrors: null,
		});
	});

	it('el 422 de negocio conserva su `message` tal cual', () => {
		const message = 'Stock insuficiente para el producto SKU-1. Disponible: 2, requerido: 5';
		const error = resolveTransferError(axiosError(422, { success: false, message }));

		expect(error).toEqual({ status: 422, kind: 'business', message, fieldErrors: null });
	});

	it('el 422 de validación conserva los `errors` por campo', () => {
		const error = resolveTransferError(
			axiosError(422, {
				message: 'Solo se traslada stock entre sucursales de la misma filial.',
				errors: {
					to_branch_id: ['Solo se traslada stock entre sucursales de la misma filial.'],
				},
			}),
		);

		expect(error.kind).toBe('validation');
		expect(error.fieldErrors).toEqual({
			to_branch_id: ['Solo se traslada stock entre sucursales de la misma filial.'],
		});
	});

	it('el 500 no deja pasar nada del cuerpo del servidor', () => {
		const error = resolveTransferError(
			axiosError(500, {
				message: 'SQLSTATE[23000]: Integrity constraint violation',
				errors: { to_branch_id: ['SQLSTATE'] },
			}),
		);

		expect(error).toEqual({
			status: 500,
			kind: 'server',
			message: TRANSFER_SERVER_ERROR_MESSAGE,
			fieldErrors: null,
		});
	});
});

describe('toTransferError', () => {
	it('devuelve tal cual el rechazo tipado del thunk', () => {
		const rejected = resolveTransferError(axiosError(403, {}));

		expect(toTransferError(rejected)).toBe(rejected);
	});

	it('convierte un `SerializedError` en un error sin estado', () => {
		expect(toTransferError({ message: 'Rejected' })).toEqual({
			status: null,
			kind: 'unknown',
			message: 'Rejected',
			fieldErrors: null,
		});
	});
});

describe('splitTransferFieldErrors', () => {
	it('lleva sucursal, bodegas e ítems a su campo y deja el resto para el aviso', () => {
		expect(
			splitTransferFieldErrors({
				to_branch_id: ['Sucursal destino no existe.'],
				from_warehouse_id: ['La bodega origen no pertenece a la sucursal origen.'],
				to_warehouse_id: ['La bodega destino no pertenece a la sucursal destino.'],
				items: ['No hay ítems válidos para transferir.'],
				'items.0': ['Producto o cantidad inválidos.'],
				notes: ['El campo notas no debe ser mayor que 500 caracteres.'],
			}),
		).toEqual({
			byField: {
				to_branch_id: 'Sucursal destino no existe.',
				from_warehouse_id: 'La bodega origen no pertenece a la sucursal origen.',
				to_warehouse_id: 'La bodega destino no pertenece a la sucursal destino.',
				items: 'No hay ítems válidos para transferir. Producto o cantidad inválidos.',
			},
			unmapped: ['El campo notas no debe ser mayor que 500 caracteres.'],
		});
	});
});
