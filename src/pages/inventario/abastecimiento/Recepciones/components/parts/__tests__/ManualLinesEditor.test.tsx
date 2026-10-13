import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useFormik } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import type usePurchasableProductOptions from '@/pages/inventario/abastecimiento/DocumentosCompra/hooks/usePurchasableProductOptions';
import ManualLinesEditor from '../ManualLinesEditor';
import { EMPTY_RECEPCION_LINE, EMPTY_RECEPCION_VALUES } from '../../../types';
import type { IStockReceiptFormValues } from '../../../types';

/**
 * Un producto que no existe se crea desde la línea, sin cerrar la recepción:
 * «Nuevo producto» avisa qué línea lo pidió. Con datos simulados no se ofrece.
 */

const authorize = vi.hoisted(() => vi.fn(() => true));
vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize, hasAnyPermission: () => true, isSuperAdmin: false }),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/utils/tailwindColorResolver.util', () => ({
	resolveTailwindColor: () => '#2563eb',
	resolveTailwindColorAlpha: () => 'rgba(37, 99, 235, 0.5)',
}));
// El costo tiene su propia prueba; acá sólo importa el producto.
vi.mock('@/components/procurement', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/components/procurement')>()),
	CostInput: () => null,
}));

const productOptions = {
	options: [],
	loading: false,
	hasMore: false,
	unavailableReason: null,
	search: '',
	onSearchChange: vi.fn(),
	clearSearch: vi.fn(),
	getOption: (productId: number | '') =>
		productId === 31 ? { value: '31', label: 'NB-1 · Notebook' } : null,
	reload: vi.fn(),
	addProduct: vi.fn(),
} as ReturnType<typeof usePurchasableProductOptions>;

const Editor = ({
	canCreateProduct,
	onCreateProduct,
}: {
	canCreateProduct: boolean;
	onCreateProduct: (lineIndex: number) => void;
}) => {
	const formik = useFormik<IStockReceiptFormValues>({
		initialValues: {
			...EMPTY_RECEPCION_VALUES,
			mode: 'manual',
			items: [{ ...EMPTY_RECEPCION_LINE, product_id: 31 }, { ...EMPTY_RECEPCION_LINE }],
		},
		onSubmit: vi.fn(),
	});
	return (
		<ManualLinesEditor
			formik={formik}
			subsidiaryId={2}
			productOptions={productOptions}
			canCreateProduct={canCreateProduct}
			onCreateProduct={onCreateProduct}
			isCostRequired={false}
			disabled={false}
		/>
	);
};

describe('ManualLinesEditor — producto nuevo', () => {
	it('cada línea ofrece «Nuevo producto» y avisa cuál lo pidió', () => {
		const onCreateProduct = vi.fn();
		render(<Editor canCreateProduct onCreateProduct={onCreateProduct} />);

		const buttons = screen.getAllByRole('button', { name: /Nuevo producto/ });
		expect(buttons).toHaveLength(2);

		fireEvent.click(buttons[1]);

		expect(onCreateProduct).toHaveBeenCalledWith(1);
	});

	it('la línea nombra su producto con la etiqueta conocida', () => {
		render(<Editor canCreateProduct onCreateProduct={vi.fn()} />);

		expect(screen.getByText('NB-1 · Notebook')).toBeInTheDocument();
	});

	it('con datos simulados no ofrece crear productos', () => {
		render(<Editor canCreateProduct={false} onCreateProduct={vi.fn()} />);

		expect(screen.queryByRole('button', { name: /Nuevo producto/ })).not.toBeInTheDocument();
	});

	it('sin permiso create-product el botón no aparece', () => {
		authorize.mockReturnValue(false);
		render(<Editor canCreateProduct onCreateProduct={vi.fn()} />);

		expect(screen.queryByRole('button', { name: /Nuevo producto/ })).not.toBeInTheDocument();
		authorize.mockReturnValue(true);
	});
});
