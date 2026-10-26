import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FieldValues } from 'react-hook-form';
import FormShell from '../FormShell';
import type { FormSectionProps, SectionConfig } from '../types';

/**
 * La sección que sale debe desplazarse según el cambio actual, no según la
 * dirección con que entró: al retroceder sale hacia la derecha y, al volver a
 * avanzar, hacia la izquierda.
 */

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

const renderShell = () =>
	render(
		<FormShell<FieldValues>
			sections={SECTIONS}
			sectionProps={{ readOnly: false } as unknown as FormSectionProps<FieldValues>}
			onBack={vi.fn()}
			onFinish={vi.fn()}
		/>,
	);

const click = async (name: RegExp) => {
	// `act` asíncrono: `handleNext` espera la validación antes de cambiar de paso.
	await act(() => {
		fireEvent.click(screen.getByRole('button', { name }));
		return Promise.resolve();
	});
};

/** Contenedor animado de la sección cuyo título es `label`. */
const sectionOf = (label: string) => screen.getByRole('heading', { name: label }).parentElement;

/** Desplazamiento horizontal que framer-motion escribe en el estilo inline. */
const translateX = (element: HTMLElement | null) => {
	if (!element) throw new Error('No se encontró la sección animada.');
	const match = /translateX\((-?[\d.]+)px\)/.exec(element.style.transform ?? '');
	return match ? Number(match[1]) : 0;
};

/** Avanza y espera a que la sección dos termine de entrar. */
const goToSectionTwo = async () => {
	await click(/Siguiente/i);
	await screen.findByRole('heading', { name: 'Sección dos' });
	await waitFor(() => expect(translateX(sectionOf('Sección dos'))).toBe(0));
};

describe('FormShell · dirección de la animación de salida', () => {
	beforeEach(() => {
		// jsdom no implementa `scrollTo`, que FormShell llama en cada cambio de paso.
		vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
	});

	it('al retroceder, la sección que sale se va hacia la derecha', async () => {
		renderShell();
		await goToSectionTwo();

		await click(/Anterior/i);
		const leaving = sectionOf('Sección dos');
		await waitFor(() => expect(translateX(leaving)).toBeGreaterThan(0));
	});

	it('tras retroceder y avanzar, la sección que sale se va hacia la izquierda', async () => {
		renderShell();
		await goToSectionTwo();

		await click(/Anterior/i);
		await screen.findByRole('heading', { name: 'Sección uno' });
		await waitFor(() => expect(translateX(sectionOf('Sección uno'))).toBe(0));

		await click(/Siguiente/i);
		const leaving = sectionOf('Sección uno');
		await waitFor(() => expect(translateX(leaving)).toBeLessThan(0));
	});
});
