/**
 * Las tarjetas de «Cantidad de Puertos» quedaron sin icono durante meses porque `Icon`
 * resuelve el nombre contra el sistema de archivos y, cuando no encuentra nada, no dibuja
 * ni avisa: ni la consola ni `tsc` lo delataban, porque `TIcons` incluye `string`.
 *
 * Esta prueba monta el `Icon` real —no un mock— con el nombre que declara cada tipo de
 * puerto y exige que aparezca un `<svg>`. Es la única forma de que el defecto vuelva a
 * ponerse en rojo: cambiar un nombre por uno inexistente rompe este archivo.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Icon from '@/components/icon/Icon';

import { PORT_COUNTER_VISUALS } from '../ports.visuals';
import { ALLOWED_PORT_TYPES } from '../../validation/constants/ports.rules';

// El tema sale del store de personalización; acá sólo importa que el icono se resuelva.
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));

describe('PORT_COUNTER_VISUALS', () => {
	it('cubre los nueve tipos del catálogo de puertos', () => {
		expect(Object.keys(PORT_COUNTER_VISUALS).sort()).toEqual([...ALLOWED_PORT_TYPES].sort());
	});

	it.each(ALLOWED_PORT_TYPES)('dibuja el icono del puerto %s', async (portType) => {
		const { icon } = PORT_COUNTER_VISUALS[portType];

		render(<Icon icon={icon} data-testid={`icono-${portType}`} />);

		await waitFor(() => {
			expect(screen.getByTestId(`icono-${portType}`)).toBeInTheDocument();
		});
	});
});
