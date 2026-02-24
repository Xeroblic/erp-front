// Tipos customizados para pdfmake (para evitar `any` y conflictos de interfaz)
export type PdfContent = Record<string, unknown> | string | PdfContent[];
export type PdfTableCell = Record<string, unknown> | string | PdfContent[];

import type { SalesDashboardStats, SaleRecord } from '../../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const currencyFormatter = new Intl.NumberFormat('es-CL', {
	style: 'currency',
	currency: 'CLP',
	maximumFractionDigits: 0,
});

export const buildHeader = (dateFrom?: string, dateTo?: string): PdfContent => {
	const today = format(new Date(), "dd 'de' MMMM, yyyy HH:mm", { locale: es });
	let dateRangeText = 'Histórico completo';

	if (dateFrom && dateTo) {
		dateRangeText = `${format(new Date(dateFrom), 'dd/MM/yyyy')} - ${format(
			new Date(dateTo),
			'dd/MM/yyyy',
		)}`;
	} else if (dateFrom) {
		dateRangeText = `Desde ${format(new Date(dateFrom), 'dd/MM/yyyy')}`;
	} else if (dateTo) {
		dateRangeText = `Hasta ${format(new Date(dateTo), 'dd/MM/yyyy')}`;
	}

	return {
		columns: [
			{
				stack: [
					{ text: 'ZENTRIA', fontSize: 24, bold: true, color: '#0f172a' },
					{ text: 'ERP System', fontSize: 10, color: '#64748b', margin: [0, 2, 0, 0] },
				],
				width: '50%',
			},
			{
				stack: [
					{ text: 'REPORTE EJECUTIVO DE VENTAS', fontSize: 14, bold: true, alignment: 'right', color: '#0f172a' },
					{ text: `Periodo: ${dateRangeText}`, fontSize: 10, alignment: 'right', color: '#475569', margin: [0, 4, 0, 0] },
					{ text: `Generado: ${today}`, fontSize: 9, alignment: 'right', color: '#94a3b8', margin: [0, 2, 0, 0] },
				],
				width: '50%',
			},
		],
		margin: [0, 0, 0, 20],
	};
};

export const buildExecutiveSummary = (insights: string[]): PdfContent => {
	return {
		stack: [
			{ text: 'RESUMEN EJECUTIVO', fontSize: 12, bold: true, color: '#1e293b', margin: [0, 0, 0, 8] },
			{
				ul: insights.map((insight) => ({
					text: insight,
					fontSize: 10,
					color: '#334155',
					margin: [0, 0, 0, 4],
				})),
				margin: [10, 0, 0, 15],
			},
		],
	};
};

export const buildSmartKPIs = (stats: SalesDashboardStats): PdfContent => {
	const kpiBlock = (label: string, value: string, color: string): PdfTableCell => ({
		stack: [
			{ text: label.toUpperCase(), fontSize: 8, bold: true, color: '#64748b', alignment: 'center', margin: [0, 0, 0, 4] },
			{ text: value, fontSize: 16, bold: true, color: color, alignment: 'center' },
		],
		fillColor: '#f8fafc',
		border: [false, false, false, false],
		margin: [0, 10, 0, 10],
	});

	return {
		table: {
			widths: ['*', '*', '*', '*'],
			body: [
				[
					kpiBlock('Ventas Totales', currencyFormatter.format(stats.total), '#0f766e'),
					kpiBlock('Ticket Promedio', currencyFormatter.format(stats.avg), '#4338ca'),
					kpiBlock('Devoluciones', currencyFormatter.format(stats.refundedTotal), '#b45309'),
					kpiBlock('Predicción 30 Días', currencyFormatter.format(stats.projectedTotal), '#0369a1'),
				],
			],
		},
		layout: {
			hLineWidth: () => 0,
			vLineWidth: (i: number, node: { widths?: string[] }) => (i === 0 || i === node.widths?.length ? 0 : 1),
			vLineColor: () => '#e2e8f0',
			paddingLeft: () => 8,
			paddingRight: () => 8,
		},
		margin: [0, 0, 0, 25],
	};
};

export const buildTopPerformersTable = (customerData: { name: string; total: number }[]): PdfContent => {
	if (customerData.length === 0) return { text: '' };

	return {
		stack: [
			{ text: 'TOP 5 CLIENTES', fontSize: 12, bold: true, color: '#1e293b', margin: [0, 0, 0, 8] },
			{
				table: {
					headerRows: 1,
					widths: ['auto', '*', 'auto'],
					body: [
						[
							{ text: 'RANK', fontSize: 9, bold: true, color: '#64748b', fillColor: '#f1f5f9', border: [false, false, false, true] },
							{ text: 'CLIENTE', fontSize: 9, bold: true, color: '#64748b', fillColor: '#f1f5f9', border: [false, false, false, true] },
							{ text: 'TOTAL COMPRADO', fontSize: 9, bold: true, color: '#64748b', alignment: 'right', fillColor: '#f1f5f9', border: [false, false, false, true] },
						],
						...customerData.slice(0, 5).map((c, idx) => [
							{ text: `#${idx + 1}`, fontSize: 10, color: '#334155', border: [false, false, false, true], borderColor: ['#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0'] },
							{ text: c.name, fontSize: 10, color: '#0f172a', bold: true, border: [false, false, false, true], borderColor: ['#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0'] },
							{ text: currencyFormatter.format(c.total), fontSize: 10, color: '#10b981', bold: true, alignment: 'right', border: [false, false, false, true], borderColor: ['#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0'] },
						]),
					],
				},
				layout: {
					hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === node.table.body.length ? 1 : 1),
					vLineWidth: () => 0,
					hLineColor: () => '#e2e8f0',
					paddingTop: () => 8,
					paddingBottom: () => 8,
				},
				margin: [0, 0, 0, 20],
			},
		],
	};
};
