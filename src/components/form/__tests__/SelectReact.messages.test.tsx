import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SelectReact from '../SelectReact';

/**
 * Mensajes del menú. react-select trae los suyos en inglés («No options»,
 * «Loading...»); el componente compartido los reemplaza por defecto y deja
 * que cada uso pase el suyo.
 */

vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));

/** En escritorio el componente controla la apertura: se abre como un usuario. */
const openMenu = () => {
	const input = screen.getByRole('combobox');
	fireEvent.focus(input);
	fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
};

describe('SelectReact — mensajes del menú', () => {
	it('sin opciones dice «Sin opciones» en vez de «No options»', () => {
		render(<SelectReact name='marca' options={[]} />);
		openMenu();

		expect(screen.getByText('Sin opciones')).toBeInTheDocument();
		expect(screen.queryByText('No options')).not.toBeInTheDocument();
	});

	it('mientras carga dice «Cargando…»', () => {
		render(<SelectReact name='marca' options={[]} isLoading />);
		openMenu();

		expect(screen.getByText('Cargando…')).toBeInTheDocument();
	});

	it('respeta el mensaje propio de cada uso', () => {
		render(
			<SelectReact
				name='producto'
				options={[]}
				noOptionsMessage={() => 'Sin productos que coincidan.'}
			/>,
		);
		openMenu();

		expect(screen.getByText('Sin productos que coincidan.')).toBeInTheDocument();
	});
});
