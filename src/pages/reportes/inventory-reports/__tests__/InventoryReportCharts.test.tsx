import { render } from '@testing-library/react';
import type { ApexFormatterOpts, ApexOptions } from 'apexcharts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InventoryReportCharts from '@/pages/reportes/inventory-reports/components/charts/InventoryReportCharts';
import type { IInventoryReportStats } from '@/pages/reportes/inventory-reports/utils';

/**
 * Con los tipos de apexcharts 8 el formatter del tooltip recibe `opts` opcional y un valor que puede ser
 * `null`: el de antigüedad no debe romperse cuando falta alguno de los dos.
 */

const charts = vi.hoisted(() => ({ options: [] as ApexOptions[] }));
vi.mock('@/components/Chart', () => ({
	default: ({ options }: { options: ApexOptions }) => {
		charts.options.push(options);
		return null;
	},
}));
vi.mock('@/hooks/useDarkMode', () => ({ default: () => ({ isDarkTheme: false }) }));
vi.mock('@/components/icon/Icon', () => ({ default: () => null }));

type TYFormatter = (value: number | null, opts?: { dataPointIndex: number }) => string;

const stats: IInventoryReportStats = {
	kpis: [],
	statuses: { out: 1, critical: 0, unconfigured: 0, healthy: 2 },
	branches: [],
	topProducts: [],
	aging: [
		{ label: 'Hasta 30 días', units: 12, products: 3 },
		{ label: '31 a 90 días', units: 1, products: 1 },
	],
};
const AGING_LABELS = stats.aging.map((bucket) => bucket.label);

const agingFormatter = (): TYFormatter => {
	const options = charts.options.find(
		(option) => JSON.stringify(option.xaxis?.categories) === JSON.stringify(AGING_LABELS),
	);
	const y = options?.tooltip?.y;
	if (!y || Array.isArray(y) || !y.formatter) {
		throw new Error('El gráfico de antigüedad no tiene formatter de tooltip.');
	}
	return (value, opts) => String(y.formatter?.(value, opts as ApexFormatterOpts));
};

describe('InventoryReportCharts › tooltip de antigüedad', () => {
	beforeEach(() => {
		charts.options = [];
		render(<InventoryReportCharts stats={stats} />);
	});

	it('cuenta unidades y productos del tramo señalado', () => {
		expect(agingFormatter()(12, { dataPointIndex: 0 })).toBe('12 unidades en 3 productos');
		expect(agingFormatter()(1, { dataPointIndex: 1 })).toBe('1 unidad en 1 producto');
	});

	it('sin valor ni tramo muestra cero en vez de fallar', () => {
		expect(agingFormatter()(null)).toBe('0 unidades en 0 productos');
	});
});
