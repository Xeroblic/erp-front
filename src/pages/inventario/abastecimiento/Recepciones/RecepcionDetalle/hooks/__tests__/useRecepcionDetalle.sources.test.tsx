import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IStockReceipt } from '@/interface/procurement.interface';

vi.mock('@/store', () => ({ useAppDispatch: vi.fn(), useAppSelector: vi.fn() }));
vi.mock('@/hooks/useSubsidiaryRolloutStage', () => ({ useSubsidiaryRolloutStage: vi.fn() }));
const receipt = {
	status: 'posted',
	branch_id: 1,
	entered_location: { scope: 'unlocated', warehouse: null },
} as IStockReceipt;
afterEach(() => vi.unstubAllEnvs());

describe('Auditoría de las fuentes del enlace Recepciones → Inventario', () => {
	it.each([
		{
			receipts: 'false',
			stock: 'true',
			overview: 'false',
			shouldLink: true,
			label: 'recepción e inventario reales con fallback general simulado',
		},
		{
			receipts: 'false',
			stock: 'false',
			overview: 'true',
			shouldLink: false,
			label: 'recepción real e inventario simulado',
		},
		{
			receipts: 'true',
			stock: 'false',
			overview: 'true',
			shouldLink: true,
			label: 'ambas fuentes simuladas',
		},
		{
			receipts: 'true',
			stock: 'true',
			overview: 'false',
			shouldLink: false,
			label: 'recepción simulada e inventario real',
		},
	])('$label', async ({ receipts, stock, overview, shouldLink }) => {
		vi.resetModules();
		vi.stubEnv('VITE_INVENTORY_RECEIPTS_USE_MOCKS', receipts);
		vi.stubEnv('VITE_INVENTORY_STOCK_USE_MOCKS', stock);
		vi.stubEnv('VITE_INVENTORY_OVERVIEW_USE_MOCKS', overview);
		const { receiptInventoryLink } = await import(
			'@/pages/inventario/abastecimiento/Recepciones/RecepcionDetalle/hooks/useRecepcionDetalle'
		);
		expect(receiptInventoryLink(receipt, 1) !== null).toBe(shouldLink);
	});
});
