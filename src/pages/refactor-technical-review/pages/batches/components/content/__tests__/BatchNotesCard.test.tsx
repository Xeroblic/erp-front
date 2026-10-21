import React, { type PropsWithChildren } from 'react';
import { configureStore, createAsyncThunk } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IBatch } from '@/interface/technicalReviews.interface';
import BatchNotesCard from '../BatchNotesCard';

const updateRequest = vi.hoisted(() => vi.fn());
const permissions = vi.hoisted(() => ({ granted: new Set<string>() }));

vi.mock('@/hooks/useCurrentBranch', () => ({
	useCurrentBranch: () => ({ branchId: 3, subsidiaryId: 9 }),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/store', async () => {
	const reactRedux = await vi.importActual<typeof import('react-redux')>('react-redux');
	return { useAppDispatch: reactRedux.useDispatch, useAppSelector: reactRedux.useSelector };
});
vi.mock('@/store/slices/technicalReviews', () => ({
	updateBatch: createAsyncThunk(
		'technicalReviews/updateBatch',
		async (args: unknown, { rejectWithValue }) => {
			try {
				const batch: unknown = await updateRequest(args);
				return batch;
			} catch (error: unknown) {
				return rejectWithValue(error instanceof Error ? error.message : 'error');
			}
		},
	),
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({
		children,
		onClick,
		isDisable,
		type,
	}: PropsWithChildren<{
		onClick?: () => void;
		isDisable?: boolean;
		type?: 'button' | 'submit';
	}>) => (
		<button
			type={type === 'submit' ? 'submit' : 'button'}
			onClick={onClick}
			disabled={isDisable}>
			{children}
		</button>
	),
}));
vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({
		children,
		onClick,
		permission,
	}: PropsWithChildren<{ onClick?: () => void; permission?: string }>) =>
		permission && permissions.granted.has(permission) ? (
			<button type='button' onClick={onClick}>
				{children}
			</button>
		) : null,
}));

const baseBatch = { id: 46, notes: null } as IBatch;

const renderCard = (batch: IBatch) =>
	render(
		<Provider store={configureStore({ reducer: { noop: (state: null = null) => state } })}>
			<BatchNotesCard batch={batch} />
		</Provider>,
	);

describe('BatchNotesCard', () => {
	beforeEach(() => {
		updateRequest.mockReset();
		permissions.granted = new Set(['edit-technical-reviews-batches']);
	});

	it('muestra el campo aunque el lote no tenga notas y permite agregarlas', async () => {
		updateRequest.mockResolvedValue({ ...baseBatch, notes: 'Revisar cargadores' });
		renderCard(baseBatch);

		expect(screen.getByText('Este lote no tiene notas.')).toBeTruthy();
		fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
		fireEvent.change(screen.getByLabelText('Notas del lote'), {
			target: { value: 'Revisar cargadores' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

		await waitFor(() => expect(updateRequest).toHaveBeenCalledTimes(1));
		expect(updateRequest).toHaveBeenCalledWith({
			subsidiaryId: 9,
			batchId: 46,
			data: { notes: 'Revisar cargadores' },
		});
	});

	it('vaciar el campo envía notes: null', async () => {
		updateRequest.mockResolvedValue(baseBatch);
		renderCard({ ...baseBatch, notes: 'Nota previa' });

		fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
		fireEvent.change(screen.getByLabelText('Notas del lote'), { target: { value: '   ' } });
		fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

		await waitFor(() =>
			expect(updateRequest).toHaveBeenCalledWith(
				expect.objectContaining({ data: { notes: null } }),
			),
		);
	});

	it('bloquea el guardado sobre 1000 caracteres', () => {
		renderCard(baseBatch);

		fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
		fireEvent.change(screen.getByLabelText('Notas del lote'), {
			target: { value: 'a'.repeat(1001) },
		});

		expect(screen.getByText('1001/1000')).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Guardar' }).hasAttribute('disabled')).toBe(true);
	});

	it('muestra en el campo el error que devuelve el backend', async () => {
		updateRequest.mockRejectedValue(
			new Error('El campo notas no debe superar 1000 caracteres'),
		);
		renderCard(baseBatch);

		fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
		fireEvent.change(screen.getByLabelText('Notas del lote'), { target: { value: 'x' } });
		fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

		expect(await screen.findByText(/no debe superar 1000 caracteres/)).toBeTruthy();
	});

	it('sin permiso de edición muestra las notas pero no la acción', () => {
		permissions.granted = new Set();
		renderCard({ ...baseBatch, notes: 'Sólo lectura' });

		expect(screen.getByText('Sólo lectura')).toBeTruthy();
		expect(screen.queryByRole('button', { name: /Editar|Agregar/ })).toBeNull();
	});
});
