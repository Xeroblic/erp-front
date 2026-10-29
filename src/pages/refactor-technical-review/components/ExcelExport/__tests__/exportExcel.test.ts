import { describe, expect, it, vi } from 'vitest';
import ExcelJS from 'exceljs';
import FileSaver from 'file-saver';
import { IItem } from '@/interface/technicalReviews.interface';
import { EXCEL_COLUMNS, EXCEL_GROUPS } from '../excel.constants';
import { exportItemsToExcel, resolveColumnValue } from '../exportExcel';

vi.mock('file-saver', () => ({ default: { saveAs: vi.fn() } }));

const loadExportedWorkbook = async (): Promise<ExcelJS.Workbook> => {
	expect(FileSaver.saveAs).toHaveBeenCalledOnce();
	const [blob] = vi.mocked(FileSaver.saveAs).mock.calls[0];
	if (!(blob instanceof Blob)) throw new Error('Falta el archivo Excel');
	const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (reader.result instanceof ArrayBuffer) resolve(reader.result);
			else reject(new Error('No se pudo leer el Excel'));
		};
		reader.onerror = () => reject(new Error('No se pudo leer el Excel'));
		reader.readAsArrayBuffer(blob);
	});
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(buffer);
	return workbook;
};

const readRowValues = (sheet: ExcelJS.Worksheet, rowNumber: number): unknown[] => {
	const row = sheet.getRow(rowNumber);
	return Array.from({ length: row.cellCount }, (_, index) => row.getCell(index + 1).value);
};

const buildItem = (overrides: Partial<IItem> = {}): IItem => ({
	id: 1,
	batch_id: 1,
	serial_number: 'SN-001',
	equipment_type: 'notebook',
	review_status: 'reviewed',
	current_status: 'received',
	details: null,
	...overrides,
});

describe('resolveColumnValue: cliente y proveedor', () => {
	it('exporta la antena en español', () => {
		const item = buildItem({
			equipment_type: 'desktop',
			details: { includes_antenna: true, antenna_condition: 'loose' },
		});
		expect(resolveColumnValue(item, 'includes_antenna')).toBe('SI');
		expect(resolveColumnValue(item, 'antenna_condition')).toBe('Suelta');
		expect(EXCEL_COLUMNS.desktop.map((column) => column.key)).toEqual(
			expect.arrayContaining(['includes_antenna', 'antenna_condition']),
		);
	});
	it('toma el cliente de customer_supplier y el proveedor de supplier', () => {
		const item = buildItem({
			customer_supplier: { id: 10, name: 'Cliente SpA' },
			supplier: { id: 20, name: 'Proveedor Ltda' },
		});

		expect(resolveColumnValue(item, '__customer')).toBe('Cliente SpA');
		expect(resolveColumnValue(item, '__supplier')).toBe('Proveedor Ltda');
	});

	it('deja vacía la celda faltante sin usar el valor del otro campo', () => {
		const soloCliente = buildItem({
			customer_supplier: { id: 10, name: 'Cliente SpA' },
			supplier: null,
		});
		const soloProveedor = buildItem({
			customer_supplier: null,
			supplier: { id: 20, name: 'Proveedor Ltda' },
		});

		expect(resolveColumnValue(soloCliente, '__supplier')).toBe('');
		expect(resolveColumnValue(soloProveedor, '__customer')).toBe('');
	});
});

describe('EXCEL_COLUMNS / EXCEL_GROUPS', () => {
	const equipmentTypes = Object.keys(EXCEL_COLUMNS);

	it.each(equipmentTypes)('la hoja %s incluye las columnas Cliente y Proveedor', (type) => {
		const keys = EXCEL_COLUMNS[type].map((col) => col.key);

		expect(keys).toContain('__customer');
		expect(keys).toContain('__supplier');
	});

	it.each(equipmentTypes)(
		'los grupos de la hoja %s cubren exactamente Nº + sus columnas',
		(type) => {
			const totalSpan = EXCEL_GROUPS[type].reduce((sum, group) => sum + group.span, 0);

			expect(totalSpan).toBe(EXCEL_COLUMNS[type].length + 1);
		},
	);
});

describe('exportItemsToExcel: monitor', () => {
	it.each([
		{ status: 'damaged_cable', expected: 'Cable en Mal Estado' },
		{ status: null, expected: '' },
	])('conserva Estado del Cable con valor $status', async ({ status, expected }) => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
		vi.mocked(FileSaver.saveAs).mockClear();

		try {
			await exportItemsToExcel(
				[buildItem({ equipment_type: 'monitor', details: { power_cable_status: status } })],
				'details',
				'monitor',
			);

			const [sheet] = (await loadExportedWorkbook()).worksheets;
			const header = sheet.getRow(6);
			const cableColumn =
				header.cellCount > 0
					? Array.from({ length: header.cellCount }, (_, index) => index + 1).find(
							(column) => header.getCell(column).value === 'Estado del Cable',
						)
					: undefined;
			expect(cableColumn).toBeDefined();
			if (cableColumn === undefined) throw new Error('Falta Estado del Cable');
			expect(sheet.getRow(7).getCell(cableColumn).value).toBe(expected);
		} finally {
			vi.restoreAllMocks();
			vi.unstubAllGlobals();
		}
	});
});

describe('exportItemsToExcel: encabezados en español', () => {
	// El backend puede enviar tipos fuera de EquipmentType; caen al camino sin columnas.
	const UNMAPPED_EQUIPMENT_TYPE = 'tablet' as unknown as IItem['equipment_type'];

	it('rotula en español las columnas de un tipo sin columnas definidas', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
		vi.mocked(FileSaver.saveAs).mockClear();

		try {
			await exportItemsToExcel(
				[
					buildItem({ equipment_type: 'notebook', details: { brand: 'Dell' } }),
					buildItem({
						equipment_type: UNMAPPED_EQUIPMENT_TYPE,
						details: {
							screen_inches: 10,
							battery_health: 90,
							includes_power_cable: true,
							observations: 'Sin detalles',
						},
						extra_attributes: { custom_flag: 'si' },
					}),
				],
				'details',
				'mixto',
			);

			const workbook = await loadExportedWorkbook();
			const notebookSheet = workbook.getWorksheet('Notebook');
			const tabletSheet = workbook.worksheets.find((sheet) => sheet !== notebookSheet);
			if (!notebookSheet || !tabletSheet) throw new Error('Faltan hojas');

			expect(readRowValues(notebookSheet, 6)).toContain('Número de Serie');
			// Sin fila de grupos, los encabezados del tipo genérico quedan una fila más arriba.
			expect(readRowValues(tabletSheet, 5)).toEqual([
				'Nº',
				'Número de Serie',
				'Pulgadas Pantalla',
				'Salud Batería',
				'Incluye Cable de Poder',
				'Custom Flag',
				'Observaciones',
				'Cliente',
				'Proveedor',
			]);
		} finally {
			vi.restoreAllMocks();
			vi.unstubAllGlobals();
		}
	});

	it.each(Object.keys(EXCEL_COLUMNS))('la hoja %s no usa Serial Number', (type) => {
		const headers = EXCEL_COLUMNS[type].map((column) => column.header);

		expect(headers).toContain('Número de Serie');
		expect(headers).not.toContain('Serial Number');
	});
});
