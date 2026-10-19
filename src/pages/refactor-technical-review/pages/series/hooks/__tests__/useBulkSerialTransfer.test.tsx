import type { PropsWithChildren } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useBulkSerialTransfer from '@/pages/refactor-technical-review/pages/series/hooks/useBulkSerialTransfer';

const { fetchData, toastError, toastSuccess } = vi.hoisted(() => ({
	fetchData: vi.fn(),
	toastError: vi.fn(),
	toastSuccess: vi.fn(),
}));

vi.mock('@/services/ApiService', () => ({ default: { fetchData } }));
vi.mock('react-toastify', () => ({ toast: { error: toastError, success: toastSuccess } }));
vi.mock('@/store', async () => {
	const redux = await import('react-redux');
	return { useAppSelector: redux.useSelector };
});

/**
 * Perfil normalizado: Norte sólo figura en `visible` (su acceso llega por un rol que el
 * perfil no publica en `access`); Ajena es de otra filial.
 */
const auth = createSlice({
	name: 'auth',
	initialState: {
		user: {
			id: 1,
			access: {
				subsidiaries: [],
				branches: [
					{ id: 5, name: 'Sucursal Centro', subsidiary: { id: 2, name: 'Filial' } },
					{ id: 8, name: 'Sucursal Sur', subsidiary: { id: 2, name: 'Filial' } },
				],
			},
			visible: {
				subsidiaries: [],
				branches: [
					{ id: 5, name: 'Sucursal Centro', subsidiary: { id: 2, name: 'Filial' } },
					{ id: 6, name: 'Sucursal Norte', subsidiary: { id: 2, name: 'Filial' } },
					{ id: 9, name: 'Sucursal Ajena', subsidiary: { id: 3, name: 'Otra filial' } },
				],
			},
		},
	},
	reducers: {},
});

const axiosRejection = (status: number, data: Record<string, unknown>) =>
	Object.assign(new Error(`Request failed with status code ${status}`), {
		response: { status, data },
	});

const renderTransfer = (onTransferred = vi.fn()) => {
	const store = configureStore({ reducer: { auth: auth.reducer } });
	const wrapper = ({ children }: PropsWithChildren) => (
		<Provider store={store}>{children}</Provider>
	);
	return renderHook(
		() => useBulkSerialTransfer({ fromBranchId: 5, fallbackSubsidiaryId: null, onTransferred }),
		{ wrapper },
	);
};

afterEach(() => {
	fetchData.mockReset();
	toastError.mockReset();
	toastSuccess.mockReset();
	vi.restoreAllMocks();
});

describe('useBulkSerialTransfer', () => {
	it('ofrece las sucursales del usuario en la filial sin filtrarlas por access', () => {
		const { result } = renderTransfer();

		// Sin la de origen ni la de otra filial; Norte aparece aunque no esté en `access`.
		expect(result.current.destinationBranchOptions).toEqual([
			{ value: '6', label: 'Sucursal Norte' },
			{ value: '8', label: 'Sucursal Sur' },
		]);
	});

	it('explica el 403 nombrando la sucursal de origen y la de destino, sin reintentar', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		fetchData.mockRejectedValue(
			axiosRejection(403, { message: 'No tienes permiso para realizar esta acción.' }),
		);
		const onTransferred = vi.fn();
		const { result } = renderTransfer(onTransferred);

		await act(() => result.current.bulkTransferStock(['SN-1', 'SN-2'], 6));

		expect(fetchData).toHaveBeenCalledTimes(1);
		expect(fetchData).toHaveBeenCalledWith({
			url: '/subsidiaries/2/bulk-transfer-stock',
			method: 'post',
			data: { from_branch_id: 5, to_branch_id: 6, serial_numbers: ['SN-1', 'SN-2'] },
		});
		expect(toastError).toHaveBeenCalledWith(
			'No tienes permiso para trasladar estas series: necesitas acceso a la sucursal de origen (Sucursal Centro) y a la de destino (Sucursal Norte).',
		);
		expect(onTransferred).not.toHaveBeenCalled();
	});

	it('cualquier otro rechazo sigue mostrando el aviso de siempre', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		fetchData.mockRejectedValue(
			axiosRejection(422, { message: 'La sucursal destino debe ser diferente.' }),
		);
		const { result } = renderTransfer();

		await act(() => result.current.bulkTransferStock(['SN-1'], 6));

		expect(toastError).toHaveBeenCalledWith('Error al transferir stock');
	});

	it('tras un traslado exitoso avisa y recarga el listado', async () => {
		fetchData.mockResolvedValue({ data: {} });
		const onTransferred = vi.fn();
		const { result } = renderTransfer(onTransferred);

		await act(() => result.current.bulkTransferStock(['SN-1'], 6));

		expect(toastSuccess).toHaveBeenCalledWith('Stock transferido exitosamente');
		expect(onTransferred).toHaveBeenCalledTimes(1);
	});
});
