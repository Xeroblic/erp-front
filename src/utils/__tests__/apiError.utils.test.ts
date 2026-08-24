import { describe, expect, it } from 'vitest';
import extractApiErrorMessage from '@/utils/apiError.utils';

describe('extractApiErrorMessage', () => {
	it('prioriza y deduplica los errores de validación', () => {
		expect(
			extractApiErrorMessage({
				response: {
					data: {
						message: 'No debe ganar',
						errors: {
							price: ['El precio no es válido', 'El precio no es válido'],
							channel: ['El canal es obligatorio'],
						},
					},
				},
			}),
		).toBe('El precio no es válido · El canal es obligatorio');
	});

	it('devuelve literalmente message en errores de negocio 422 y permiso 403', () => {
		expect(
			extractApiErrorMessage({
				response: {
					status: 422,
					data: {
						message: 'El canal no pertenece a la misma subsidiaria que el producto.',
					},
				},
			}),
		).toBe('El canal no pertenece a la misma subsidiaria que el producto.');

		expect(
			extractApiErrorMessage({
				response: {
					status: 403,
					data: { message: 'No tienes permiso para realizar esta acción.' },
				},
			}),
		).toBe('No tienes permiso para realizar esta acción.');
	});

	it('acepta rechazos string y errores nativos antes del fallback', () => {
		expect(extractApiErrorMessage('Rechazo del thunk', 'Fallback')).toBe('Rechazo del thunk');
		expect(extractApiErrorMessage(new Error('Fallo local'), 'Fallback')).toBe('Fallo local');
		expect(extractApiErrorMessage(null, 'Fallback')).toBe('Fallback');
	});
});
