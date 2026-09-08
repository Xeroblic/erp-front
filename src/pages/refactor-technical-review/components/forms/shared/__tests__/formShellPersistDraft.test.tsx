import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FieldValues } from 'react-hook-form';
import FormShell from '../FormShell';
import type { FormSectionProps, SectionConfig } from '../types';

vi.mock('@/components/icon/Icon', () => ({ default: () => <span /> }));

vi.mock('@/components/ui/Button', () => ({
	default: ({
		children,
		onClick,
	}: {
		children: React.ReactNode;
		onClick?: React.MouseEventHandler<HTMLButtonElement>;
	}) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));

vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));

const SECTIONS: SectionConfig<FieldValues>[] = [
	{
		key: 'uno',
		label: 'Sección uno',
		icon: 'HeroInformationCircle',
		component: () => <p>contenido uno</p>,
	},
	{
		key: 'dos',
		label: 'Sección dos',
		icon: 'HeroCpuChip',
		component: () => <p>contenido dos</p>,
	},
];

const renderShell = (isValid: boolean) => {
	const onPersistDraft = vi.fn().mockResolvedValue(undefined);
	const onStepChange = vi.fn();

	render(
		<FormShell<FieldValues>
			sections={SECTIONS}
			sectionProps={{ readOnly: false } as unknown as FormSectionProps<FieldValues>}
			onBack={vi.fn()}
			onFinish={vi.fn()}
			onStepChange={onStepChange}
			onPersistDraft={onPersistDraft}
			onValidateStep={() => Promise.resolve({ isValid, message: 'Falta un campo' })}
		/>,
	);

	return { onPersistDraft, onStepChange };
};

const clickNext = async () => {
	// `act` asíncrono: la validación del paso y el guardado del borrador son promesas.
	await act(() => {
		fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));
		return Promise.resolve();
	});
};

describe('FormShell · borrador de una sección trabada (ZF-102)', () => {
	/**
	 * El autoguardado por navegación sólo corría al cambiar de sección: una sección que la
	 * validación trababa se perdía entera, y sus campos quedaban NULL en la base.
	 */
	it('guarda el borrador cuando la validación bloquea el avance', async () => {
		const { onPersistDraft, onStepChange } = renderShell(false);

		await clickNext();

		expect(onPersistDraft).toHaveBeenCalledTimes(1);
		expect(onStepChange).not.toHaveBeenCalled();
		expect(screen.getByRole('button', { name: /Siguiente/i })).toBeInTheDocument();
	});

	it('no duplica el guardado cuando la sección sí avanza', async () => {
		const { onPersistDraft, onStepChange } = renderShell(true);

		await clickNext();

		expect(onPersistDraft).not.toHaveBeenCalled();
		expect(onStepChange).toHaveBeenCalledWith('next');
		// La última sección ya no ofrece «Siguiente», sino el cierre de la revisión.
		expect(screen.getByRole('button', { name: /Finalizar Revisión/i })).toBeInTheDocument();
	});
});
