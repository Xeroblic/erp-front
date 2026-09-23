import type { Worksheet } from 'exceljs';
import {
	SIMULATED_EXPORT_NOTICE,
	type IExportDocument,
	type IExportTable,
} from '@/pages/reportes/inventory-reports/export/reportDocument';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const HEADER_FILL = 'FFF4F4F5'; // zinc-100
const BORDER_COLOR = 'FFD4D4D8'; // zinc-300
const NUMBER_FORMAT = '#,##0';

/** Excel no admite `[]:*?/\` en el nombre de hoja y lo corta a 31 caracteres. */
const sheetName = (title: string): string => title.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31);

/** Título, contexto y, si aplica, el aviso de datos simulados. Devuelve la fila siguiente libre. */
const writeHeader = (sheet: Worksheet, doc: IExportDocument, subtitle: string): number => {
	let row = 1;
	sheet.getCell(row, 1).value = doc.title;
	sheet.getCell(row, 1).font = { bold: true, size: 14 };
	row += 1;
	sheet.getCell(row, 1).value = subtitle;
	sheet.getCell(row, 1).font = { bold: true, size: 11, color: { argb: 'FF52525B' } };
	row += 1;
	doc.details.forEach((line) => {
		sheet.getCell(row, 1).value = line;
		sheet.getCell(row, 1).font = { size: 10, color: { argb: 'FF71717A' } };
		row += 1;
	});
	if (doc.simulated) {
		sheet.getCell(row, 1).value = SIMULATED_EXPORT_NOTICE;
		sheet.getCell(row, 1).font = { bold: true, size: 10, color: { argb: 'FFB45309' } };
		row += 1;
	}
	return row + 1;
};

const styleHeaderRow = (sheet: Worksheet, rowNumber: number, columnCount: number): void => {
	for (let column = 1; column <= columnCount; column += 1) {
		const cell = sheet.getCell(rowNumber, column);
		cell.font = { bold: true };
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
		cell.border = { bottom: { style: 'thin', color: { argb: BORDER_COLOR } } };
		cell.alignment = { vertical: 'middle', wrapText: true };
	}
};

const writeTable = (sheet: Worksheet, table: IExportTable, firstRow: number): void => {
	const headerRow = sheet.getRow(firstRow);
	headerRow.values = table.columns.map((column) => column.header);
	styleHeaderRow(sheet, firstRow, table.columns.length);

	table.rows.forEach((values, index) => {
		const row = sheet.getRow(firstRow + 1 + index);
		row.values = values.map((value) => value ?? '');
		table.columns.forEach((column, columnIndex) => {
			if (column.kind !== 'number') return;
			const cell = row.getCell(columnIndex + 1);
			cell.numFmt = NUMBER_FORMAT;
			cell.alignment = { horizontal: 'right' };
		});
	});

	table.columns.forEach((column, index) => {
		sheet.getColumn(index + 1).width = column.width;
	});
	if (table.rows.length > 0)
		sheet.autoFilter = {
			from: { row: firstRow, column: 1 },
			to: { row: firstRow + table.rows.length, column: table.columns.length },
		};
	sheet.views = [{ state: 'frozen', ySplit: firstRow }];
};

/**
 * Libro con una hoja «Resumen» (KPI) y una hoja por tabla. Cada hoja repite
 * el encabezado, así una hoja suelta sigue diciendo de qué es y si es simulada.
 */
const reportToExcelBlob = async (doc: IExportDocument): Promise<Blob> => {
	const { default: ExcelJS } = await import('exceljs');
	const workbook = new ExcelJS.Workbook();
	workbook.creator = 'Zentria ERP';
	workbook.created = new Date();

	if (doc.kpis.length > 0) {
		const summary = workbook.addWorksheet('Resumen');
		writeTable(
			summary,
			{
				title: 'Resumen',
				columns: [
					{ header: 'Indicador', width: 36 },
					{ header: 'Valor', kind: 'number', width: 14 },
				],
				rows: doc.kpis.map((kpi) => [kpi.label, kpi.value]),
			},
			writeHeader(summary, doc, 'Resumen'),
		);
	}
	doc.tables.forEach((table) => {
		const sheet = workbook.addWorksheet(sheetName(table.title));
		writeTable(sheet, table, writeHeader(sheet, doc, table.title));
	});

	const buffer = await workbook.xlsx.writeBuffer();
	return new Blob([buffer], { type: XLSX_MIME });
};

export default reportToExcelBlob;
