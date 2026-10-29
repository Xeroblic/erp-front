import type { TDocumentDefinitions } from 'pdfmake/interfaces';

type Nullable<T> = T | null | undefined;

const filterNullable = <T>(items: Array<Nullable<T>>): T[] =>
	items.filter((item): item is T => item !== undefined && item !== null);

export const safeStack = <T>(items: Array<Nullable<T>>): T[] => filterNullable(items);

export const safeColumns = <T>(cols: Array<Nullable<T>>): T[] => filterNullable(cols);

export const safeContent = <T>(blocks: Array<Nullable<T>>): T[] => filterNullable(blocks);

interface PdfHeader {
	tagline?: string;
	companyName: string;
	description?: string;
	addresses?: string[];
	website?: string;
	rut: string;
	documentLabel: string;
	documentNumber: string | number;
	branchSII?: string;
}

interface PdfTemplate {
	header: PdfHeader;
	clientInfo: Record<string, unknown>;
	observations: {
		lines: string[];
	};
}

export const buildPdfDefinition = (tpl: PdfTemplate): TDocumentDefinitions => ({
	pageSize: 'A4',
	pageMargins: [30, 30, 30, 40],
	defaultStyle: {
		font: 'Roboto',
		fontSize: 9,
		color: '#111827',
	},

	content: safeContent([
		// ========== ENCABEZADO ==========
		{
			columns: safeColumns([
				{
					width: '*',
					stack: safeStack([
						tpl.header.tagline
							? { text: tpl.header.tagline, fontSize: 9, color: '#6b7280' }
							: undefined,
						{
							text: tpl.header.companyName,
							fontSize: 16,
							bold: true,
							margin: [0, 2, 0, 2],
						},
						tpl.header.description
							? { text: tpl.header.description, fontSize: 9, margin: [0, 2] }
							: undefined,
						...(tpl.header.addresses ?? []).map((address) => ({
							text: address,
							fontSize: 9,
						})),
						tpl.header.website
							? { text: tpl.header.website, fontSize: 9, margin: [0, 2] }
							: undefined,
					]),
				},
				{
					width: 170,
					stack: safeStack([
						{
							canvas: [
								{
									type: 'rect',
									x: 0,
									y: 0,
									w: 170,
									h: 85,
									r: 6,
									lineWidth: 1.6,
									lineColor: '#c2410c',
								},
							],
						},
						{
							text: 'R.U.T.',
							alignment: 'center',
							color: '#6b7280',
							margin: [0, 6, 0, 0],
						},
						{
							text: tpl.header.rut,
							fontSize: 18,
							bold: true,
							alignment: 'center',
							margin: [0, 3],
						},
						{
							canvas: [
								{
									type: 'line',
									x1: 10,
									y1: 0,
									x2: 160,
									y2: 0,
									lineWidth: 1,
									lineColor: '#fde68a',
								},
							],
						},
						{ text: tpl.header.documentLabel, alignment: 'center', margin: [0, 5] },
						{
							text: `N° ${tpl.header.documentNumber}`,
							alignment: 'center',
							fontSize: 14,
							bold: true,
						},
						tpl.header.branchSII
							? { text: tpl.header.branchSII, alignment: 'center', margin: [0, 6] }
							: undefined,
					]),
				},
			]),
		},

		{ text: 'POR LO SIGUIENTE', alignment: 'center', bold: true, margin: [0, 14] },

		// ========== CLIENTE ==========
		{
			table: {
				widths: ['30%', '70%'],
				body: Object.entries(tpl.clientInfo).flatMap(([key, value]) => {
					if (key === 'seller') return [];
					if (
						[
							'emissionDate',
							'emissionTime',
							'paymentCondition',
							'deliveryCondition',
						].includes(key)
					) {
						return [];
					}
					return [
						[
							{
								text: key.replace(/([A-Z])/g, ' $1'),
								bold: true,
								fillColor: '#f3f4f6',
							},
							{ text: String(value ?? '—') },
						],
					];
				}),
			},
			margin: [0, 8],
		},

		// ========== OBSERVACIONES ==========
		tpl.observations.lines.length
			? {
					margin: [0, 16],
					stack: safeStack([
						{ text: 'Observaciones', bold: true, margin: [0, 0, 0, 4] },
						...tpl.observations.lines.map((line) => ({
							text: line,
							margin: [0, 2],
						})),
					]),
				}
			: undefined,
	]),
});

// Helper
const formatCLP = (value: number) =>
	new Intl.NumberFormat('es-CL', {
		style: 'currency',
		currency: 'CLP',
		minimumFractionDigits: 0,
	}).format(value);
