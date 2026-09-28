import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import useDocumentoCompraForm from '../useDocumentoCompraForm';

/**
 * Quien no puede listar proveedores no puede elegir el que exige la factura:
 * su alta abre como boleta. La edición conserva siempre el tipo del documento.
 */

vi.mock('@/store', () => ({ useAppDispatch: () => vi.fn() }));
vi.mock('@/services/procurement/procurementProducts.service', () => ({
	formatProcurementProductLabel: () => '',
	listPurchasableProcurementProducts: () => [],
}));

describe('useDocumentoCompraForm — tipo inicial', () => {
	it('un alta abre como factura por defecto', () => {
		const { result } = renderHook(() => useDocumentoCompraForm({ subsidiaryId: 1 }));

		expect(result.current.formik.values.document_type).toBe('invoice');
	});

	it('un alta sin acceso a proveedores abre como boleta', () => {
		const { result } = renderHook(() =>
			useDocumentoCompraForm({ subsidiaryId: 1, defaultDocumentType: 'receipt' }),
		);

		expect(result.current.formik.values.document_type).toBe('receipt');
		expect(result.current.formik.values.supplier_id).toBe('');
	});
});
