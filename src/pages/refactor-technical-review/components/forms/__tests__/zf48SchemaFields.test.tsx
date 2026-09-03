import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import type { DesktopFormData } from '../../validation/desktop.schema';
import type { NotebookFormData } from '../../validation/notebook.schema';
import DesktopAestheticsSection from '../desktop/sections/DesktopAestheticsSection';
import InputSection from '../notebook/sections/InputSection';

vi.mock('@/components/icon/Icon', () => ({ default: () => <span /> }));

vi.mock('@/components/form/Checkbox', () => ({
	default: ({
		checked,
		label,
		onChange,
	}: {
		checked: boolean;
		label: string;
		onChange: React.ChangeEventHandler<HTMLInputElement>;
	}) => (
		<label>
			<input type='checkbox' checked={checked} onChange={onChange} />
			{label}
		</label>
	),
}));

const NOTEBOOK_SCHEMA: ITechnicalReviewSchema = {
	keyboard_condition: {
		type: 'string',
		label: 'Estado estético del teclado',
		options: [{ value: 'worn', label: 'Desgaste visible' }],
	},
	non_functional_keys_count: {
		type: 'integer',
		label: 'Teclas que no funcionan',
		hint: 'Cuenta las teclas que faltan o no responden.',
	},
	touchpad_condition: {
		type: 'string',
		label: 'Touchpad',
		options: [{ value: 'worn', label: 'Cuesta hacer click' }],
	},
	hinge_condition: {
		type: 'string',
		label: 'Bisagras',
		required: true,
		options: [{ value: 'loose', label: 'Suelta' }],
	},
	speakers_condition: {
		type: 'string',
		label: 'Parlantes',
		options: [{ value: 'broken', label: 'Sin audio o audio distorsionado' }],
	},
};

const DESKTOP_SCHEMA: ITechnicalReviewSchema = {
	powers_on: { type: 'boolean', label: '¿Enciende?' },
};

/** Opciones de un campo concreto, no la unión de la sección. */
const optionValuesOf = (fieldLabel: string): string[] =>
	within(screen.getByRole('group', { name: new RegExp(fieldLabel) }))
		.getAllByRole('button')
		.map((option) => option.dataset.value ?? '');

/**
 * El grupo ya no expone `aria-required`: no es un atributo válido en `role='group'`, y el
 * `role='radiogroup'` que lo admitía prometía una navegación por flechas que el módulo
 * nunca implementó. El `required` que publica el schema viaja ahora sólo en el asterisco
 * del rótulo, que es el elemento al que apunta `aria-labelledby`.
 */
const isMarkedRequired = (fieldLabel: RegExp): boolean => {
	const labelId = screen.getByRole('group', { name: fieldLabel }).getAttribute('aria-labelledby');
	const label = labelId ? document.getElementById(labelId) : null;
	return label?.textContent?.includes('*') ?? false;
};

describe('ZF-48 schema fields', () => {
	it('derives the keyboard checkbox from the persisted count', () => {
		let getValues: (() => NotebookFormData) | undefined;

		const Harness = () => {
			const form = useForm<NotebookFormData>({
				defaultValues: { non_functional_keys_count: 0 },
			});
			getValues = form.getValues;
			return (
				<InputSection
					control={form.control}
					errors={form.formState.errors}
					readOnly={false}
					watch={form.watch}
					setValue={form.setValue}
					schemaFields={NOTEBOOK_SCHEMA}
				/>
			);
		};

		render(<Harness />);
		fireEvent.click(screen.getByRole('checkbox', { name: 'Teclas que no funcionan' }));
		expect(getValues?.().non_functional_keys_count).toBe(1);
		expect(screen.getByText('1')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('checkbox', { name: 'Teclas que no funcionan' }));
		expect(getValues?.().non_functional_keys_count).toBe(0);
	});

	it('stores false as a valid desktop power response', () => {
		let getValues: (() => DesktopFormData) | undefined;

		const Harness = () => {
			const form = useForm<DesktopFormData>();
			getValues = form.getValues;
			return (
				<DesktopAestheticsSection
					control={form.control}
					errors={form.formState.errors}
					readOnly={false}
					watch={form.watch}
					setValue={form.setValue}
					schemaFields={DESKTOP_SCHEMA}
				/>
			);
		};

		render(<Harness />);
		fireEvent.click(screen.getByRole('button', { name: 'No' }));
		expect(getValues?.().powers_on).toBe(false);
	});

	// B1: sin schema remoto los tres campos que ZF-48 volvió dinámicos quedaban sin
	// opciones y sin título, con la revisión imposible de completar. En `develop`
	// funcionan con las constantes locales.
	it('falls back to the local options when the remote schema is unavailable', () => {
		const Harness = () => {
			const form = useForm<NotebookFormData>();
			return (
				<InputSection
					control={form.control}
					errors={form.formState.errors}
					readOnly={false}
					watch={form.watch}
					setValue={form.setValue}
					schemaFields={undefined}
				/>
			);
		};

		render(<Harness />);

		// Títulos locales, no encabezados en blanco.
		expect(screen.getAllByText('Teclado').length).toBeGreaterThan(0);
		expect(screen.getAllByText('Touchpad').length).toBeGreaterThan(0);
		expect(screen.getAllByText('Bisagras').length).toBeGreaterThan(0);

		// Las opciones se comprueban campo por campo: la unión de todos los radios de la
		// sección daba por buena cualquier opción con tal de que existiera en algún otro
		// campo, y así fijó en verde un valor que el backend rechaza.
		expect(optionValuesOf('Teclado')).toEqual(['ok', 'worn', 'missing_pieces', 'broken']);
		expect(optionValuesOf('Touchpad')).toEqual(['ok', 'worn', 'missing_pieces', 'broken']);
		// B1-bis: la bisagra tiene su propio contrato (`CONDITION_HINGE`). No admite
		// `missing_pieces` y sí los dos estados de grado C que ZB-89 separó.
		expect(optionValuesOf('Bisagras')).toEqual(['ok', 'worn', 'cracked', 'loose', 'broken']);
	});

	it('marks the required fields from the published schema', () => {
		const Harness = () => {
			const form = useForm<NotebookFormData>();
			return (
				<InputSection
					control={form.control}
					errors={form.formState.errors}
					readOnly={false}
					watch={form.watch}
					setValue={form.setValue}
					schemaFields={NOTEBOOK_SCHEMA}
				/>
			);
		};

		render(<Harness />);

		// `required` lo publica el backend; sin consumirlo el asterisco quedaba fijo en
		// el teclado y nunca aparecía en bisagras, que también es obligatorio.
		expect(isMarkedRequired(/Bisagras/)).toBe(true);
		expect(isMarkedRequired(/Parlantes/)).toBe(false);
	});

	it('keeps the desktop power question visible without a remote schema', () => {
		let getValues: (() => DesktopFormData) | undefined;

		const Harness = () => {
			const form = useForm<DesktopFormData>();
			getValues = form.getValues;
			return (
				<DesktopAestheticsSection
					control={form.control}
					errors={form.formState.errors}
					readOnly={false}
					watch={form.watch}
					setValue={form.setValue}
					schemaFields={undefined}
				/>
			);
		};

		render(<Harness />);
		expect(screen.getByText('¿El equipo enciende?')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'No' }));
		expect(getValues?.().powers_on).toBe(false);
	});
});
