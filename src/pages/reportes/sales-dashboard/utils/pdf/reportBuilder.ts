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
		stack: [
			{
				canvas: [
					{ type: 'rect', x: -40, y: -40, w: 596, h: 140, color: '#0f172a' }
				]
			},
			{
				columns: [
					{
						stack: [
							{ text: 'ZENTRIA', fontSize: 28, bold: true, color: '#ffffff', letterSpacing: 2 },
							{ text: 'INTELIGENCIA DE NEGOCIOS', fontSize: 10, color: '#94a3b8', margin: [0, 4, 0, 0], letterSpacing: 1 },
						],
						width: '60%',
					},
					{
						stack: [
							{ text: 'REPORTE EJECUTIVO', fontSize: 14, bold: true, alignment: 'right', color: '#ffffff', margin: [0, 4, 0, 0] },
							{ text: `Periodo: ${dateRangeText}`, fontSize: 10, alignment: 'right', color: '#cbd5e1', margin: [0, 4, 0, 0] },
							{ text: `Generado: ${today}`, fontSize: 9, alignment: 'right', color: '#64748b', margin: [0, 2, 0, 0] },
						],
						width: '40%',
					},
				],
				margin: [0, -110, 0, 60] // Pulls the text over the canvas background safely and creates bottom spacing
			}
		]
	} as PdfContent;
};

export const buildExecutiveSummary = (insights: string[]): PdfContent => {
	return {
		table: {
			widths: ['*'],
			body: [
				[
					{
						stack: [
							{ text: '✧ SÍNTESIS DE INTELIGENCIA ARTIFICIAL', fontSize: 10, bold: true, color: '#38bdf8', margin: [0, 0, 0, 8], letterSpacing: 1 },
							{
								ul: insights.map((insight) => ({
									text: insight,
									fontSize: 10,
									color: '#e2e8f0', // Light gray for readability
									margin: [0, 0, 0, 6],
									lineHeight: 1.3
								})),
								margin: [10, 0, 0, 0], // Indentation for the bullet list
							},
						],
						fillColor: '#1e293b',
						margin: [16, 16, 16, 16], // Generous internal padding
						border: [true, false, false, false], // Only left border
					}
				]
			]
		},
		layout: {
			hLineWidth: () => 0,
			vLineWidth: (i: number) => (i === 0 ? 5 : 0), // Thick neon side border
			vLineColor: () => '#38bdf8', // Neon blue stroke matching the title
			paddingLeft: () => 0,
			paddingRight: () => 0,
			paddingTop: () => 0,
			paddingBottom: () => 0,
		},
		margin: [0, 0, 0, 30],
	} as PdfContent;
};

export const buildSmartKPIs = (stats: SalesDashboardStats): PdfContent => {
	const cardW = 121.3;
	const cardH = 75;

	const kpiCard = (title: string, value: string, bgColor: string, sparkColor: string): PdfContent => {
		// Generate random, constrained points for the fake Sparkline polygon
		const points = [];
		let y = 45;
		for(let x = 0; x <= cardW; x += 15) {
			points.push({x: x, y: y});
			y += (Math.random() * 20 - 10);
			// Boundaries
			if(y < 30) y = 30;
			if(y > 65) y = 65;
		}

		return {
			stack: [
				{
					canvas: [
						{ type: 'rect', x: 0, y: 0, w: cardW, h: cardH, r: 6, color: bgColor },
						{ type: 'polyline', lineWidth: 2, closePath: false, lineColor: sparkColor, points: points }
					]
				},
				{
					stack: [
						{ text: title.toUpperCase(), fontSize: 8, bold: true, color: 'white', margin: [0, 0, 0, 8], letterSpacing: 0.5 },
						{ text: value, fontSize: 16, bold: true, color: 'white' }
					],
					margin: [12, -65, 12, 0] // Negative top margin pulls UI text over the canvas rectangle
				}
			],
			width: cardW
		} as PdfContent;
	};

	return {
		columns: [
			kpiCard('Ventas Totales', currencyFormatter.format(stats.total), '#10b981', '#6ee7b7'), // Emerald
			{ width: 10, text: '' }, // spacer 1
			kpiCard('Ticket Promedio', currencyFormatter.format(stats.avg), '#6366f1', '#a5b4fc'), // Indigo
			{ width: 10, text: '' }, // spacer 2
			kpiCard('Devoluciones', currencyFormatter.format(stats.refundedTotal), '#f59e0b', '#fcd34d'), // Amber
			{ width: 10, text: '' }, // spacer 3
			kpiCard('Proyección 30D', currencyFormatter.format(stats.projectedTotal), '#0ea5e9', '#7dd3fc'), // Sky Blue
		],
		margin: [0, 0, 0, 30]
	} as PdfContent;
};

export const buildTopPerformersTable = (customerData: { name: string; total: number }[]): PdfContent => {
	if (customerData.length === 0) return { text: '' } as PdfContent;

	return {
		stack: [
			{ text: 'TOP 5 CLIENTES ESTRELLA', fontSize: 14, bold: true, color: '#0f172a', margin: [0, 0, 0, 12] },
			{
				table: {
					headerRows: 1,
					widths: ['auto', '*', 'auto'],
					body: [
						[
							{ text: 'RANK', fontSize: 9, bold: true, color: '#94a3b8', border: [false, false, false, true], margin: [4, 4, 4, 8] },
							{ text: 'CLIENTE', fontSize: 9, bold: true, color: '#94a3b8', border: [false, false, false, true], margin: [4, 4, 4, 8] },
							{ text: 'TOTAL COMPRADO', fontSize: 9, bold: true, color: '#94a3b8', alignment: 'right', border: [false, false, false, true], margin: [4, 4, 4, 8] },
						],
						...customerData.slice(0, 5).map((c, idx) => {
							const isEven = idx % 2 === 0;
							const fillColor = isEven ? '#fafafa' : '#ffffff';
							return [
								{ text: `#${idx + 1}`, fontSize: 11, color: '#64748b', bold: true, fillColor, border: [false, false, false, false], margin: [4, 12, 4, 12] },
								{ text: c.name.toUpperCase(), fontSize: 11, color: '#1e293b', bold: true, fillColor, border: [false, false, false, false], margin: [4, 12, 4, 12] },
								{ text: currencyFormatter.format(c.total), fontSize: 13, color: '#10b981', bold: true, alignment: 'right', fillColor, border: [false, false, false, false], margin: [4, 12, 4, 12] },
							];
						}),
					],
				},
				layout: {
					hLineWidth: (i: number) => (i === 1 ? 2 : 0),
					hLineColor: () => '#e2e8f0',
					vLineWidth: () => 0,
					paddingLeft: () => 4,
					paddingRight: () => 4,
				},
				margin: [0, 0, 0, 20],
			},
		],
	} as PdfContent;
};

// --- MULTIPAGE FEATURES ---

export const buildCoverPage = (dateFrom?: string, dateTo?: string): PdfContent => {
	const today = format(new Date(), "dd 'de' MMMM, yyyy HH:mm", { locale: es });
	let dateRangeText = 'Histórico completo';

	if (dateFrom && dateTo) {
		dateRangeText = `${format(new Date(dateFrom), 'dd/MM/yyyy')} - ${format(new Date(dateTo), 'dd/MM/yyyy')}`;
	} else if (dateFrom) {
		dateRangeText = `Desde ${format(new Date(dateFrom), 'dd/MM/yyyy')}`;
	} else if (dateTo) {
		dateRangeText = `Hasta ${format(new Date(dateTo), 'dd/MM/yyyy')}`;
	}

	return {
		stack: [
			{
				canvas: [
					// Massive dark background block at the top
					{ type: 'rect', x: -40, y: -40, w: 596, h: 400, color: '#0f172a' }
				]
			},
			{
				stack: [
					{ text: 'REPORTE DE INTELIGENCIA DE NEGOCIOS', fontSize: 32, bold: true, color: '#ffffff', letterSpacing: 2, alignment: 'left' },
					{ text: 'ZENTRIA ERP', fontSize: 18, color: '#38bdf8', margin: [0, 8, 0, 0], letterSpacing: 3, alignment: 'left' },
				],
				margin: [0, -280, 0, 0] // Pull text over the deep canvas area
			},
			{
				stack: [
					{ text: 'DOCUMENTO GERENCIAL', fontSize: 14, bold: true, color: '#334155', letterSpacing: 1 },
					{ text: `Periodo Evalúado: ${dateRangeText}`, fontSize: 12, color: '#64748b', margin: [0, 6, 0, 0] },
					{ text: `Fecha de Emisión: ${today}`, fontSize: 10, color: '#94a3b8', margin: [0, 4, 0, 0] },
					{ text: 'ESTADO: CONFIDENCIAL', fontSize: 10, bold: true, color: '#ef4444', margin: [0, 20, 0, 0], letterSpacing: 1 },
				],
				margin: [0, 250, 0, 0] // Pushes metadata to the lower half
			}
		],
		pageBreak: 'after' // Forces the next section into page 2
	} as PdfContent;
};

const extractCustomerName = (r: SaleRecord): string => {
	if (typeof r.customer === 'string') return r.customer;
	if (r.customer && typeof r.customer === 'object') {
		return r.customer.billing_company || r.customer.contact_name || r.customer.name || 'Cliente Anónimo';
	}
	if (r.billing_snapshot) return `${r.billing_snapshot.first_name ?? ''} ${r.billing_snapshot.last_name ?? ''}`.trim();
	return r.customer_name || 'Cliente Anónimo';
};

const extractAmount = (r: SaleRecord): number => {
	const raw = r.total_amount ?? (r as any).total ?? 0;
	return typeof raw === 'string' ? parseFloat(raw) || 0 : Number(raw) || 0;
};

export const buildTimeAnalytics = (filteredResults: SaleRecord[]): PdfContent => {
	if (filteredResults.length === 0) return { text: '', pageBreak: 'before' } as PdfContent;

	const groups: Record<string, { count: number; total: number }> = {};
	
	const sorted = [...filteredResults].sort((a, b) => {
		const dA = new Date(a.sale_date || a.date || a.created_at || 0).getTime();
		const dB = new Date(b.sale_date || b.date || b.created_at || 0).getTime();
		return dA - dB;
	});

	sorted.forEach(r => {
		const dateRaw = r.sale_date || r.date || r.created_at || '';
		if (!dateRaw) return;
		const d = new Date(dateRaw);
		const period = format(d, "MMM yyyy - 'Sem.' w", { locale: es }).toUpperCase();
		
		if (!groups[period]) groups[period] = { count: 0, total: 0 };
		groups[period].count += 1;
		groups[period].total += extractAmount(r);
	});

	const periods = Object.keys(groups);
	const maxTotal = Math.max(...periods.map(p => groups[p].total), 1);

	const chartStack = periods.map(p => {
		const group = groups[p];
		const barWidth = Math.max((group.total / maxTotal) * 100, 1);
		return {
			columns: [
				{ text: p, width: 120, fontSize: 9, color: '#475569', alignment: 'right', margin: [0, 4, 8, 0] },
				{
					stack: [
						{
							canvas: [
								{ type: 'rect', x: 0, y: 0, w: (barWidth / 100) * 280, h: 16, r: 4, color: '#0ea5e9' }
							]
						}
					],
					width: 280,
					margin: [0, 2, 0, 8]
				},
				{ text: currencyFormatter.format(group.total), width: '*', fontSize: 9, bold: true, color: '#0f172a', margin: [8, 4, 0, 0] }
			]
		};
	});

	return {
		stack: [
			{ text: 'ANÁLISIS DE RENDIMIENTO TEMPORAL', fontSize: 16, bold: true, color: '#0f172a', margin: [0, 0, 0, 16] },
			{
				table: {
					headerRows: 1,
					widths: ['*', 'auto', 'auto', 'auto'],
					body: [
						[
							{ text: 'PERIODO', fontSize: 9, bold: true, color: '#ffffff', fillColor: '#0f172a', margin: [4, 6, 4, 6] },
							{ text: 'N° ÓRDENES', fontSize: 9, bold: true, color: '#ffffff', fillColor: '#0f172a', alignment: 'center', margin: [4, 6, 4, 6] },
							{ text: 'VENTAS TOTALES', fontSize: 9, bold: true, color: '#ffffff', fillColor: '#0f172a', alignment: 'right', margin: [4, 6, 4, 6] },
							{ text: 'TICKET PROMEDIO', fontSize: 9, bold: true, color: '#ffffff', fillColor: '#0f172a', alignment: 'right', margin: [4, 6, 4, 6] },
						],
						...periods.map((p, idx) => {
							const group = groups[p];
							const isEven = idx % 2 === 0;
							const fillColor = isEven ? '#f8fafc' : '#ffffff';
							const avg = group.count > 0 ? group.total / group.count : 0;
							return [
								{ text: p, fontSize: 10, color: '#334155', bold: true, fillColor, margin: [4, 6, 4, 6], border: [false, false, false, false] },
								{ text: String(group.count), fontSize: 10, color: '#475569', alignment: 'center', fillColor, margin: [4, 6, 4, 6], border: [false, false, false, false] },
								{ text: currencyFormatter.format(group.total), fontSize: 10, bold: true, color: '#10b981', alignment: 'right', fillColor, margin: [4, 6, 4, 6], border: [false, false, false, false] },
								{ text: currencyFormatter.format(avg), fontSize: 10, color: '#6366f1', alignment: 'right', fillColor, margin: [4, 6, 4, 6], border: [false, false, false, false] },
							];
						})
					]
				},
				layout: {
					hLineWidth: (i: number, node: any) => (i === 1 || i === node.table.body.length ? 1 : 0),
					hLineColor: () => '#cbd5e1',
					vLineWidth: () => 0,
					paddingLeft: () => 4,
					paddingRight: () => 4,
				},
				margin: [0, 0, 0, 30]
			},
			{ text: 'DISTRIBUCIÓN DE VENTAS POR PERIODO', fontSize: 12, bold: true, color: '#0f172a', margin: [0, 0, 0, 16] },
			{
				stack: chartStack
			}
		],
		pageBreak: 'before'
	} as PdfContent;
};

export const buildRiskAnalytics = (filteredResults: SaleRecord[]): PdfContent => {
	let totalSales = 0;
	let totalRefunded = 0;
	const refundsByCustomer: Record<string, { count: number, total: number }> = {};

	filteredResults.forEach(r => {
		const amount = extractAmount(r);
		const status = String(r.status || '').toLowerCase();
		
		if (status === 'refunded' || status === 'returned') {
			totalRefunded += amount;
			const customerName = extractCustomerName(r);
			if (!refundsByCustomer[customerName]) {
				refundsByCustomer[customerName] = { count: 0, total: 0 };
			}
			refundsByCustomer[customerName].count += 1;
			refundsByCustomer[customerName].total += amount;
		} else if (status === 'completed' || status === 'processing' || status === 'paid') {
			totalSales += amount;
		}
	});

	if (totalRefunded === 0) {
		return {
			stack: [
				{ text: 'ANÁLISIS DE DEVOLUCIONES Y RIESGO', fontSize: 16, bold: true, color: '#0f172a', margin: [0, 0, 0, 16] },
				{
					stack: [
						{ text: 'Cero Riesgo: Excelente Salud Operativa', fontSize: 18, bold: true, color: '#10b981', alignment: 'center', margin: [0, 20, 0, 10] },
						{ text: 'No se han registrado devoluciones ni reembolsos en el periodo evaluado.', fontSize: 12, color: '#64748b', alignment: 'center' }
					],
					margin: [0, 40, 0, 0]
				}
			],
			pageBreak: 'before'
		} as PdfContent;
	}

	const totalVolume = totalSales + totalRefunded;
	const salesPct = totalVolume > 0 ? (totalSales / totalVolume) * 100 : 0;
	const refundPct = totalVolume > 0 ? (totalRefunded / totalVolume) * 100 : 0;

	const topRefundCustomers = Object.entries(refundsByCustomer)
		.map(([name, data]) => ({ name, ...data }))
		.sort((a, b) => b.total - a.total)
		.slice(0, 5);

	return {
		stack: [
			{ text: 'ANÁLISIS DE DEVOLUCIONES Y RIESGO', fontSize: 16, bold: true, color: '#0f172a', margin: [0, 0, 0, 20] },
			{
				columns: [
					// Tarjeta 1
					{
						table: {
							widths: ['*'],
							body: [
								[{ text: 'IMPACTO DE DEVOLUCIONES', fontSize: 11, bold: true, color: '#ffffff', fillColor: '#ef4444', margin: [10, 8, 10, 8], border: [false, false, false, false] }],
								[{
									stack: [
										{ text: 'Ventas Totales', fontSize: 10, color: '#64748b', margin: [0, 10, 0, 4] },
										{ text: currencyFormatter.format(totalSales), fontSize: 14, bold: true, color: '#10b981', margin: [0, 0, 0, 10] },
										{
											canvas: [
												{ type: 'rect', x: 0, y: 0, w: 200, h: 10, r: 2, color: '#f1f5f9' },
												{ type: 'rect', x: 0, y: 0, w: Math.max((salesPct / 100) * 200, 2), h: 10, r: 2, color: '#10b981' }
											],
											margin: [0, 0, 0, 15]
										},
										{ text: 'Total Devuelto', fontSize: 10, color: '#64748b', margin: [0, 0, 0, 4] },
										{ text: currencyFormatter.format(totalRefunded), fontSize: 14, bold: true, color: '#ef4444', margin: [0, 0, 0, 10] },
										{
											canvas: [
												{ type: 'rect', x: 0, y: 0, w: 200, h: 10, r: 2, color: '#f1f5f9' },
												{ type: 'rect', x: 0, y: 0, w: Math.max((refundPct / 100) * 200, 2), h: 10, r: 2, color: '#ef4444' }
											]
										}
									],
									margin: [15, 10, 15, 20],
									border: [false, false, false, false]
								}]
							]
						},
						layout: { defaultBorder: false },
						width: '48%',
						margin: [0, 0, 10, 0]
					},
					// Tarjeta 2
					{
						table: {
							widths: ['*'],
							body: [
								[{ text: 'TOP CLIENTES REEMBOLSOS', fontSize: 11, bold: true, color: '#ffffff', fillColor: '#f59e0b', margin: [10, 8, 10, 8], border: [false, false, false, false] }],
								[{
									table: {
										widths: ['*', 'auto'],
										body: [
											...topRefundCustomers.map((c) => [
												{ text: c.name, fontSize: 9, bold: true, color: '#334155', border: [false, false, false, true], margin: [4, 8, 4, 8] },
												{ text: currencyFormatter.format(c.total), fontSize: 9, bold: true, color: '#ef4444', alignment: 'right', border: [false, false, false, true], margin: [4, 8, 4, 8] }
											])
										]
									},
									layout: {
										hLineWidth: (i: number, node: any) => (i === node.table.body.length ? 0 : 1),
										hLineColor: () => '#f1f5f9',
										vLineWidth: () => 0
									},
									margin: [10, 10, 10, 10],
									border: [false, false, false, false]
								}]
							]
						},
						layout: { defaultBorder: false },
						width: '48%'
					}
				]
			}
		],
		pageBreak: 'before'
	} as PdfContent;
};


export const buildMethodology = (): PdfContent => {
	return {
		stack: [
			{ text: 'METODOLOGÍA Y GLOSARIO TÉCNICO', fontSize: 16, bold: true, color: '#0f172a', margin: [0, 0, 0, 16] },
			{
				stack: [
					{ text: '• Pronóstico de Machine Learning (30D)', fontSize: 11, bold: true, color: '#334155', margin: [0, 0, 0, 4] },
					{ text: 'Las estimaciones futuras se calculan utilizando un modelo de Regresión Lineal Simple de Mínimos Cuadrados (Ordinary Least Squares) sobre el comportamiento continuo de los últimos 90 días efectivos. Este algoritmo interpola tendencias temporales descontando anomalías puntuales y proyecta el volumen de facturación si las mecánicas del mercado y funnel se mantienen estáticas.', fontSize: 10, color: '#64748b', lineHeight: 1.4, margin: [0, 0, 0, 12] },
					
					{ text: '• KPIs de Performance', fontSize: 11, bold: true, color: '#334155', margin: [0, 0, 0, 4] },
					{ text: 'Las métricas presentadas en este informe extraen el valor bruto transaccional excluyendo intentos de tarjeta rechazados o carritos abandonados. Ticket Promedio computa el Ratio Monetario por Transacciones concretadas.', fontSize: 10, color: '#64748b', lineHeight: 1.4, margin: [0, 0, 0, 12] },
				],
				margin: [0, 0, 0, 0]
			}
		],
		pageBreak: 'before' // Forces vocabulary to its own concluding page
	} as PdfContent;
};
