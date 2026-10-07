import { act, renderHook } from '@testing-library/react';
import { useFormik } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import { costEntrySchema, optionalCostEntrySchema, toCostEntryPayload } from '../costEntry.schema';
import type { ICostEntryFormValues } from '../costEntry.schema';

/**
 * Se ejercita con Formik real y no con `validateAt`: Formik normaliza `''` a
 * `undefined` antes de validar, pero deja pasar un campo con espacios, y sólo
 * el ciclo completo reproduce ambas formas de ausencia.
 */
const renderCostForm = (
	initialValues: ICostEntryFormValues,
	schema: typeof optionalCostEntrySchema | typeof costEntrySchema = optionalCostEntrySchema,
) =>
	renderHook(() =>
		useFormik<ICostEntryFormValues>({
			initialValues,
			validationSchema: schema,
			onSubmit: vi.fn(),
		}),
	);

const emptyValues: ICostEntryFormValues = { unit_cost: '', unit_cost_basis: '' };

describe('optionalCostEntrySchema con Formik', () => {
	it('acepta el formulario vacío: el costo desconocido es un estado válido', async () => {
		const { result } = renderCostForm(emptyValues);

		let errors: Record<string, unknown> = {};
		await act(async () => {
			errors = await result.current.validateForm();
		});

		expect(errors).toEqual({});
	});

	it('vuelve a aceptar el formulario después de completar y borrar ambos campos', async () => {
		const { result } = renderCostForm(emptyValues);

		await act(async () => {
			await result.current.setValues({ unit_cost: '5712.00', unit_cost_basis: 'gross' });
		});

		let afterFilling: Record<string, unknown> = {};
		await act(async () => {
			afterFilling = await result.current.validateForm();
		});
		expect(afterFilling).toEqual({});

		// Borrar deja `''`, no `undefined`.
		await act(async () => {
			await result.current.setValues(emptyValues);
		});

		let afterClearing: Record<string, unknown> = {};
		await act(async () => {
			afterClearing = await result.current.validateForm();
		});

		expect(result.current.values).toEqual(emptyValues);
		expect(afterClearing).toEqual({});
	});

	it('trata los espacios en blanco como ausencia, no como monto', async () => {
		const { result } = renderCostForm({ unit_cost: '   ', unit_cost_basis: '' });

		let errors: Record<string, unknown> = {};
		await act(async () => {
			errors = await result.current.validateForm();
		});

		expect(errors).toEqual({});
	});

	it('exige la base cuando se informó un monto', async () => {
		const { result } = renderCostForm({ unit_cost: '5712.00', unit_cost_basis: '' });

		let errors: Record<string, string> = {};
		await act(async () => {
			errors = (await result.current.validateForm()) as Record<string, string>;
		});

		expect(errors.unit_cost_basis).toBe('Indica si el monto es neto o bruto.');
		expect(errors.unit_cost).toBeUndefined();
	});

	it('exige el monto cuando se eligió una base', async () => {
		const { result } = renderCostForm({ unit_cost: '', unit_cost_basis: 'net' });

		let errors: Record<string, string> = {};
		await act(async () => {
			errors = (await result.current.validateForm()) as Record<string, string>;
		});

		expect(errors.unit_cost).toBe('Indica el costo unitario o deja ambos campos vacíos.');
		expect(errors.unit_cost_basis).toBeUndefined();
	});

	it('conserva las reglas de formato cuando el monto sí viene informado', async () => {
		const { result } = renderCostForm({ unit_cost: '100.123', unit_cost_basis: 'net' });

		let errors: Record<string, string> = {};
		await act(async () => {
			errors = (await result.current.validateForm()) as Record<string, string>;
		});

		expect(errors.unit_cost).toBe('Usa un monto con hasta dos decimales.');
	});
});

describe('costEntrySchema con Formik', () => {
	it('sigue exigiendo ambos campos cuando el costo es obligatorio', async () => {
		const { result } = renderCostForm(emptyValues, costEntrySchema);

		let errors: Record<string, string> = {};
		await act(async () => {
			errors = (await result.current.validateForm()) as Record<string, string>;
		});

		expect(errors.unit_cost).toBe('Indica el costo unitario.');
		expect(errors.unit_cost_basis).toBe('Indica si el monto es neto o bruto.');
	});
});

describe('costEntrySchema', () => {
	it('rechaza un monto de más de dos decimales y un monto cero', async () => {
		await expect(
			costEntrySchema.validate({ unit_cost: '100.123', unit_cost_basis: 'net' }),
		).rejects.toThrow('Usa un monto con hasta dos decimales.');
		await expect(
			costEntrySchema.validate({ unit_cost: '0', unit_cost_basis: 'net' }),
		).rejects.toThrow('El costo debe ser mayor que cero.');
	});

	it('acepta la coma decimal que se escribe en es-CL', async () => {
		await expect(
			costEntrySchema.validate({ unit_cost: '5712,50', unit_cost_basis: 'gross' }),
		).resolves.toEqual({ unit_cost: '5712,50', unit_cost_basis: 'gross' });
	});
});

describe('toCostEntryPayload', () => {
	it('normaliza el monto a dos decimales y envía solo los dos campos', () => {
		expect(toCostEntryPayload({ unit_cost: '5712', unit_cost_basis: 'gross' })).toEqual({
			unit_cost: '5712.00',
			unit_cost_basis: 'gross',
		});
		expect(toCostEntryPayload({ unit_cost: '5712,5', unit_cost_basis: 'net' })).toEqual({
			unit_cost: '5712.50',
			unit_cost_basis: 'net',
		});
	});

	it('devuelve null para la ausencia, incluida la escrita con espacios', () => {
		expect(toCostEntryPayload(emptyValues)).toBeNull();
		expect(toCostEntryPayload({ unit_cost: '   ', unit_cost_basis: '' })).toBeNull();
	});
});
