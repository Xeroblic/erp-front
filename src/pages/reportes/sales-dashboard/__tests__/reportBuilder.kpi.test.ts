import { describe, expect, it } from 'vitest';
import { buildSmartKPIs, kpiValueFontSize } from '../utils/pdf/reportBuilder';
import type { SalesDashboardStats } from '../../types';

/** Ancho útil de una tarjeta de KPI: 121,3 pt menos 12 pt de relleno por lado. */
const CARD_TEXT_WIDTH = 97.3;

type TCanvasPoint = { x: number; y: number };

describe('reportBuilder › tarjetas de KPI', () => {
	it('mantiene 16 pt cuando el monto cabe', () => {
		expect(kpiValueFontSize('$367.560', CARD_TEXT_WIDTH)).toBe(16);
	});

	it('achica un monto largo para que no se parta en dos renglones', () => {
		// A 16 pt, «$220.903.853» mide 99,8 pt en Roboto Medium.
		const fontSize = kpiValueFontSize('$220.903.853', CARD_TEXT_WIDTH);

		expect(fontSize).toBeLessThan(16);
		expect(fontSize * 6.239).toBeLessThanOrEqual(CARD_TEXT_WIDTH);
	});

	it('no baja de 9 pt aunque el monto sea muy largo', () => {
		expect(kpiValueFontSize('$999.999.999.999.999.999', CARD_TEXT_WIDTH)).toBe(9);
	});

	it('dibuja el minigráfico bajo el monto, sin cruzarlo', () => {
		const stats = {
			total: 220903853,
			avg: 367560,
			refundedTotal: 81796189,
			projectedTotal: 1950853,
		};
		const kpis = buildSmartKPIs(stats as SalesDashboardStats) as {
			columns: { stack?: [{ canvas: [unknown, { points: TCanvasPoint[] }] }] }[];
		};
		const cards = kpis.columns.filter((column) => column.stack);
		const points = cards.flatMap((card) => card.stack?.[0].canvas[1].points ?? []);

		expect(cards).toHaveLength(4);
		// El texto (título y monto) termina cerca de y = 47 dentro de la tarjeta de 75 pt.
		expect(Math.min(...points.map((point) => point.y))).toBeGreaterThanOrEqual(54);
		expect(Math.max(...points.map((point) => point.y))).toBeLessThanOrEqual(75);
		// pdfmake desplaza los puntos en el lugar: compartirlos entre tarjetas saca la línea de la página.
		const pointObjects = new Set(points);
		expect(pointObjects.size).toBe(points.length);
	});
});
