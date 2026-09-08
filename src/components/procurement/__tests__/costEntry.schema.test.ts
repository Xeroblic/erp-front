import { act, renderHook } from '@testing-library/react';
import { useFormik } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import { costEntrySchema, optionalCostEntrySchema, toCostEntryPayload } from '../costEntry.schema';
import type { ICostEntryFormValues } from '../costEntry.schema';

/**
 * El costo opcional cubre la recepción sin documento y sin proveedor conocido,
 * donde el contrato admite que el costo quede desconocido pero exige que monto y
 * base viajen juntos: «monto presente exige base y viceversa».
 *
 * Se ejercita a través de Formik real y no con `validateAt`, porque el defecto
 * sólo aparece con el ciclo completo: Formik normaliza `''` a `undefined` antes
 * de validar, mientras que un campo con espacios llega sin tocar. El schema
 * comparaba contra `''` y por eso rechazaba una ausencia legítima. Validado
 * fuera de Formik el caso ni siquiera se reproduce.
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

		// Borrar deja `''`, no `undefined`: es el caso que fallaba.
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

		expect(errors.unit_cost).toBeDefined();
		expect(errors.unit_cost_basis).toBeDefined();
	});
});

describe('toCostEntryPayload', () => {
	it('devuelve null para la ausencia, incluida la escrita con espacios', () => {
		expect(toCostEntryPayload(emptyValues)).toBeNull();
		expect(toCostEntryPayload({ unit_cost: '   ', unit_cost_basis: '' })).toBeNull();
	});
});
