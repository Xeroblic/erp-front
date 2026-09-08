import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CostInput from '../CostInput';
import { costEntrySchema, toCostEntryPayload } from '../costEntry.schema';

vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/utils/tailwindColorResolver.util', () => ({
	resolveTailwindColor: () => '#2563eb',
	resolveTailwindColorAlpha: () => 'rgba(37, 99, 235, 0.5)',
}));

const baseProps: React.ComponentProps<typeof CostInput> = {
	amountName: 'unit_cost',
	basisName: 'unit_cost_basis',
	amountValue: '5712.00',
	basisValue: 'gross',
	onChange: vi.fn(),
	onBlur: vi.fn(),
};

const renderInput = (overrides: Partial<React.ComponentProps<typeof CostInput>> = {}) => {
	const props = { ...baseProps, ...overrides };

	return render(
		<CostInput
			amountName={props.amountName}
			basisName={props.basisName}
			amountValue={props.amountValue}
			basisValue={props.basisValue}
			amountError={props.amountError}
			basisError={props.basisError}
			onChange={props.onChange}
			onBlur={props.onBlur}
		/>,
	);
};

describe('CostInput', () => {
	it('pide monto y base, y nada más', () => {
		const { container } = renderInput();

		// El contrato acepta exactamente dos campos. El IVA, el neto derivado, el
		// bruto derivado y el costo efectivo los calcula el backend: si aparecen
		// como campos editables, el formulario deja de cumplir el contrato.
		expect(container.querySelectorAll('input, select, textarea')).toHaveLength(2);
		expect(screen.getByLabelText('Costo unitario')).toBeInTheDocument();
		expect(screen.getByLabelText('Base')).toBeInTheDocument();
	});

	it('ofrece solo neto y bruto como base', () => {
		renderInput();

		const options = Array.from(screen.getByLabelText('Base').querySelectorAll('option')).map(
			(option) => option.getAttribute('value'),
		);

		expect(options).toEqual(['', 'net', 'gross']);
	});

	it('previsualiza el desglose sin presentarlo como dato registrado', () => {
		renderInput();

		expect(screen.getByText(/Vista previa/)).toBeInTheDocument();
		expect(screen.getByText(/neto \$4\.800,00/)).toBeInTheDocument();
		expect(screen.getByText(/IVA \$912,00/)).toBeInTheDocument();
		expect(
			screen.getByText(/El desglose definitivo lo calcula el servidor al guardar/),
		).toBeInTheDocument();
	});

	it('invierte el cálculo al cambiar la base', () => {
		const { rerender } = renderInput();

		expect(screen.getByText(/bruto \$5\.712,00/)).toBeInTheDocument();

		rerender(
			<CostInput
				amountName='unit_cost'
				basisName='unit_cost_basis'
				amountValue='5712.00'
				basisValue='net'
				onChange={vi.fn()}
				onBlur={vi.fn()}
			/>,
		);

		// Mismo monto leído como neto: el bruto sube a 6.797,28.
		expect(screen.getByText(/bruto \$6\.797,28/)).toBeInTheDocument();
	});

	it('no previsualiza mientras no haya base elegida', () => {
		renderInput({ basisValue: '' });

		expect(screen.queryByText(/Vista previa/)).not.toBeInTheDocument();
	});

	it('enlaza el error del monto al input para lectores de pantalla', () => {
		renderInput({ amountError: 'Indica el costo unitario.' });

		const input = screen.getByLabelText('Costo unitario');

		expect(input).toHaveAttribute('aria-invalid', 'true');
		expect(screen.getByRole('alert')).toHaveTextContent('Indica el costo unitario.');
		expect(input.getAttribute('aria-describedby')).toContain(
			screen.getByRole('alert').getAttribute('id'),
		);
	});

	it('propaga los cambios al handler de Formik', () => {
		const onChange = vi.fn();
		renderInput({ onChange });

		fireEvent.change(screen.getByLabelText('Costo unitario'), { target: { value: '100' } });

		expect(onChange).toHaveBeenCalled();
	});
});

describe('costEntrySchema', () => {
	it('exige monto y base', async () => {
		// `abortEarly: false` para que el orden en que Yup recorre los campos no
		// decida cuál de los dos mensajes se comprueba.
		await expect(
			costEntrySchema.validate({ unit_cost: '', unit_cost_basis: '' }, { abortEarly: false }),
		).rejects.toMatchObject({
			errors: expect.arrayContaining([
				'Indica el costo unitario.',
				'Indica si el monto es neto o bruto.',
			]),
		});
	});

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
		).resolves.toBeDefined();
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

	it('devuelve null cuando el costo quedó vacío, en vez de inventar "0.00"', () => {
		expect(toCostEntryPayload({ unit_cost: '', unit_cost_basis: '' })).toBeNull();
	});
});
