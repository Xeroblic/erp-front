import { describe, expect, it } from 'vitest';
import { buildExecutiveSummary, buildSemesterDeepDive } from '../utils/pdf/reportBuilder';
import type { SaleRecord } from '../../types';

/** Símbolos que Roboto, la única fuente del PDF, no trae: pdfmake los dibuja como un cuadro vacío. */
const GLYPHS_WITHOUT_ROBOTO = /[✧✦★◆◇▸▶※]/u;

type TCard = { width: number };
type TSemesterPage = { stack: [unknown, { columns: TCard[] }, ...unknown[]] };

const sale = (date: string, total: number): SaleRecord =>
	({ sale_date: date, total_amount: total, customer: 'Cliente' }) as unknown as SaleRecord;

const textOf = (content: unknown): string => JSON.stringify(content);

describe('reportBuilder › páginas semestrales y síntesis', () => {
	it('no usa símbolos que Roboto no puede dibujar', () => {
		const pages = [
			buildExecutiveSummary(['Ventas estables.']),
			...buildSemesterDeepDive([sale('2024-03-10', 1000)]),
		];

		expect(textOf(pages)).not.toMatch(GLYPHS_WITHOUT_ROBOTO);
	});

	it('pone las cuatro tarjetas en una sola fila que cabe en la página', () => {
		const [page] = buildSemesterDeepDive([sale('2024-03-10', 1000)]) as TSemesterPage[];
		const row = page.stack[1].columns;
		const width = row.reduce((total, column) => total + column.width, 0);

		expect(row.filter((column) => column.width > 10)).toHaveLength(4);
		expect(textOf(row)).toContain('CRECIMIENTO VS 2023');
		// A4 menos los márgenes de 40 pt del reporte ejecutivo.
		expect(width).toBeLessThanOrEqual(515);
	});

	it('sin el mismo semestre del año anterior lo dice, en vez de «variación del N/A»', () => {
		const [page] = buildSemesterDeepDive([sale('2024-03-10', 1000)]);
		const text = textOf(page);

		expect(text).toContain('No hay ventas del mismo semestre de 2023 para comparar.');
		expect(text).not.toContain('N/A');
	});

	it('con el año anterior cuenta la variación', () => {
		const pages = buildSemesterDeepDive([sale('2023-03-10', 1000), sale('2024-03-10', 1500)]);

		expect(textOf(pages[1])).toContain('se observa una expansión del +50.0%.');
	});
});
