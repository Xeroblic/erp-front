import type { Workbook, Worksheet, Cell } from 'exceljs';

/**
 * Modelo plano con TODO lo que necesita la plantilla `formatoExcel.xlsx`.
 * Se calcula una sola vez desde la cotización (mismos helpers que el PDF) y se
 * vuelca celda por celda. Mantener esta forma desacoplada del store permite
 * probar el relleno en Node contra la plantilla real.
 */
export interface QuoteExcelModel {
	company: {
		name: string;
		rut: string;
		address: string;
		email: string;
		giro: string;
	};
	quoteNumber: string | number;
	docCreatedLine: string; // "13-07-2026 05:09 p. m."
	emissionDate: string; // "14-07-2026"
	emissionTime: string; // "02:50 p. m."
	purchaseOrder: string;
	customer: {
		name: string;
		rut: string;
		giro: string;
		shippingAddress: string;
		billingAddress: string;
		contactName: string;
		email: string;
	};
	right: {
		fecha: string;
		telefono: string;
		nVenta: string;
		metodoPago: string;
		documento: string;
	};
	items: Array<{
		cantidad: number;
		codigo: string;
		descripcion: string;
		precioNeto: number;
		totalNeto: number;
	}>;
	totals: {
		neto: number;
		iva: number;
		total: number;
	};
	conditions: string; // multilínea
	bank: string; // multilínea
	footerGeneratedBy: string;
	emitidoPor: string;
	creadoPor: string;
}

// ── Coordenadas de la plantilla (anclas de las celdas combinadas) ───────────
const ITEM_START_ROW = 24;
// La plantilla trae filas de ítem con estilo/merge de la 24 a la 35 (12 slots).
const TEMPLATE_ITEM_ROWS = 12;
const CURRENCY_FMT = '#,##0';

/** Escribe en una celda conservando su estilo original. */
const setValue = (ws: Worksheet, address: string, value: string | number): void => {
	ws.getCell(address).value = value;
};

/** Escribe un número con formato de moneda CLP (sin decimales). */
const setCurrency = (ws: Worksheet, address: string, value: number): void => {
	const cell: Cell = ws.getCell(address);
	cell.value = Number.isFinite(value) ? value : 0;
	cell.numFmt = CURRENCY_FMT;
};

const clearItemRow = (ws: Worksheet, row: number): void => {
	setValue(ws, `B${row}`, '');
	setValue(ws, `C${row}`, '');
	setValue(ws, `E${row}`, '');
	setValue(ws, `K${row}`, '');
	setValue(ws, `L${row}`, '');
};

const writeItemRow = (ws: Worksheet, row: number, item: QuoteExcelModel['items'][number]): void => {
	setValue(ws, `B${row}`, item.cantidad);
	setValue(ws, `C${row}`, item.codigo);

	const descCell = ws.getCell(`E${row}`);
	descCell.value = item.descripcion;
	descCell.alignment = { ...descCell.alignment, wrapText: true, vertical: 'middle' };

	setCurrency(ws, `K${row}`, item.precioNeto);
	setCurrency(ws, `L${row}`, item.totalNeto);
};

/**
 * Rellena la plantilla `formatoExcel.xlsx` con los datos de la cotización.
 * Opera sobre la primera hoja del workbook (la que trae la plantilla).
 */
export const fillQuoteExcelTemplate = (workbook: Workbook, model: QuoteExcelModel): void => {
	const ws = workbook.worksheets[0];
	if (!ws) throw new Error('La plantilla de Excel no tiene hojas.');

	// ── Cabecera empresa (izquierda) + caja RUT (derecha) ──
	setValue(ws, 'E4', model.company.name);
	setValue(
		ws,
		'E5',
		`Dirección: ${model.company.address || '—'}\nEmail: ${model.company.email || '—'}\nGiro: ${model.company.giro || '—'}`,
	);
	setValue(ws, 'J4', `R.U.T.: ${model.company.rut}`);
	setValue(ws, 'J7', `N° ${model.quoteNumber}`);

	// ── Franja de fechas ──
	setValue(
		ws,
		'B12',
		`Fecha creación doc: ${model.docCreatedLine}        Fecha de emisión: ${model.emissionDate}`,
	);
	setValue(ws, 'K12', `N° Orden C: ${model.purchaseOrder || '—'}`);
	setValue(ws, 'B13', `Hora de emisión: ${model.emissionTime}`);

	// ── Caja cliente (izquierda) ──
	setValue(ws, 'E15', model.customer.name);
	setValue(ws, 'E16', model.customer.rut);
	setValue(ws, 'E17', model.customer.giro);
	setValue(ws, 'E18', model.customer.shippingAddress);
	setValue(ws, 'E19', model.customer.billingAddress);
	setValue(ws, 'E20', model.customer.contactName);
	setValue(ws, 'E21', model.customer.email);

	// ── Caja documento (derecha) ──
	setValue(ws, 'K15', model.right.fecha);
	setValue(ws, 'K16', model.right.telefono);
	setValue(ws, 'K17', model.right.nVenta);
	setValue(ws, 'K18', model.right.metodoPago);
	setValue(ws, 'K19', model.right.documento);

	// ── Tabla de ítems ──
	// Si hay más ítems que slots de plantilla, duplicamos la última fila de
	// ítem (copia estilo) y recreamos el merge E:J para las filas nuevas.
	const extraRows = Math.max(0, model.items.length - TEMPLATE_ITEM_ROWS);
	if (extraRows > 0) {
		const lastTemplateRow = ITEM_START_ROW + TEMPLATE_ITEM_ROWS - 1; // 35
		ws.duplicateRow(lastTemplateRow, extraRows, true);
		for (let i = 1; i <= extraRows; i += 1) {
			const r = lastTemplateRow + i;
			try {
				ws.mergeCells(`E${r}:J${r}`);
			} catch {
				// merge ya existente: lo ignoramos
			}
		}
	}

	const totalSlots = Math.max(TEMPLATE_ITEM_ROWS, model.items.length);
	for (let i = 0; i < totalSlots; i += 1) {
		const row = ITEM_START_ROW + i;
		const item = model.items[i];
		if (item) writeItemRow(ws, row, item);
		else clearItemRow(ws, row);
	}

	// ── Totales (se desplazan si se insertaron filas de ítem) ──
	const totalsOffset = extraRows;
	setCurrency(ws, `L${40 + totalsOffset}`, model.totals.neto);
	setCurrency(ws, `L${41 + totalsOffset}`, model.totals.iva);
	setCurrency(ws, `L${42 + totalsOffset}`, model.totals.total);

	// ── Condiciones comerciales / datos bancarios ──
	setValue(ws, `B${40 + totalsOffset}`, model.conditions);
	setValue(ws, `G${40 + totalsOffset}`, model.bank);

	// ── Pie ──
	setValue(ws, `B${46 + totalsOffset}`, model.footerGeneratedBy);
	setValue(ws, `B${47 + totalsOffset}`, model.emitidoPor);
	setValue(ws, `K${47 + totalsOffset}`, model.creadoPor);
};
