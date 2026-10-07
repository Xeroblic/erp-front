import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import usePurchaseDocumentForm from '../usePurchaseDocumentForm';

vi.mock('@/store', () => ({ useAppDispatch: () => vi.fn() }));
vi.mock('@/services/procurement/procurementProducts.service', () => ({
	formatProcurementProductLabel: () => '',
	listPurchasableProcurementProducts: () => [],
}));

describe('usePurchaseDocumentForm — tipo inicial', () => {
	it('un alta sin acceso a proveedores abre como boleta', () => {
		const { result } = renderHook(() =>
			usePurchaseDocumentForm({ subsidiaryId: 1, defaultDocumentType: 'receipt' }),
		);

		expect(result.current.formik.values.document_type).toBe('receipt');
		expect(result.current.formik.values.supplier_id).toBe('');
	});
});
