import type { PropsWithChildren } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StepWizard, {
	type IWizardStepConfig,
} from '@/pages/inventario/abastecimiento/AjustesTraslados/components/parts/StepWizard';

/**
 * El paso que sale debe desplazarse según el cambio actual, no según la
 * dirección con que entró: tras retroceder y volver a avanzar, sale hacia la
 * izquierda.
 */

vi.mock('@/components/icon/Icon', () => ({ default: () => null }));
vi.mock('@/components/ui/Button', () => ({
	default: ({ children, onClick }: PropsWithChildren<{ onClick?: () => void }>) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));

const steps: IWizardStepConfig[] = [
	{ key: 'ubicacion', label: 'Ubicación', icon: 'HeroMapPin' },
	{ key: 'productos', label: 'Productos', icon: 'HeroCube' },
	{ key: 'motivo', label: 'Motivo', icon: 'HeroCheck' },
];

const renderWizard = (step: number, direction: number) => (
	<StepWizard
		steps={steps}
		step={step}
		direction={direction}
		onStepClick={() => undefined}
		onPrev={() => undefined}
		onNext={() => undefined}
		finishActions={null}>
		<p>Contenido del paso {step}</p>
	</StepWizard>
);

const sectionOf = (label: string) =>
	screen.getByRole('heading', { name: new RegExp(label) }).closest('section');

/** Desplazamiento horizontal que framer-motion escribe en el estilo inline. */
const translateX = (element: HTMLElement | null) => {
	if (!element) throw new Error('No se encontró el paso animado.');
	const match = /translateX\((-?[\d.]+)px\)/.exec(element.style.transform);
	return match ? Number(match[1]) : 0;
};

describe('StepWizard › dirección de la animación de salida', () => {
	it('tras retroceder y avanzar, el paso que sale se va hacia la izquierda', async () => {
		const { rerender } = render(renderWizard(1, 1));

		rerender(renderWizard(0, -1));
		await screen.findByRole('heading', { name: /Ubicación/ });
		await waitFor(() => expect(translateX(sectionOf('Ubicación'))).toBe(0));

		rerender(renderWizard(1, 1));
		const leaving = sectionOf('Ubicación');
		await waitFor(() => expect(translateX(leaving)).toBeLessThan(0));
	});

	it('al retroceder, el paso que sale se va hacia la derecha', async () => {
		const { rerender } = render(renderWizard(1, 1));

		rerender(renderWizard(0, -1));
		const leaving = sectionOf('Productos');
		await waitFor(() => expect(translateX(leaving)).toBeGreaterThan(0));
	});
});
