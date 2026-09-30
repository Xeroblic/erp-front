import { describe, expect, it } from 'vitest';
import { IItem } from '@/interface/technicalReviews.interface';
import { EXCEL_COLUMNS, EXCEL_GROUPS } from '../excel.constants';
import { resolveColumnValue } from '../exportExcel';

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
