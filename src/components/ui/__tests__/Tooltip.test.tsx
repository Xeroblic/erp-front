import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Tooltip from '../Tooltip';

vi.mock('@/components/icon/Icon', () => ({
	default: () => <span aria-hidden='true' />,
}));

describe('Tooltip', () => {
	beforeEach(() => {
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
	});

	afterEach(() => {
		document.getElementById('portal-root')?.remove();
	});
	it('muestra y oculta el contenido al enfocar y desenfocar el control', () => {
		render(
			<Tooltip text='Detalle accesible'>
				<button type='button'>Información</button>
			</Tooltip>,
		);
		const trigger = screen.getByRole('button', { name: 'Información' });

		fireEvent.focus(trigger);
		expect(screen.getByText('Detalle accesible')).toBeInTheDocument();

		fireEvent.blur(trigger);
		expect(screen.queryByText('Detalle accesible')).not.toBeInTheDocument();
	});
	it('mantiene los handlers de foco del hijo', () => {
		const onFocus = vi.fn();
		const onBlur = vi.fn();
		render(
			<Tooltip text='Detalle accesible'>
				<button type='button' onFocus={onFocus} onBlur={onBlur}>
					Información
				</button>
			</Tooltip>,
		);
		const trigger = screen.getByRole('button', { name: 'Información' });
		fireEvent.focus(trigger);
		fireEvent.blur(trigger);
		expect(onFocus).toHaveBeenCalledOnce();
		expect(onBlur).toHaveBeenCalledOnce();
	});

	it('da nombre y acción al icono fallback', () => {
		render(<Tooltip text='Descripción del campo' />);
		const trigger = screen.getByRole('button', {
			name: 'Más información: Descripción del campo',
		});

		fireEvent.click(trigger);
		expect(screen.getByText('Descripción del campo')).toBeInTheDocument();
		fireEvent.click(trigger);
		expect(screen.queryByText('Descripción del campo')).not.toBeInTheDocument();
	});
});
