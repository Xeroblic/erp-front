import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import {
	SIMULATED_EXPORT_NOTICE,
	type IExportDocument,
	type IExportTable,
	type TExportCell,
} from '@/pages/reportes/inventory-reports/export/reportDocument';

/** Lo que se usa de `pdfmake/build/pdfmake`, que no publica tipos para esa ruta. */
type TPdfMakeDocument = {
	getBlob: (callback: (blob: Blob) => void) => Promise<Blob> | void;
};
type TPdfMake = {
	vfs?: Record<string, string>;
	createPdf: (definition: TDocumentDefinitions) => TPdfMakeDocument;
};

const isPdfMake = (value: unknown): value is TPdfMake =>
	typeof value === 'object' &&
	value !== null &&
	'createPdf' in value &&
	typeof value.createPdf === 'function';

/** Misma carga que el reporte ejecutivo de Ventas: build del navegador y fuentes Roboto. */
const loadPdfMake = async (): Promise<TPdfMake> => {
	// @ts-expect-error El paquete no expone tipos para la ruta de build
	const pdfMakeModule: unknown = await import('pdfmake/build/pdfmake');
	const candidate =
		typeof pdfMakeModule === 'object' && pdfMakeModule !== null && 'default' in pdfMakeModule
			? pdfMakeModule.default
			: pdfMakeModule;
	if (!isPdfMake(candidate)) throw new Error('No se pudo cargar el generador de PDF.');
	const { loadPdfFonts } = await import('@/pages/comercial/cotizaciones/utils/pdf/fonts');
	loadPdfFonts(candidate);
	return candidate;
};

const PAGE_MARGIN = 36;
const A4_WIDTH = { portrait: 595, landscape: 842 };
/** Relleno horizontal de cada celda: `pdfmake` lo suma al ancho de la columna. */
const CELL_PADDING_X = 6;
/** Hasta cuántas filas una tabla se mantiene entera en una página. */
const UNBREAKABLE_MAX_ROWS = 20;

const cellText = (value: TExportCell): string => {
	if (value === null || value === '') return '—';
	return typeof value === 'number' ? value.toLocaleString('es-CL') : value;
};

const zebraLayout = {
	fillColor: (rowIndex: number) => {
		if (rowIndex === 0) return '#f4f4f5';
		return rowIndex % 2 === 0 ? '#fafafa' : null;
	},
	hLineWidth: (index: number, node: { table: { body: unknown[] } }) =>
		index === 0 || index === node.table.body.length ? 0 : 0.5,
	vLineWidth: () => 0,
	hLineColor: () => '#e4e4e7',
	paddingLeft: () => CELL_PADDING_X,
	paddingRight: () => CELL_PADDING_X,
	paddingTop: () => 4,
	paddingBottom: () => 4,
};

/** Nodo de contenido de `pdfmake` (las declaraciones del proyecto lo tipan como `unknown`). */
type TPdfNode = Record<string, unknown>;

const tableBlock = (table: IExportTable, availableWidth: number): TPdfNode[] => {
	const totalWeight = table.columns.reduce((total, column) => total + column.width, 0);
	const contentWidth = availableWidth - table.columns.length * CELL_PADDING_X * 2;
	const title = { text: table.title, style: 'section' };
	if (table.rows.length === 0)
		return [title, { text: 'Sin filas para estos filtros.', style: 'detail' }];
	const tableNode = {
		table: {
			headerRows: 1,
			widths: table.columns.map((column) => (contentWidth * column.width) / totalWeight),
			body: [
				table.columns.map((column) => ({
					text: column.header,
					bold: true,
					alignment: column.kind === 'number' ? 'right' : 'left',
				})),
				...table.rows.map((row) =>
					row.map((value, index) => ({
						text: cellText(value),
						alignment: table.columns[index]?.kind === 'number' ? 'right' : 'left',
					})),
				),
			],
		},
		layout: zebraLayout,
	};
	// Una tabla corta no se parte: así su título nunca queda solo al pie de una página.
	if (table.rows.length <= UNBREAKABLE_MAX_ROWS)
		return [{ stack: [title, tableNode], unbreakable: true }];
	return [title, tableNode];
};

const kpiBlock = (doc: IExportDocument) => ({
	table: {
		widths: doc.kpis.map(() => '*'),
		body: [
			doc.kpis.map((kpi) => ({
				stack: [
					{ text: kpi.label, style: 'kpiLabel' },
					{ text: kpi.value.toLocaleString('es-CL'), style: 'kpiValue' },
				],
			})),
		],
	},
	layout: {
		fillColor: () => '#f4f4f5',
		hLineWidth: () => 0,
		vLineWidth: () => 4,
		vLineColor: () => '#ffffff',
		paddingLeft: () => 8,
		paddingRight: () => 8,
		paddingTop: () => 6,
		paddingBottom: () => 6,
	},
	margin: [0, 8, 0, 4],
});

/** Horizontal cuando alguna tabla tiene muchas columnas. */
export const pdfOrientationOf = (doc: IExportDocument): 'portrait' | 'landscape' =>
	doc.tables.some((table) => table.columns.length > 4) ? 'landscape' : 'portrait';

export const reportToPdfDefinition = (doc: IExportDocument): TDocumentDefinitions => {
	const orientation = pdfOrientationOf(doc);
	const availableWidth = A4_WIDTH[orientation] - PAGE_MARGIN * 2;
	return {
		pageSize: 'A4',
		pageOrientation: orientation,
		pageMargins: [PAGE_MARGIN, 40, PAGE_MARGIN, 50],
		info: { title: doc.title, author: 'Zentria ERP', creator: 'Reportes de inventario' },
		content: [
			{ text: doc.title, style: 'title' },
			...doc.details.map((line) => ({ text: line, style: 'detail' })),
			...(doc.simulated ? [{ text: SIMULATED_EXPORT_NOTICE, style: 'warning' }] : []),
			...(doc.kpis.length > 0 ? [kpiBlock(doc)] : []),
			...doc.tables.flatMap((table) => tableBlock(table, availableWidth)),
		],
		styles: {
			title: { fontSize: 16, bold: true, color: '#18181b', margin: [0, 0, 0, 6] },
			detail: { fontSize: 9, color: '#71717a' },
			warning: { fontSize: 9, bold: true, color: '#b45309', margin: [0, 6, 0, 0] },
			section: { fontSize: 11, bold: true, color: '#18181b', margin: [0, 14, 0, 6] },
			kpiLabel: { fontSize: 8, color: '#71717a' },
			kpiValue: { fontSize: 14, bold: true, color: '#18181b' },
		},
		defaultStyle: { font: 'Roboto', fontSize: 9, color: '#334155' },
		footer: (currentPage: number, pageCount: number) => ({
			columns: [
				{ text: 'Zentria ERP · Reportes de inventario', fontSize: 8, color: '#94a3b8' },
				{
					text: `Página ${currentPage} de ${pageCount}`,
					fontSize: 8,
					color: '#94a3b8',
					alignment: 'right',
				},
			],
			margin: [PAGE_MARGIN, 20, PAGE_MARGIN, 0],
		}),
	};
};

export const reportToPdfBlob = async (doc: IExportDocument): Promise<Blob> => {
	const pdfMake = await loadPdfMake();
	const pdf = pdfMake.createPdf(reportToPdfDefinition(doc));
	return new Promise<Blob>((resolve, reject) => {
		try {
			// 0.2 entrega el blob por callback; versiones nuevas devuelven una promesa.
			const pending = pdf.getBlob(resolve);
			if (pending instanceof Promise) pending.then(resolve, reject);
		} catch (error) {
			reject(error);
		}
	});
};
