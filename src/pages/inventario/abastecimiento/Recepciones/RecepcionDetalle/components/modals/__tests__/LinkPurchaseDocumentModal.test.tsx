import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IPurchaseDocument, IStockReceipt } from '@/interface/procurement.interface';
import LinkPurchaseDocumentModal from '../LinkPurchaseDocumentModal';

/**
 * Vincular la factura posterior (tarea 13 del backend): el comando que viaja,
 * su clave, y dónde cae cada rechazo.
 */

vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ authorize: () => true, hasAnyPermission: () => true, isSuperAdmin: false }),
}));
vi.mock('@/hooks/useDir', () => ({
	default: () => ({ dir: 'ltr', isLTR: true, isRTL: false }),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/utils/tailwindColorResolver.util', () => ({
	resolveTailwindColor: () => '#2563eb',
	resolveTailwindColorAlpha: () => 'rgba(37, 99, 235, 0.5)',
}));
vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
		isOpen ? <div>{children}</div> : null,
	ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalFooterChild: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/ui/Alert', () => ({
	default: ({ title, children }: { title: React.ReactNode; children: React.ReactNode }) => (
		<div>
			<strong>{title}</strong>
			{children}
		</div>
	),
}));
vi.mock('@/components/form/SelectReact', () => ({
	default: ({
		inputId,
		options,
		value,
		onChange,
	}: {
		inputId?: string;
		options?: { value: string; label: string }[];
		value?: { value: string; label: string } | null;
		onChange?: (option: { value: string; label: string } | null) => void;
	}) => (
		<select
			id={inputId}
			value={value?.value ?? ''}
			onChange={(event) =>
				onChange?.(options?.find((option) => option.value === event.target.value) ?? null)
			}>
			<option value=''>—</option>
			{options?.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-toastify', () => ({ toast }));

const dispatch = vi.hoisted(() => vi.fn());
vi.mock('@/store', () => ({ useAppDispatch: () => dispatch }));
vi.mock('@/store/slices/procurement/stockReceiptsSlice', () => ({
	linkStockReceiptPurchaseDocumentThunk: (args: unknown) => ({ type: 'link', args }),
}));

const DOCUMENT = {
	id: 24,
	document_number: '1234',
	supplier: null,
	items: [{ id: 101, product: { id: 31 }, name_snapshot: 'Mouse', remaining_quantity: 10 }],
} as unknown as IPurchaseDocument;

const picker = vi.hoisted(() => ({ selected: null as IPurchaseDocument | null }));
vi.mock('@/pages/inventario/abastecimiento/Recepciones/hooks/usePurchaseDocumentPicker', () => ({
	default: (_subsidiaryId: number | null, _isOpen: boolean, documentId: number | '') => ({
		documents: [{ id: 24, document_number: '1234', supplier: null }],
		loadingDocuments: false,
		selectedDocument: documentId === '' ? null : picker.selected,
		loadingSelectedDocument: false,
	}),
}));

const RECEIPT = {
	id: 80,
	supplier: null,
	items: [
		{ id: 301, product: { id: 31 }, name_snapshot: 'Mouse', quantity: 4 },
		{ id: 302, product: { id: 31 }, name_snapshot: 'Mouse', quantity: 6 },
	],
} as unknown as IStockReceipt;

const rejection = (status: number, data: Record<string, unknown>) => ({
	isAxiosError: true,
	response: { status, data },
});

const renderModal = (onReceiptStale = vi.fn(), receipt: IStockReceipt = RECEIPT) => {
	render(
		<LinkPurchaseDocumentModal
			isOpen
			setIsOpen={vi.fn()}
			receipt={receipt}
			subsidiaryId={2}
			onLinked={vi.fn()}
			onReceiptStale={onReceiptStale}
		/>,
	);
	fireEvent.change(screen.getByLabelText('Documento confirmado'), { target: { value: '24' } });
	fireEvent.change(screen.getByLabelText('Motivo'), {
		target: { value: 'Factura recibida después de la entrega' },
	});
	return onReceiptStale;
};

const lastLinkArgs = () =>
	(dispatch.mock.calls.at(-1)?.[0] as { args: Record<string, unknown> }).args;

afterEach(() => {
	dispatch.mockReset();
	toast.success.mockReset();
	picker.selected = null;
});

describe('LinkPurchaseDocumentModal', () => {
	it('asigna todas las líneas, dos a la misma línea del documento, con la clave de la escritura', async () => {
		picker.selected = DOCUMENT;
		dispatch.mockReturnValue({ unwrap: () => Promise.resolve({ data: { id: 80 } }) });
		renderModal();

		fireEvent.click(screen.getByRole('button', { name: 'Vincular' }));

		await waitFor(() => expect(toast.success).toHaveBeenCalled());
		const args = lastLinkArgs();
		expect(args).toMatchObject({
			subsidiaryId: 2,
			id: 80,
			payload: {
				purchase_document_id: 24,
				reason: 'Factura recibida después de la entrega',
				items: [
					{ stock_receipt_line_id: 301, purchase_document_line_id: 101 },
					{ stock_receipt_line_id: 302, purchase_document_line_id: 101 },
				],
			},
		});
		expect((args.headers as { idempotencyKey: string }).idempotencyKey).toEqual(
			expect.any(String),
		);
	});

	it('el 409 RECEIPT_DOCUMENT_ALREADY_LINKED muestra su mensaje, relee la recepción y no deja reintentar', async () => {
		picker.selected = DOCUMENT;
		dispatch.mockReturnValue({
			unwrap: () =>
				Promise.reject(
					rejection(409, {
						code: 'RECEIPT_DOCUMENT_ALREADY_LINKED',
						message: 'La recepción ya tiene un documento vinculado.',
					}),
				),
		});
		const onReceiptStale = renderModal();

		fireEvent.click(screen.getByRole('button', { name: 'Vincular' }));

		expect(
			await screen.findByText('La recepción ya tiene un documento vinculado.'),
		).toBeInTheDocument();
		expect(onReceiptStale).toHaveBeenCalledTimes(1);
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Vincular' })).toBeDisabled(),
		);
	});

	it('un 422 de línea cae en la línea de la recepción enviada en esa posición', async () => {
		picker.selected = DOCUMENT;
		dispatch.mockReturnValue({
			unwrap: () =>
				Promise.reject(
					rejection(422, {
						code: 'DOCUMENT_LINE_MISMATCH',
						message: 'La línea del documento es de otro producto.',
						errors: {
							'items.1.purchase_document_line_id': [
								'La línea del documento es de otro producto (línea 302).',
							],
						},
					}),
				),
		});
		renderModal();

		fireEvent.click(screen.getByRole('button', { name: 'Vincular' }));

		expect(
			await screen.findByText('La línea del documento es de otro producto (línea 302).'),
		).toBeInTheDocument();
	});

	it('un 422 del documento cae bajo el selector de documento', async () => {
		picker.selected = DOCUMENT;
		dispatch.mockReturnValue({
			unwrap: () =>
				Promise.reject(
					rejection(422, {
						code: 'DOCUMENT_NOT_CONFIRMED',
						message: 'Solo se puede vincular un documento confirmado.',
						errors: {
							purchase_document_id: ['El documento ya no está confirmado.'],
						},
					}),
				),
		});
		renderModal();

		fireEvent.click(screen.getByRole('button', { name: 'Vincular' }));

		expect(await screen.findByText('El documento ya no está confirmado.')).toBeInTheDocument();
	});

	it('sin pendiente suficiente en el documento no deja enviar', () => {
		picker.selected = {
			...DOCUMENT,
			items: [{ ...DOCUMENT.items[0], remaining_quantity: 5 }],
		} as IPurchaseDocument;
		renderModal();

		// Ninguna de las dos cabe junto a la otra: se marcan ambas.
		expect(screen.getAllByText('El documento no tiene pendiente suficiente')).toHaveLength(2);
		expect(screen.getByRole('button', { name: 'Vincular' })).toBeDisabled();
		expect(dispatch).not.toHaveBeenCalled();
	});

	describe('con más de una línea del producto en el documento', () => {
		const SPLIT_DOCUMENT = {
			...DOCUMENT,
			items: [
				{ id: 101, product: { id: 31 }, name_snapshot: 'Mouse', remaining_quantity: 5 },
				{ id: 102, product: { id: 31 }, name_snapshot: 'Mouse', remaining_quantity: 3 },
			],
		} as unknown as IPurchaseDocument;
		const SPLIT_RECEIPT = {
			...RECEIPT,
			items: [
				{ id: 301, product: { id: 31 }, name_snapshot: 'Mouse chico', quantity: 3 },
				{ id: 302, product: { id: 31 }, name_snapshot: 'Mouse grande', quantity: 5 },
			],
		} as unknown as IStockReceipt;

		it('propone la asignación válida (3→3 y 5→5) y deja vincular', () => {
			picker.selected = SPLIT_DOCUMENT;
			renderModal(vi.fn(), SPLIT_RECEIPT);

			expect(screen.getByLabelText('Mouse chico (3 u.)')).toHaveValue('102');
			expect(screen.getByLabelText('Mouse grande (5 u.)')).toHaveValue('101');
			expect(screen.getByRole('button', { name: 'Vincular' })).toBeEnabled();
		});

		it('la elección a mano manda, y si no cabe lo marca y no deja enviar', () => {
			picker.selected = SPLIT_DOCUMENT;
			renderModal(vi.fn(), SPLIT_RECEIPT);

			fireEvent.change(screen.getByLabelText('Mouse grande (5 u.)'), {
				target: { value: '102' },
			});

			expect(screen.getByLabelText('Mouse grande (5 u.)')).toHaveValue('102');
			expect(
				screen.getByText('El documento no tiene pendiente suficiente'),
			).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Vincular' })).toBeDisabled();
		});
	});
});
