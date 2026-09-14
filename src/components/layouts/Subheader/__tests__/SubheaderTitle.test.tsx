import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SubheaderTitle from '../SubheaderTitle';

// `Badge` lee el tema desde Redux y anima con gsap; el test no monta un Provider.
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('gsap', () => ({ default: { fromTo: vi.fn() } }));
vi.mock('@/components/icon/Icon', () => ({
	default: ({ icon }: { icon: string }) => <span data-testid='subheader-icon'>{icon}</span>,
}));

describe('SubheaderTitle', () => {
	it('expone el título como encabezado principal junto a su descripción', () => {
		render(
			<SubheaderTitle
				icon='HeroCube'
				title='Stock por ubicación'
				description='Stock físico por bodega'
			/>,
		);

		expect(screen.getByRole('heading', { level: 1, name: 'Stock por ubicación' })).toBeTruthy();
		expect(screen.getByText('Stock físico por bodega')).toBeTruthy();
		expect(screen.getByTestId('subheader-icon').textContent).toBe('HeroCube');
	});

	it('omite ícono y descripción cuando no se entregan', () => {
		const { container } = render(<SubheaderTitle title='Bodegas' />);

		expect(screen.getByRole('heading', { level: 1, name: 'Bodegas' })).toBeTruthy();
		expect(screen.queryByTestId('subheader-icon')).toBeNull();
		expect(container.querySelector('p')).toBeNull();
	});
});
