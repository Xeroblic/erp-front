import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Tooltip from '../Tooltip';

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
});
