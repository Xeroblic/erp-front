import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Chart from '../Chart';

/**
 * `Chart` crea la instancia de ApexCharts en un `requestAnimationFrame`. Si la serie
 * cambia antes de ese frame (datos que llegan justo después del montaje), la instancia
 * tiene que nacer con la serie vigente y no con la del primer render.
 */

const apex = vi.hoisted(() => ({
	created: [] as Array<{ series: unknown }>,
	updateSeries: vi.fn(),
}));

vi.mock('apexcharts', () => ({
	default: class ApexChartsMock {
		static exec = () => undefined;

		el: HTMLElement;

		constructor(el: HTMLElement, options: { series: unknown }) {
			this.el = el;
			apex.created.push({ series: options.series });
		}

		render = () => Promise.resolve();

		updateOptions = vi.fn();

		updateSeries = apex.updateSeries;

		destroy = vi.fn();
	},
}));

beforeEach(() => {
	apex.created.length = 0;
	apex.updateSeries.mockClear();
});

describe('Chart', () => {
	it('crea el gráfico con la serie vigente aunque cambie antes del primer frame', async () => {
		const empty = [{ name: 'Ventas', data: [] }];
		const loaded = [{ name: 'Ventas', data: [10, 20, 30] }];

		const { rerender } = render(<Chart type='area' series={empty} />);
		rerender(<Chart type='area' series={loaded} />);

		await waitFor(() => expect(apex.created).toHaveLength(1));
		expect(apex.created[0].series).toEqual(loaded);
	});
});
