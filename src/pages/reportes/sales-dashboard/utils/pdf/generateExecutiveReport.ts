// @ts-expect-error El paquete pdfmake/build/pdfmake no expone tipos de TypeScript de forma natural en esta versión
import pdfMake from 'pdfmake/build/pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import { loadPdfFonts } from '../../../../comercial/cotizaciones/utils/pdf/fonts';

import type { SalesDashboardStats, SaleRecord, ReportFiltersState } from '../../../types';
import { generateSmartInsights } from '../smartInsights';
import { buildCoverPage, buildExecutiveSummary, buildSmartKPIs, buildTopPerformersTable, buildYearlyAnalytics, buildSemesterDeepDive, buildRiskAnalytics, buildMethodology, type PdfContent } from './reportBuilder';
import { format } from 'date-fns';

export interface ExecutiveReportData {
	stats: SalesDashboardStats;
	previousStats?: SalesDashboardStats;
	filteredResults: SaleRecord[];
	topCustomers: { name: string; total: number }[];
	filters: ReportFiltersState;
}

export const generateExecutiveReport = async (data: ExecutiveReportData): Promise<void> => {
	// 1. Cargar las fuentes oficiales
	loadPdfFonts(pdfMake as any);

	// 2. Extraer insights automáticos
	const insights = generateSmartInsights(data.stats, data.previousStats);

	// 3. Ensamblaje Multipágina (Cover -> Dashboard -> Analytics -> Methodology)
	const content: PdfContent[] = [
		buildCoverPage(data.filters.dateFrom, data.filters.dateTo),
		buildExecutiveSummary(insights),
		buildSmartKPIs(data.stats),
		buildTopPerformersTable(data.topCustomers),
		buildYearlyAnalytics(data.filteredResults),
		...(buildSemesterDeepDive(data.filteredResults) as PdfContent[]),
		buildRiskAnalytics(data.filteredResults),
		buildMethodology()
	];

	const docDefinition: TDocumentDefinitions = {
		pageSize: 'A4',
		pageMargins: [40, 40, 40, 60],
		info: {
			title: 'Reporte Ejecutivo de Ventas',
			author: 'Zentria ERP',
			subject: 'Estadísticas de Ventas',
			creator: 'Módulo Reportables',
		},
		content: content,
		defaultStyle: {
			font: 'Roboto', // Fuente que viene en vfs_fonts
			fontSize: 10,
			color: '#334155',
		},
		footer: (currentPage: number, pageCount: number) => {
			return {
				columns: [
					{ text: 'Confidencial - Uso Interno Exclusivo', fontSize: 8, color: '#94a3b8', margin: [40, 20, 0, 0] },
					{ text: `Página ${currentPage} de ${pageCount}`, fontSize: 8, color: '#94a3b8', alignment: 'right', margin: [0, 20, 40, 0] },
				],
			};
		},
	};

	// 4. Descargar PDF
	const fileName = `Reporte_Ejecutivo_Ventas_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
	pdfMake.createPdf(docDefinition).download(fileName);
};
