import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IPurchaseDocument } from '@/interface/procurement.interface';
import DocumentInitialStockModal from '../DocumentInitialStockModal';

/**
 * Respaldar parte del stock inicial (tarea 13 del backend): el comando que
 * viaja, su clave, y dónde cae cada rechazo.
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
vi.mock('@/store/slices/procurement/inventoryStockSlice', () => ({
	createInventoryDocumentAllocationThunk: (args: unknown) => ({ type: 'allocate', args }),
}));

const DOCUMENT = {
	id: 24,
	document_number: '1234',
	supplier: null,
	items: [
		{
			id: 101,
			product: { id: 31 },
			sku_snapshot: 'MOU-1',
			name_snapshot: 'Mouse',
			remaining_quantity: 50,
		},
	],
} as unknown as IPurchaseDocument;

vi.mock('@/pages/inventario/abastecimiento/Recepciones/hooks/usePurchaseDocumentPicker', () => ({
	default: (_subsidiaryId: number | null, _isOpen: boolean, documentId: number | '') => ({
		documents: [{ id: 24, document_number: '1234', supplier: null }],
		loadingDocuments: false,
		selectedDocument: documentId === '' ? null : DOCUMENT,
		loadingSelectedDocument: false,
	}),
}));

const rejection = (status: number, data: Record<string, unknown>) => ({
	isAxiosError: true,
	response: { status, data },
});

const fillAndSubmit = (props: { onOriginsStale?: () => void; onDocumented?: () => void } = {}) => {
	render(
		<DocumentInitialStockModal
			isOpen
			setIsOpen={vi.fn()}
			subsidiaryId={2}
			branchId={3}
			productId={31}
			warehouseId={null}
			origin={{ origin_id: 51, physical_quantity: 100 }}
			onDocumented={props.onDocumented ?? vi.fn()}
			onOriginsStale={props.onOriginsStale}
		/>,
	);
	fireEvent.change(screen.getByLabelText('Documento confirmado'), { target: { value: '24' } });
	fireEvent.change(screen.getByLabelText('Línea del documento'), { target: { value: '101' } });
	fireEvent.change(screen.getByLabelText('Cantidad a documentar'), { target: { value: '10' } });
	fireEvent.change(screen.getByLabelText('Motivo'), {
		target: { value: 'Respaldo parcial del conteo inicial' },
	});
	fireEvent.click(screen.getByRole('button', { name: 'Documentar' }));
};

afterEach(() => {
	dispatch.mockReset();
	toast.success.mockReset();
});

describe('DocumentInitialStockModal', () => {
	it('envía el origen, la ubicación y la línea con su clave, y avisa lo que queda sin documento', async () => {
		const onDocumented = vi.fn();
		dispatch.mockReturnValue({
			unwrap: () => Promise.resolve({ quantity: 10, remaining_undocumented_quantity: 90 }),
		});

		fillAndSubmit({ onDocumented });

		await waitFor(() => expect(onDocumented).toHaveBeenCalledWith(10));
		const { args } = dispatch.mock.calls[0][0] as { args: Record<string, unknown> };
		expect(args).toMatchObject({
			subsidiaryId: 2,
			branchId: 3,
			productId: 31,
			payload: {
				origin_id: 51,
				warehouse_id: null,
				purchase_document_line_id: 101,
				quantity: 10,
				reason: 'Respaldo parcial del conteo inicial',
			},
		});
		expect((args.headers as { idempotencyKey: string }).idempotencyKey).toEqual(
			expect.any(String),
		);
		expect(toast.success).toHaveBeenCalledWith(
			expect.stringContaining('Quedan 90 sin documento'),
		);
	});

	it('el 409 INSUFFICIENT_UNDOCUMENTED_STOCK muestra su mensaje y relee las procedencias', async () => {
		const onOriginsStale = vi.fn();
		dispatch.mockReturnValue({
			unwrap: () =>
				Promise.reject(
					rejection(409, {
						code: 'INSUFFICIENT_UNDOCUMENTED_STOCK',
						message: 'El origen sólo tiene 4 unidades sin documento en esa ubicación.',
					}),
				),
		});

		fillAndSubmit({ onOriginsStale });

		expect(
			await screen.findByText(
				'El origen sólo tiene 4 unidades sin documento en esa ubicación.',
			),
		).toBeInTheDocument();
		expect(onOriginsStale).toHaveBeenCalledTimes(1);
	});

	it('el 422 de cantidad cae en su campo', async () => {
		dispatch.mockReturnValue({
			unwrap: () =>
				Promise.reject(
					rejection(422, {
						code: 'RECEIPT_EXCEEDS_DOCUMENT',
						message: 'La línea del documento no tiene pendiente suficiente.',
						errors: { quantity: ['A la línea sólo le quedan 6 unidades.'] },
					}),
				),
		});

		fillAndSubmit();

		const field = await screen.findByText('A la línea sólo le quedan 6 unidades.');
		expect(field.closest('.space-y-1')).toContainElement(
			screen.getByLabelText('Cantidad a documentar'),
		);
	});

	it('el 422 de la línea cae bajo el selector de línea', async () => {
		dispatch.mockReturnValue({
			unwrap: () =>
				Promise.reject(
					rejection(422, {
						code: 'DOCUMENT_LINE_MISMATCH',
						message: 'La línea del documento es de otro producto.',
						errors: {
							purchase_document_line_id: ['Esta línea es de otro producto.'],
						},
					}),
				),
		});

		fillAndSubmit();

		expect(await screen.findByText('Esta línea es de otro producto.')).toBeInTheDocument();
	});
});
