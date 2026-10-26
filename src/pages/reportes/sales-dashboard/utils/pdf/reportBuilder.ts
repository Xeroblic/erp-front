import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { SalesDashboardStats, SaleRecord } from '../../../types';

// Tipos customizados para pdfmake (para evitar `any` y conflictos de interfaz)
export type PdfContent = Record<string, unknown> | string | PdfContent[];
export type PdfTableCell = Record<string, unknown> | string | PdfContent[];

/** Lo que pdfmake pasa a las funciones de `layout`: sólo se lee el largo del cuerpo. */
interface IPdfTableNode {
	table: { body: unknown[] };
}

/** Color de la variación interanual: verde si crece, rojo si cae y gris si se mantiene. */
const yoyColorOf = (yoy: number): string => {
	if (yoy > 0) return '#10b981';
	if (yoy < 0) return '#ef4444';
	return '#64748b';
};

/**
 * Título de un recuadro de síntesis. El marcador es `■` porque Roboto, la única fuente del PDF, no
 * trae `✧` ni otros símbolos decorativos: pdfmake los dibuja como un cuadro vacío.
 */
const calloutTitle = (text: string): PdfContent => ({
	text: [{ text: '■  ', fontSize: 7 }, text],
	fontSize: 10,
	bold: true,
	color: '#38bdf8',
	margin: [0, 0, 0, 8],
	letterSpacing: 1,
});

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
				canvas: [{ type: 'rect', x: -40, y: -40, w: 596, h: 140, color: '#0f172a' }],
			},
			{
				columns: [
					{
						stack: [
							{
								text: 'ZENTRIA',
								fontSize: 28,
								bold: true,
								color: '#ffffff',
								letterSpacing: 2,
							},
							{
								text: 'INTELIGENCIA DE NEGOCIOS',
								fontSize: 10,
								color: '#94a3b8',
								margin: [0, 4, 0, 0],
								letterSpacing: 1,
							},
						],
						width: '60%',
					},
					{
						stack: [
							{
								text: 'REPORTE EJECUTIVO',
								fontSize: 14,
								bold: true,
								alignment: 'right',
								color: '#ffffff',
								margin: [0, 4, 0, 0],
							},
							{
								text: `Periodo: ${dateRangeText}`,
								fontSize: 10,
								alignment: 'right',
								color: '#cbd5e1',
								margin: [0, 4, 0, 0],
							},
							{
								text: `Generado: ${today}`,
								fontSize: 9,
								alignment: 'right',
								color: '#64748b',
								margin: [0, 2, 0, 0],
							},
						],
						width: '40%',
					},
				],
				margin: [0, -110, 0, 60], // Pulls the text over the canvas background safely and creates bottom spacing
			},
		],
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
							calloutTitle('SÍNTESIS DE INTELIGENCIA ARTIFICIAL'),
							{
								ul: insights.map((insight) => ({
									text: insight,
									fontSize: 10,
									color: '#e2e8f0', // Light gray for readability
									margin: [0, 0, 0, 6],
									lineHeight: 1.3,
								})),
								margin: [10, 0, 0, 0], // Indentation for the bullet list
							},
						],
						fillColor: '#1e293b',
						margin: [16, 16, 16, 16], // Generous internal padding
						border: [true, false, false, false], // Only left border
					},
				],
			],
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

/** Ancho en em de Roboto Medium (la negrita de pdfmake): dígitos y `$` 0,568; `.` 0,278. */
const KPI_VALUE_GLYPH_EM: Record<string, number> = { '.': 0.278, ',': 0.278, '-': 0.34 };
const KPI_VALUE_DEFAULT_EM = 0.568;
const KPI_VALUE_MAX_FONT_SIZE = 16;
const KPI_VALUE_MIN_FONT_SIZE = 9;

/** Mayor tamaño (en pasos de medio punto) con el que el monto cabe en una sola línea. */
export const kpiValueFontSize = (value: string, availableWidth: number): number => {
	const widthInEm = [...value].reduce(
		(total, glyph) => total + (KPI_VALUE_GLYPH_EM[glyph] ?? KPI_VALUE_DEFAULT_EM),
		0,
	);
	if (widthInEm === 0) return KPI_VALUE_MAX_FONT_SIZE;
	const fitting = Math.floor((availableWidth / widthInEm) * 2) / 2;
	return Math.min(KPI_VALUE_MAX_FONT_SIZE, Math.max(KPI_VALUE_MIN_FONT_SIZE, fitting));
};

/** Forma fija del minigráfico: es decorativo, no representa datos (0 = arriba de la franja). */
const SPARKLINE_SHAPE = [0.7, 0.45, 0.6, 0.3, 0.5, 0.2, 0.4, 0.1, 0.25];

export const buildSmartKPIs = (stats: SalesDashboardStats): PdfContent => {
	const cardW = 121.3;
	const cardH = 75;
	const paddingX = 12;
	// El texto termina cerca de y = 47: el minigráfico queda en la franja inferior, sin cruzarlo.
	const sparkTop = 54;
	const sparkHeight = 14;

	// Puntos nuevos por tarjeta: pdfmake les suma la posición en el lugar, y compartirlos acumula
	// el desplazamiento de las cuatro tarjetas y saca la línea de la página.
	const sparkPoints = () =>
		SPARKLINE_SHAPE.map((level, index) => ({
			x: (cardW / (SPARKLINE_SHAPE.length - 1)) * index,
			y: sparkTop + level * sparkHeight,
		}));

	const kpiCard = (
		title: string,
		value: string,
		bgColor: string,
		sparkColor: string,
	): PdfContent => {
		return {
			stack: [
				{
					canvas: [
						{ type: 'rect', x: 0, y: 0, w: cardW, h: cardH, r: 6, color: bgColor },
						{
							type: 'polyline',
							lineWidth: 2,
							closePath: false,
							lineColor: sparkColor,
							points: sparkPoints(),
						},
					],
				},
				{
					stack: [
						{
							text: title.toUpperCase(),
							fontSize: 8,
							bold: true,
							color: 'white',
							margin: [0, 0, 0, 8],
							letterSpacing: 0.5,
						},
						{
							text: value,
							fontSize: kpiValueFontSize(value, cardW - paddingX * 2),
							bold: true,
							color: 'white',
							noWrap: true,
						},
					],
					// Sube el texto sobre el rectángulo sin restar su altura del flujo: con un margen negativo,
					// lo que sigue a las tarjetas quedaba pegado a ellas.
					// El bloque desplazado ignora el margen izquierdo: el relleno va en `x`.
					relativePosition: { x: paddingX, y: -65 },
					margin: [0, 0, paddingX * 2, 0],
				},
			],
			width: cardW,
		} as PdfContent;
	};

	return {
		columns: [
			kpiCard('Ventas Totales', currencyFormatter.format(stats.total), '#10b981', '#6ee7b7'), // Emerald
			{ width: 10, text: '' }, // spacer 1
			kpiCard('Ticket Promedio', currencyFormatter.format(stats.avg), '#6366f1', '#a5b4fc'), // Indigo
			{ width: 10, text: '' }, // spacer 2
			kpiCard(
				'Devoluciones',
				currencyFormatter.format(stats.refundedTotal),
				'#f59e0b',
				'#fcd34d',
			), // Amber
			{ width: 10, text: '' }, // spacer 3
			kpiCard(
				'Proyección 30D',
				currencyFormatter.format(stats.projectedTotal),
				'#0ea5e9',
				'#7dd3fc',
			), // Sky Blue
		],
		margin: [0, 0, 0, 30],
	} as PdfContent;
};

export const buildTopPerformersTable = (
	customerData: { name: string; total: number }[],
): PdfContent => {
	if (customerData.length === 0) return { text: '' } as PdfContent;

	return {
		stack: [
			{
				text: 'TOP 5 CLIENTES ESTRELLA',
				fontSize: 14,
				bold: true,
				color: '#0f172a',
				margin: [0, 0, 0, 12],
			},
			{
				table: {
					headerRows: 1,
					widths: ['auto', '*', 'auto'],
					body: [
						[
							{
								text: 'RANK',
								fontSize: 9,
								bold: true,
								color: '#94a3b8',
								border: [false, false, false, true],
								margin: [4, 4, 4, 8],
							},
							{
								text: 'CLIENTE',
								fontSize: 9,
								bold: true,
								color: '#94a3b8',
								border: [false, false, false, true],
								margin: [4, 4, 4, 8],
							},
							{
								text: 'TOTAL COMPRADO',
								fontSize: 9,
								bold: true,
								color: '#94a3b8',
								alignment: 'right',
								border: [false, false, false, true],
								margin: [4, 4, 4, 8],
							},
						],
						...customerData.slice(0, 5).map((c, idx) => {
							const isEven = idx % 2 === 0;
							const fillColor = isEven ? '#fafafa' : '#ffffff';
							return [
								{
									text: `#${idx + 1}`,
									fontSize: 11,
									color: '#64748b',
									bold: true,
									fillColor,
									border: [false, false, false, false],
									margin: [4, 12, 4, 12],
								},
								{
									text: c.name.toUpperCase(),
									fontSize: 11,
									color: '#1e293b',
									bold: true,
									fillColor,
									border: [false, false, false, false],
									margin: [4, 12, 4, 12],
								},
								{
									text: currencyFormatter.format(c.total),
									fontSize: 13,
									color: '#10b981',
									bold: true,
									alignment: 'right',
									fillColor,
									border: [false, false, false, false],
									margin: [4, 12, 4, 12],
								},
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
					{ type: 'rect', x: -40, y: -40, w: 596, h: 400, color: '#0f172a' },
				],
			},
			{
				stack: [
					{
						text: 'REPORTE DE INTELIGENCIA DE NEGOCIOS',
						fontSize: 32,
						bold: true,
						color: '#ffffff',
						letterSpacing: 2,
						alignment: 'left',
					},
					{
						text: 'ZENTRIA ERP',
						fontSize: 18,
						color: '#38bdf8',
						margin: [0, 8, 0, 0],
						letterSpacing: 3,
						alignment: 'left',
					},
				],
				margin: [0, -280, 0, 0], // Pull text over the deep canvas area
			},
			{
				stack: [
					{
						text: 'DOCUMENTO GERENCIAL',
						fontSize: 14,
						bold: true,
						color: '#334155',
						letterSpacing: 1,
					},
					{
						text: `Periodo Evalúado: ${dateRangeText}`,
						fontSize: 12,
						color: '#64748b',
						margin: [0, 6, 0, 0],
					},
					{
						text: `Fecha de Emisión: ${today}`,
						fontSize: 10,
						color: '#94a3b8',
						margin: [0, 4, 0, 0],
					},
					{
						text: 'ESTADO: CONFIDENCIAL',
						fontSize: 10,
						bold: true,
						color: '#ef4444',
						margin: [0, 20, 0, 0],
						letterSpacing: 1,
					},
				],
				margin: [0, 250, 0, 0], // Pushes metadata to the lower half
			},
		],
		pageBreak: 'after', // Forces the next section into page 2
	} as PdfContent;
};

const extractCustomerName = (r: SaleRecord): string => {
	if (typeof r.customer === 'string') return r.customer;
	if (r.customer && typeof r.customer === 'object') {
		return (
			r.customer.billing_company ||
			r.customer.contact_name ||
			r.customer.name ||
			'Cliente Anónimo'
		);
	}
	if (r.billing_snapshot)
		return `${r.billing_snapshot.first_name ?? ''} ${r.billing_snapshot.last_name ?? ''}`.trim();
	return r.customer_name || 'Cliente Anónimo';
};

const extractAmount = (r: SaleRecord): number => {
	const raw = r.total_amount ?? r.total ?? 0;
	return typeof raw === 'string' ? parseFloat(raw) || 0 : Number(raw) || 0;
};

export const buildYearlyAnalytics = (filteredResults: SaleRecord[]): PdfContent => {
	if (filteredResults.length === 0) return { text: '', pageBreak: 'before' } as PdfContent;

	const years: Record<number, { total: number; count: number }> = {};

	filteredResults.forEach((r) => {
		const amount = extractAmount(r);
		const dateRaw = r.sale_date || r.date || r.created_at || '';
		if (!dateRaw) return;
		const d = new Date(dateRaw);
		const year = d.getFullYear();

		if (!years[year]) years[year] = { total: 0, count: 0 };
		years[year].total += amount;
		years[year].count += 1;
	});

	const sortedYears = Object.keys(years)
		.map(Number)
		.sort((a, b) => a - b);
	const maxTotal = Math.max(...sortedYears.map((y) => years[y].total), 1);

	const chartStack = sortedYears.map((year) => {
		const { total } = years[year];
		const barWidth = Math.max((total / maxTotal) * 100, 1);
		return {
			columns: [
				{
					text: String(year),
					width: 60,
					fontSize: 9,
					color: '#475569',
					alignment: 'right',
					margin: [0, 4, 8, 0],
				},
				{
					stack: [
						{
							canvas: [
								{
									type: 'rect',
									x: 0,
									y: 0,
									w: (barWidth / 100) * 340,
									h: 16,
									r: 4,
									color: '#38bdf8',
								},
							],
						},
					],
					width: 340,
					margin: [0, 2, 0, 8],
				},
				{
					text: currencyFormatter.format(total),
					width: '*',
					fontSize: 9,
					bold: true,
					color: '#0f172a',
					margin: [8, 4, 0, 0],
				},
			],
		};
	});

	return {
		stack: [
			{
				text: 'ANÁLISIS MACRO: COMPARATIVA AÑO CONTRA AÑO (YoY)',
				fontSize: 16,
				bold: true,
				color: '#0f172a',
				margin: [0, 0, 0, 16],
			},
			{
				table: {
					headerRows: 1,
					widths: ['*', 'auto', 'auto'],
					body: [
						[
							{
								text: 'AÑO',
								fontSize: 9,
								bold: true,
								color: '#ffffff',
								fillColor: '#0f172a',
								margin: [4, 6, 4, 6],
							},
							{
								text: 'VENTAS TOTALES',
								fontSize: 9,
								bold: true,
								color: '#ffffff',
								fillColor: '#0f172a',
								alignment: 'right',
								margin: [4, 6, 4, 6],
							},
							{
								text: 'CRECIMIENTO (YoY)',
								fontSize: 9,
								bold: true,
								color: '#ffffff',
								fillColor: '#0f172a',
								alignment: 'right',
								margin: [4, 6, 4, 6],
							},
						],
						...sortedYears.map((year, idx) => {
							const current = years[year];
							const previous = years[year - 1];

							let yoyText = '-';
							let yoyColor = '#64748b';

							if (previous && previous.total > 0) {
								const yoy =
									((current.total - previous.total) / previous.total) * 100;
								yoyText = yoy > 0 ? `+${yoy.toFixed(1)}%` : `${yoy.toFixed(1)}%`;
								yoyColor = yoyColorOf(yoy);
							}

							const isEven = idx % 2 === 0;
							const fillColor = isEven ? '#f8fafc' : '#ffffff';

							return [
								{
									text: String(year),
									fontSize: 10,
									color: '#334155',
									bold: true,
									fillColor,
									margin: [4, 6, 4, 6],
									border: [false, false, false, false],
								},
								{
									text: currencyFormatter.format(current.total),
									fontSize: 10,
									bold: true,
									color: '#0f172a',
									alignment: 'right',
									fillColor,
									margin: [4, 6, 4, 6],
									border: [false, false, false, false],
								},
								{
									text: yoyText,
									fontSize: 10,
									bold: true,
									color: yoyColor,
									alignment: 'right',
									fillColor,
									margin: [4, 6, 4, 6],
									border: [false, false, false, false],
								},
							];
						}),
					],
				},
				layout: {
					hLineWidth: (i: number, node: IPdfTableNode) =>
						i === 1 || i === node.table.body.length ? 1 : 0,
					hLineColor: () => '#cbd5e1',
					vLineWidth: () => 0,
					paddingLeft: () => 4,
					paddingRight: () => 4,
				},
				margin: [0, 0, 0, 30],
			},
			{
				text: 'VOLUMEN HISTÓRICO ANUAL',
				fontSize: 12,
				bold: true,
				color: '#0f172a',
				margin: [0, 0, 0, 16],
			},
			{ stack: chartStack },
		],
		pageBreak: 'before',
	} as PdfContent;
};

export const buildSemesterDeepDive = (filteredResults: SaleRecord[]): PdfContent[] => {
	if (filteredResults.length === 0) return [];

	const semesters: Record<
		string,
		{
			year: number;
			semester: 1 | 2;
			total: number;
			count: number;
			customers: Record<string, number>;
			months: Record<number, number>;
		}
	> = {};

	filteredResults.forEach((r) => {
		const amount = extractAmount(r);
		const dateRaw = r.sale_date || r.date || r.created_at || '';
		if (!dateRaw) return;
		const d = new Date(dateRaw);
		const year = d.getFullYear();
		const month = d.getMonth();
		const semester = month < 6 ? 1 : 2;
		const semKey = `${year}-S${semester}`;

		if (!semesters[semKey])
			semesters[semKey] = { year, semester, total: 0, count: 0, customers: {}, months: {} };
		semesters[semKey].total += amount;
		semesters[semKey].count += 1;

		if (!semesters[semKey].months[month]) semesters[semKey].months[month] = 0;
		semesters[semKey].months[month] += amount;

		const cName = extractCustomerName(r);
		if (!semesters[semKey].customers[cName]) semesters[semKey].customers[cName] = 0;
		semesters[semKey].customers[cName] += amount;
	});

	const sortedKeys = Object.keys(semesters).sort((a, b) => {
		const [yearA, semA] = a.split('-S').map(Number);
		const [yearB, semB] = b.split('-S').map(Number);
		if (yearA !== yearB) return yearA - yearB;
		return semA - semB;
	});

	return sortedKeys.map((key) => {
		const current = semesters[key];
		const prevKey = `${current.year - 1}-S${current.semester}`;
		const previous = semesters[prevKey];

		const avgTicket = current.count > 0 ? current.total / current.count : 0;

		let yoyText = 'Sin datos';
		let yoyColor = '#64748b';
		// Sin el mismo semestre del año anterior no hay variación que contar.
		let comparisonText = `No hay ventas del mismo semestre de ${current.year - 1} para comparar.`;

		if (previous && previous.total > 0) {
			const yoyPct = ((current.total - previous.total) / previous.total) * 100;
			yoyText = yoyPct > 0 ? `+${yoyPct.toFixed(1)}%` : `${yoyPct.toFixed(1)}%`;
			yoyColor = yoyColorOf(yoyPct);
			let directionWord = 'variación';
			if (yoyPct > 0) directionWord = 'expansión';
			else if (yoyPct < 0) directionWord = 'contracción';
			comparisonText = `Comparado con el mismo periodo del año anterior, se observa una ${directionWord} del ${yoyText}.`;
		} else if (previous && previous.total === 0 && current.total > 0) {
			yoyText = '+100%';
			yoyColor = '#10b981';
			comparisonText = `El mismo semestre de ${current.year - 1} no registró ventas.`;
		}

		const topCustomers = Object.entries(current.customers)
			.map(([name, total]) => ({ name, total }))
			.sort((a, b) => b.total - a.total)
			.slice(0, 3);

		// Cuatro tarjetas y tres separadores de 10 pt en los 515 pt útiles de la página.
		const cardW = 121.25;
		const cardH = 75;
		const cardPaddingX = 12;
		const createCard = (
			title: string,
			value: string,
			bgColor: string,
			txtColor: string = 'white',
			valColor: string = 'white',
		) => ({
			stack: [
				{
					canvas: [
						{ type: 'rect', x: 0, y: 0, w: cardW, h: cardH, r: 6, color: bgColor },
					],
				},
				{
					stack: [
						{
							text: title.toUpperCase(),
							fontSize: 8,
							bold: true,
							color: txtColor,
							margin: [0, 0, 0, 8],
							letterSpacing: 0.5,
						},
						{
							text: value,
							fontSize: kpiValueFontSize(value, cardW - cardPaddingX * 2),
							bold: true,
							color: valColor,
							noWrap: true,
						},
					],
					// Igual que en las tarjetas de KPI: el texto sube sin restar altura al flujo.
					relativePosition: { x: cardPaddingX, y: -60 },
					margin: [0, 0, cardPaddingX * 2, 0],
				},
			],
			width: cardW,
		});

		const calloutText = `Durante el Semestre ${current.semester} del ${current.year}, el volumen de ventas alcanzó ${currencyFormatter.format(current.total)}, con un ticket promedio de ${currencyFormatter.format(avgTicket)}. ${comparisonText}`;

		const monthNames = [
			'Ene',
			'Feb',
			'Mar',
			'Abr',
			'May',
			'Jun',
			'Jul',
			'Ago',
			'Sep',
			'Oct',
			'Nov',
			'Dic',
		];
		const vibrantPalette = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

		const pieCanvas: PdfContent[] = [];
		const legendBody: PdfTableCell[][] = [];
		const semesterMonths = current.semester === 1 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];

		let currentAngle = -Math.PI / 2;
		const pieCx = 65;
		const pieCy = 65;
		const pieRadius = 60;

		semesterMonths.forEach((m, idx) => {
			const val = current.months[m] || 0;
			const color = vibrantPalette[idx];

			if (val > 0 && current.total > 0) {
				const sliceAngle = (val / current.total) * (Math.PI * 2);
				if (sliceAngle > 0.01) {
					const points = [{ x: pieCx, y: pieCy }];
					const steps = Math.max(10, Math.ceil(sliceAngle * 10));
					for (let step = 0; step <= steps; step += 1) {
						const t = currentAngle + (step / steps) * sliceAngle;
						points.push({
							x: pieCx + pieRadius * Math.cos(t),
							y: pieCy + pieRadius * Math.sin(t),
						});
					}
					pieCanvas.push({
						type: 'polyline',
						lineWidth: 1,
						lineColor: '#ffffff',
						color,
						closePath: true,
						points,
					});
					currentAngle += sliceAngle;
				} else {
					pieCanvas.push({
						type: 'ellipse',
						x: pieCx + (pieRadius / 2) * Math.cos(currentAngle),
						y: pieCy + (pieRadius / 2) * Math.sin(currentAngle),
						r1: 2,
						r2: 2,
						color,
					});
				}
			} else if (val > 0 && current.total === 0) {
				pieCanvas.push({
					type: 'ellipse',
					x: pieCx,
					y: pieCy,
					r1: pieRadius,
					r2: pieRadius,
					color,
				});
			}

			if (val > 0) {
				legendBody.push([
					{ canvas: [{ type: 'ellipse', x: 4, y: 7, r1: 4, r2: 4, color }] },
					{
						text: monthNames[m].toUpperCase(),
						fontSize: 9,
						bold: true,
						color: '#475569',
						margin: [6, 4, 0, 4],
					},
					{
						text: currencyFormatter.format(val),
						fontSize: 9,
						bold: true,
						color: '#0f172a',
						alignment: 'right',
						margin: [0, 4, 0, 4],
					},
					{
						text:
							current.total > 0
								? `${((val / current.total) * 100).toFixed(1)}%`
								: '0%',
						fontSize: 9,
						color: '#64748b',
						alignment: 'right',
						margin: [0, 4, 0, 4],
					},
				]);
			}
		});

		if (pieCanvas.length === 0) {
			pieCanvas.push({
				type: 'ellipse',
				x: pieCx,
				y: pieCy,
				r1: pieRadius,
				r2: pieRadius,
				color: '#f8fafc',
			});
			legendBody.push([
				{
					text: 'Sin movimientos mensuales',
					colSpan: 4,
					fontSize: 9,
					color: '#94a3b8',
					margin: [0, 4, 0, 4],
					alignment: 'center',
				},
				{},
				{},
				{},
			]);
		}

		return {
			stack: [
				{
					text: `RENDIMIENTO SEMESTRAL: ${current.year} - S${current.semester}`,
					fontSize: 18,
					bold: true,
					color: '#0f172a',
					margin: [0, 0, 0, 20],
				},
				{
					columns: [
						createCard(
							'Ventas Totales',
							currencyFormatter.format(current.total),
							'#1e293b',
							'#94a3b8',
							'#ffffff',
						),
						{ width: 10, text: '' },
						createCard(
							'Órdenes',
							String(current.count),
							'#f1f5f9',
							'#64748b',
							'#0f172a',
						),
						{ width: 10, text: '' },
						createCard(
							'Ticket Promedio',
							currencyFormatter.format(avgTicket),
							'#f1f5f9',
							'#64748b',
							'#0f172a',
						),
						{ width: 10, text: '' },
						createCard(
							`Crecimiento vs ${current.year - 1}`,
							yoyText,
							'#f1f5f9',
							'#64748b',
							yoyColor,
						),
					],
					margin: [0, 0, 0, 25],
				},
				{
					columns: [
						{
							stack: [
								{
									text: 'DISTRIBUCIÓN MENSUAL',
									fontSize: 11,
									bold: true,
									color: '#334155',
									margin: [0, 0, 0, 16],
								},
								{ canvas: pieCanvas, margin: [0, 0, 0, 20] },
							],
							width: 160,
						},
						{
							stack: [
								{
									text: 'DESGLOSE ACUMULADO',
									fontSize: 11,
									bold: true,
									color: '#334155',
									margin: [0, 0, 0, 12],
								},
								{
									table: {
										widths: ['auto', 'auto', '*', 'auto'],
										body: legendBody,
									},
									layout: 'noBorders',
								},
							],
							width: '*',
						},
					],
					margin: [0, 0, 0, 30],
				},
				{
					table: {
						widths: ['*'],
						body: [
							[
								{
									stack: [
										calloutTitle('SÍNTESIS ANALÍTICA'),
										{
											text: calloutText,
											fontSize: 10,
											color: '#e2e8f0',
											lineHeight: 1.4,
										},
									],
									fillColor: '#1e293b',
									margin: [16, 16, 16, 16],
									border: [true, false, false, false],
								},
							],
						],
					},
					layout: {
						hLineWidth: () => 0,
						vLineWidth: (i: number) => (i === 0 ? 4 : 0),
						vLineColor: () => '#38bdf8',
						paddingLeft: () => 0,
						paddingRight: () => 0,
						paddingTop: () => 0,
						paddingBottom: () => 0,
					},
					margin: [0, 0, 0, 30],
				},
				{
					text: `TOP 3 CLIENTES DEL SEMESTRE`,
					fontSize: 12,
					bold: true,
					color: '#0f172a',
					margin: [0, 0, 0, 12],
				},
				{
					table: {
						headerRows: 1,
						widths: ['auto', '*', 'auto'],
						body: [
							[
								{
									text: 'RANK',
									fontSize: 9,
									bold: true,
									color: '#94a3b8',
									border: [false, false, false, true],
									margin: [4, 4, 4, 8],
								},
								{
									text: 'CLIENTE',
									fontSize: 9,
									bold: true,
									color: '#94a3b8',
									border: [false, false, false, true],
									margin: [4, 4, 4, 8],
								},
								{
									text: 'TOTAL COMPRADO',
									fontSize: 9,
									bold: true,
									color: '#94a3b8',
									alignment: 'right',
									border: [false, false, false, true],
									margin: [4, 4, 4, 8],
								},
							],
							...topCustomers.map((c, idx) => {
								const isEven = idx % 2 === 0;
								const fillColor = isEven ? '#fafafa' : '#ffffff';
								return [
									{
										text: `#${idx + 1}`,
										fontSize: 10,
										color: '#64748b',
										bold: true,
										fillColor,
										border: [false, false, false, false],
										margin: [4, 8, 4, 8],
									},
									{
										text: c.name.toUpperCase(),
										fontSize: 10,
										color: '#1e293b',
										bold: true,
										fillColor,
										border: [false, false, false, false],
										margin: [4, 8, 4, 8],
									},
									{
										text: currencyFormatter.format(c.total),
										fontSize: 10,
										color: '#10b981',
										bold: true,
										alignment: 'right',
										fillColor,
										border: [false, false, false, false],
										margin: [4, 8, 4, 8],
									},
								];
							}),
							...(topCustomers.length === 0
								? [
										[
											{
												text: '-',
												fontSize: 10,
												color: '#94a3b8',
												border: [false, false, false, false],
												margin: [4, 8, 4, 8],
											},
											{
												text: 'Sin clientes en este periodo',
												fontSize: 10,
												color: '#94a3b8',
												border: [false, false, false, false],
												margin: [4, 8, 4, 8],
											},
											{
												text: '-',
												fontSize: 10,
												color: '#94a3b8',
												alignment: 'right',
												border: [false, false, false, false],
												margin: [4, 8, 4, 8],
											},
										],
									]
								: []),
						],
					},
					layout: {
						hLineWidth: (i: number) => (i === 1 ? 2 : 0),
						hLineColor: () => '#e2e8f0',
						vLineWidth: () => 0,
						paddingLeft: () => 4,
						paddingRight: () => 4,
					},
				},
			],
			pageBreak: 'before',
		} as PdfContent;
	});
};

export const buildRiskAnalytics = (filteredResults: SaleRecord[]): PdfContent => {
	let totalSales = 0;
	let totalRefunded = 0;
	const refundsByCustomer: Record<string, { count: number; total: number }> = {};

	filteredResults.forEach((r) => {
		const amount = extractAmount(r);
		let statusRaw = String(r.status || r.estado || '')
			.toLowerCase()
			.trim();
		let pStatusRaw = String(r.payment_status || r.estado_pago || '')
			.toLowerCase()
			.trim();

		// Clean WooCommerce prefixes just like the backend does for export
		if (statusRaw.startsWith('wc-')) statusRaw = statusRaw.substring(3);
		if (statusRaw.startsWith('order-')) statusRaw = statusRaw.substring(6);
		if (pStatusRaw.startsWith('wc-')) pStatusRaw = pStatusRaw.substring(3);
		if (pStatusRaw.startsWith('order-')) pStatusRaw = pStatusRaw.substring(6);

		const isRefund =
			[
				'refunded',
				'returned',
				'anulado',
				'cancelled',
				'canceled',
				'cancelado',
				'failed',
				'devuelto',
				'reembolsado',
				'rechazado',
			].includes(statusRaw) ||
			['refunded', 'returned', 'failed'].includes(pStatusRaw) ||
			amount < 0;

		const isSuccess =
			['completed', 'processing', 'paid', 'pagado'].includes(statusRaw) ||
			['paid', 'completed'].includes(pStatusRaw);

		if (isRefund) {
			const absAmount = Math.abs(amount);
			totalRefunded += absAmount;
			const customerName = extractCustomerName(r);
			if (!refundsByCustomer[customerName]) {
				refundsByCustomer[customerName] = { count: 0, total: 0 };
			}
			refundsByCustomer[customerName].count += 1;
			refundsByCustomer[customerName].total += absAmount;
		} else if (isSuccess || (!isRefund && amount > 0)) {
			totalSales += amount;
		}
	});

	if (totalRefunded === 0) {
		return {
			stack: [
				{
					text: 'ANÁLISIS DE DEVOLUCIONES Y RIESGO',
					fontSize: 16,
					bold: true,
					color: '#0f172a',
					margin: [0, 0, 0, 16],
				},
				{
					stack: [
						{
							text: 'Cero Riesgo: Excelente Salud Operativa',
							fontSize: 18,
							bold: true,
							color: '#10b981',
							alignment: 'center',
							margin: [0, 20, 0, 10],
						},
						{
							text: 'No se han registrado devoluciones ni reembolsos en el periodo evaluado.',
							fontSize: 12,
							color: '#64748b',
							alignment: 'center',
						},
					],
					margin: [0, 40, 0, 0],
				},
			],
			pageBreak: 'before',
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
			{
				text: 'ANÁLISIS DE DEVOLUCIONES Y RIESGO',
				fontSize: 16,
				bold: true,
				color: '#0f172a',
				margin: [0, 0, 0, 20],
			},
			{
				columns: [
					// Tarjeta 1
					{
						table: {
							widths: ['*'],
							body: [
								[
									{
										text: 'IMPACTO DE DEVOLUCIONES',
										fontSize: 11,
										bold: true,
										color: '#ffffff',
										fillColor: '#ef4444',
										margin: [10, 8, 10, 8],
										border: [false, false, false, false],
									},
								],
								[
									{
										stack: [
											{
												text: 'Ventas Totales',
												fontSize: 10,
												color: '#64748b',
												margin: [0, 10, 0, 4],
											},
											{
												text: currencyFormatter.format(totalSales),
												fontSize: 14,
												bold: true,
												color: '#10b981',
												margin: [0, 0, 0, 10],
											},
											{
												canvas: [
													{
														type: 'rect',
														x: 0,
														y: 0,
														w: 200,
														h: 10,
														r: 2,
														color: '#f1f5f9',
													},
													{
														type: 'rect',
														x: 0,
														y: 0,
														w: Math.max((salesPct / 100) * 200, 2),
														h: 10,
														r: 2,
														color: '#10b981',
													},
												],
												margin: [0, 0, 0, 15],
											},
											{
												text: 'Total Devuelto',
												fontSize: 10,
												color: '#64748b',
												margin: [0, 0, 0, 4],
											},
											{
												text: currencyFormatter.format(totalRefunded),
												fontSize: 14,
												bold: true,
												color: '#ef4444',
												margin: [0, 0, 0, 10],
											},
											{
												canvas: [
													{
														type: 'rect',
														x: 0,
														y: 0,
														w: 200,
														h: 10,
														r: 2,
														color: '#f1f5f9',
													},
													{
														type: 'rect',
														x: 0,
														y: 0,
														w: Math.max((refundPct / 100) * 200, 2),
														h: 10,
														r: 2,
														color: '#ef4444',
													},
												],
											},
										],
										margin: [15, 10, 15, 20],
										border: [false, false, false, false],
									},
								],
							],
						},
						layout: { defaultBorder: false },
						width: '48%',
						margin: [0, 0, 10, 0],
					},
					// Tarjeta 2
					{
						table: {
							widths: ['*'],
							body: [
								[
									{
										text: 'TOP CLIENTES REEMBOLSOS',
										fontSize: 11,
										bold: true,
										color: '#ffffff',
										fillColor: '#f59e0b',
										margin: [10, 8, 10, 8],
										border: [false, false, false, false],
									},
								],
								[
									{
										table: {
											widths: ['*', 'auto'],
											body: [
												...topRefundCustomers.map((c) => [
													{
														text: c.name,
														fontSize: 9,
														bold: true,
														color: '#334155',
														border: [false, false, false, true],
														margin: [4, 8, 4, 8],
													},
													{
														text: currencyFormatter.format(c.total),
														fontSize: 9,
														bold: true,
														color: '#ef4444',
														alignment: 'right',
														border: [false, false, false, true],
														margin: [4, 8, 4, 8],
													},
												]),
											],
										},
										layout: {
											hLineWidth: (i: number, node: IPdfTableNode) =>
												i === node.table.body.length ? 0 : 1,
											hLineColor: () => '#f1f5f9',
											vLineWidth: () => 0,
										},
										margin: [10, 10, 10, 10],
										border: [false, false, false, false],
									},
								],
							],
						},
						layout: { defaultBorder: false },
						width: '48%',
					},
				],
			},
		],
		pageBreak: 'before',
	} as PdfContent;
};

export const buildMethodology = (): PdfContent => {
	return {
		stack: [
			{
				text: 'METODOLOGÍA Y GLOSARIO TÉCNICO',
				fontSize: 16,
				bold: true,
				color: '#0f172a',
				margin: [0, 0, 0, 16],
			},
			{
				stack: [
					{
						text: '• Pronóstico de Machine Learning (30D)',
						fontSize: 11,
						bold: true,
						color: '#334155',
						margin: [0, 0, 0, 4],
					},
					{
						text: 'Las estimaciones futuras se calculan utilizando un modelo de Regresión Lineal Simple de Mínimos Cuadrados (Ordinary Least Squares) sobre el comportamiento continuo de los últimos 90 días efectivos. Este algoritmo interpola tendencias temporales descontando anomalías puntuales y proyecta el volumen de facturación si las mecánicas del mercado y funnel se mantienen estáticas.',
						fontSize: 10,
						color: '#64748b',
						lineHeight: 1.4,
						margin: [0, 0, 0, 12],
					},

					{
						text: '• KPIs de Performance',
						fontSize: 11,
						bold: true,
						color: '#334155',
						margin: [0, 0, 0, 4],
					},
					{
						text: 'Las métricas presentadas en este informe extraen el valor bruto transaccional excluyendo intentos de tarjeta rechazados o carritos abandonados. Ticket Promedio computa el Ratio Monetario por Transacciones concretadas.',
						fontSize: 10,
						color: '#64748b',
						lineHeight: 1.4,
						margin: [0, 0, 0, 12],
					},
				],
				margin: [0, 0, 0, 0],
			},
		],
		pageBreak: 'before', // Forces vocabulary to its own concluding page
	} as PdfContent;
};
