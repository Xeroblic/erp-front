import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TutorialStep } from '@/components/types/TutorialModal';
import TutorialModal from '../TutorialModal';

/**
 * Cierre y navegación accesibles del tutorial: botón con nombre, Escape como equivalente de
 * teclado del clic en el fondo e indicadores de paso con etiqueta.
 */

// Las animaciones de GSAP terminan de inmediato para que el cierre no dependa del tiempo.
vi.mock('gsap', () => {
	const chain = { to: () => chain, fromTo: () => chain };
	return {
		default: {
			timeline: (options?: { onComplete?: () => void }) => {
				options?.onComplete?.();
				return chain;
			},
			fromTo: () => undefined,
		},
	};
});
vi.mock('swiper/react', () => ({
	Swiper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	SwiperSlide: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('swiper/modules', () => ({ Navigation: {}, Pagination: {} }));
vi.mock('@/hooks/useReactiveThemeConfig', () => {
	const useReactiveThemeConfig = () => ({ themeColor: 'blue', themeColorShade: '500' });
	return { default: useReactiveThemeConfig, useReactiveThemeConfig, adjustShade: () => '300' };
});
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: () => true, hasAnyPermission: () => true, isSuperAdmin: false }),
}));
vi.mock('@/utils/tailwindColorResolver.util', () => ({
	resolveTailwindColor: () => '#2563eb',
	resolveTailwindColorAlpha: () => 'rgba(37, 99, 235, 0.5)',
}));

const STEPS: TutorialStep[] = [
	{ title: 'Primer paso', description: 'Uno' },
	{ title: 'Segundo paso', description: 'Dos' },
];

const setIsOpen = vi.fn();

beforeEach(() => {
	setIsOpen.mockClear();
	// Portal monta en #portal-root, que en la app viene de index.html.
	if (!document.getElementById('portal-root')) {
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
	}
});

const renderTutorial = (isOpen = true) =>
	render(<TutorialModal steps={STEPS} title='Guía' isOpen={isOpen} setIsOpen={setIsOpen} />);

describe('TutorialModal', () => {
	it('se cierra con el botón «Cerrar tutorial»', () => {
		renderTutorial();

		fireEvent.click(screen.getByRole('button', { name: 'Cerrar tutorial' }));

		expect(setIsOpen).toHaveBeenCalledWith(false);
	});

	it('se cierra con Escape', () => {
		renderTutorial();

		fireEvent.keyDown(document, { key: 'Escape' });

		expect(setIsOpen).toHaveBeenCalledWith(false);
	});

	it('no escucha Escape mientras está cerrado', () => {
		renderTutorial(false);

		fireEvent.keyDown(document, { key: 'Escape' });

		expect(setIsOpen).not.toHaveBeenCalled();
	});

	it('nombra cada indicador de paso y marca el actual', () => {
		renderTutorial();

		const first = screen.getByRole('button', { name: 'Ir al paso 1: Primer paso' });
		const second = screen.getByRole('button', { name: 'Ir al paso 2: Segundo paso' });

		expect(first).toHaveAttribute('aria-current', 'step');
		expect(second).not.toHaveAttribute('aria-current');
	});
});
