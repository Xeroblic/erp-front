import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import type { ITechnicalReviewSchema } from '@/interface/technicalReviews.interface';
import type { NotebookFormData } from '../../validation/notebook.schema';
import InputSection from '../notebook/sections/InputSection';
import ScreenSection from '../notebook/sections/ScreenSection';

vi.mock('@/components/icon/Icon', () => ({ default: () => <span /> }));

vi.mock('@/components/form/Input', () => ({
	default: React.forwardRef<
		HTMLInputElement,
		React.InputHTMLAttributes<HTMLInputElement> & { invalidFeedback?: string }
	>((props, ref) => <input ref={ref} {...props} />),
}));

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

const KEYBOARD_COVER_SCHEMA: ITechnicalReviewSchema = {
	keyboard_cover_condition: {
		type: 'string',
		label: 'Cubierta del teclado',
		allowed_values: ['ok', 'worn', 'cracked', 'broken'],
		options: [
			{ value: 'ok', label: 'Sin daños' },
			{ value: 'cracked', label: 'Trizada (Máximo Grado B)' },
		],
		hint: 'Es distinto de la tapa superior y de las bisagras',
	},
};

const SCREEN_SCHEMA: ITechnicalReviewSchema = {
	screen_condition: {
		type: 'string',
		label: 'Condición de pantalla',
		allowed_values: ['ok', 'keyboard_marks'],
		options: [
			{ value: 'ok', label: 'Sin observaciones' },
			{ value: 'keyboard_marks', label: 'Marcas del teclado (Limita a: Máximo Grado B)' },
		],
	},
};

const renderInputSection = (schemaFields?: ITechnicalReviewSchema) => {
	let getValues: (() => NotebookFormData) | undefined;

	const Harness = () => {
		const form = useForm<NotebookFormData>();
		getValues = form.getValues;
		return (
			<InputSection
				control={form.control}
				errors={form.formState.errors}
				readOnly={false}
				watch={form.watch}
				setValue={form.setValue}
				schemaFields={schemaFields}
			/>
		);
	};

	render(<Harness />);
	return () => getValues?.();
};

const renderScreenSection = (schemaFields?: ITechnicalReviewSchema) => {
	let getValues: (() => NotebookFormData) | undefined;

	const Harness = () => {
		const form = useForm<NotebookFormData>();
		getValues = form.getValues;
		return (
			<ScreenSection
				control={form.control}
				errors={form.formState.errors}
				readOnly={false}
				watch={form.watch}
				setValue={form.setValue}
				schemaFields={schemaFields}
			/>
		);
	};

	render(<Harness />);
	return () => getValues?.();
};

const optionsOf = (fieldLabel: RegExp): string[] =>
	within(screen.getByRole('group', { name: fieldLabel }))
		.getAllByRole('button')
		.map((option) => option.dataset.value ?? '');

/**
 * El grupo ya no expone `aria-required`: no es válido en `role='group'`. El `required` del
 * schema viaja en el asterisco del rótulo al que apunta `aria-labelledby`.
 */
const isMarkedRequired = (fieldLabel: RegExp): boolean => {
	const labelId = screen.getByRole('group', { name: fieldLabel }).getAttribute('aria-labelledby');
	const label = labelId ? document.getElementById(labelId) : null;
	return label?.textContent?.includes('*') ?? false;
};

describe('keyboard cover condition', () => {
	it('is its own control, not the top cover nor the hinge', () => {
		renderInputSection(KEYBOARD_COVER_SCHEMA);

		expect(screen.getByRole('group', { name: /Cubierta del teclado/ })).toBeVisible();
		expect(optionsOf(/Cubierta del teclado/)).toEqual(['ok', 'cracked']);
	});

	/**
	 * El backend lo declara nullable y no lo incluye en `COMPLETION_REQUIREMENTS`: exigirlo
	 * en el formulario bloquearía revisiones que el backend sí acepta.
	 */
	it('is not marked as required', () => {
		renderInputSection(KEYBOARD_COVER_SCHEMA);

		expect(isMarkedRequired(/Cubierta del teclado/)).toBe(false);
	});

	it('falls back to the local options when the backend publishes no schema', () => {
		const getValues = renderInputSection(undefined);

		expect(optionsOf(/Cubierta del teclado/)).toEqual(['ok', 'worn', 'cracked', 'broken']);

		const group = screen.getByRole('group', { name: /Cubierta del teclado/ });
		fireEvent.click(within(group).getByRole('button', { name: /Trizada/ }));
		expect(getValues()?.keyboard_cover_condition).toBe('cracked');
	});
});

describe('keyboard marks on the screen', () => {
	/**
	 * `keyboard_marks` sólo existe si el backend con la fase F3 lo publica. Ofrecerlo desde
	 * una constante local dejaría al técnico elegir un valor que el backend rechaza con 422.
	 */
	it('is not offered when the remote schema is unavailable', () => {
		renderScreenSection(undefined);

		expect(optionsOf(/Condición [Dd]e [Pp]antalla/)).not.toContain('keyboard_marks');
	});

	it('is offered and stored once the backend publishes it', () => {
		const getValues = renderScreenSection(SCREEN_SCHEMA);

		expect(optionsOf(/Condición [Dd]e [Pp]antalla/)).toContain('keyboard_marks');

		const group = screen.getByRole('group', { name: /Condición [Dd]e [Pp]antalla/ });
		fireEvent.click(within(group).getByRole('button', { name: /Marcas del teclado/ }));
		expect(getValues()?.screen_condition).toBe('keyboard_marks');
	});
});
