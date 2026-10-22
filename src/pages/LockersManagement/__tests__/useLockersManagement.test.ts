import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { buildLocation, buildLocker, buildOrder } from '@/test-utils/lockerFixtures';
import { useLockersManagement } from '../hooks/useLockersManagement';

const api = vi.hoisted(() => ({
	getLocations: vi.fn(),
	getLockersByLocation: vi.fn(),
	getPrivateInfo: vi.fn(),
	getServiceOrders: vi.fn(),
	techWithdraw: vi.fn(),
	techDropOff: vi.fn(),
	resetLocker: vi.fn(),
}));
const toastSpy = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));

vi.mock('@/services/lockers/lockersInternalService', () => ({ default: api }));
vi.mock('react-toastify', () => ({ toast: toastSpy }));

const renderLoaded = async () => {
	const hook = renderHook(() => useLockersManagement());
	await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
	return hook;
};

describe('useLockersManagement', () => {
	beforeEach(() => {
		Object.values(api).forEach((fn) => fn.mockReset());
		Object.values(toastSpy).forEach((fn) => fn.mockReset());
		api.getLocations.mockResolvedValue([buildLocation()]);
		api.getLockersByLocation.mockResolvedValue([]);
		api.getServiceOrders.mockResolvedValue([]);
	});

	describe('handleScanQR', () => {
		it('un casillero ocupado abre el retiro con su orden activa', async () => {
			const order = buildOrder({ id: 42 });
			api.getPrivateInfo.mockResolvedValue(
				buildLocker('occupied', { id: 5, active_service_order: order }),
			);
			const { result } = await renderLoaded();

			await act(async () => {
				await result.current.handleScanQR('qr-5');
			});

			expect(result.current.actionType).toBe('withdraw');
			expect(result.current.selectedLocker?.id).toBe(5);
			expect(result.current.selectedOrderId).toBe(42);
		});

		it('un casillero disponible abre el depósito', async () => {
			api.getPrivateInfo.mockResolvedValue(buildLocker('available', { id: 6 }));
			const { result } = await renderLoaded();

			await act(async () => {
				await result.current.handleScanQR('qr-6');
			});

			expect(result.current.actionType).toBe('dropoff');
			expect(result.current.selectedLocker?.id).toBe(6);
		});

		it('un casillero en cuarentena abre el reset', async () => {
			api.getPrivateInfo.mockResolvedValue(buildLocker('quarantine', { id: 8 }));
			const { result } = await renderLoaded();

			await act(async () => {
				await result.current.handleScanQR('qr-8');
			});

			expect(result.current.actionType).toBe('reset');
		});

		it('un casillero listo para retiro no abre ninguna acción del técnico', async () => {
			api.getPrivateInfo.mockResolvedValue(buildLocker('ready_for_pickup', { number: '12' }));
			const { result } = await renderLoaded();

			let scanned: boolean | undefined;
			await act(async () => {
				scanned = await result.current.handleScanQR('qr-12');
			});

			expect(scanned).toBe(true);
			expect(result.current.actionType).toBeNull();
			expect(toastSpy.info).toHaveBeenCalledWith(expect.stringContaining('Nº 12'));
		});

		it('un QR que el backend rechaza no abre acciones y avisa el error', async () => {
			api.getPrivateInfo.mockRejectedValue({
				isAxiosError: true,
				response: { status: 403, data: { message: 'This action is unauthorized.' } },
			});
			const { result } = await renderLoaded();

			let scanned: boolean | undefined;
			await act(async () => {
				scanned = await result.current.handleScanQR('qr-ajeno');
			});

			expect(scanned).toBe(false);
			expect(result.current.actionType).toBeNull();
			expect(toastSpy.error).toHaveBeenCalledTimes(1);
		});
	});

	describe('acciones del técnico', () => {
		const openWithdraw = async () => {
			const hook = await renderLoaded();
			act(() => {
				hook.result.current.openAction(buildLocker('occupied', { id: 5 }), 'withdraw', 42);
			});
			return hook;
		};

		it('el retiro muestra el PIN nuevo que devolvió el backend y cierra la acción', async () => {
			api.techWithdraw.mockResolvedValue({
				message: 'Equipo retirado exitosamente.',
				data: buildOrder({ id: 42, logistics_status: 'in_progress' }),
				new_locker_pin: '7310',
			});
			const { result } = await openWithdraw();

			await act(async () => {
				await result.current.handleWithdraw(42);
			});

			expect(api.techWithdraw).toHaveBeenCalledWith({ service_order_id: 42 });
			expect(result.current.successPin).toBe('7310');
			expect(result.current.actionType).toBeNull();
		});

		it('si el backend no envía PIN avisa con un mensaje y no abre el modal del PIN', async () => {
			api.techWithdraw.mockResolvedValue({
				message: 'Equipo retirado exitosamente.',
				data: buildOrder({ id: 42, logistics_status: 'in_progress' }),
				new_locker_pin: null,
			});
			const { result } = await openWithdraw();

			await act(async () => {
				await result.current.handleWithdraw(42);
			});

			expect(result.current.successPin).toBeNull();
			expect(toastSpy.success).toHaveBeenCalledTimes(1);
		});

		it('un retiro rechazado deja la acción abierta para reintentar', async () => {
			api.techWithdraw.mockRejectedValue({
				isAxiosError: true,
				response: {
					status: 400,
					data: { message: 'Solo se pueden retirar órdenes en estado "checked_in".' },
				},
			});
			const { result } = await openWithdraw();

			await act(async () => {
				await result.current.handleWithdraw(42);
			});

			expect(result.current.actionType).toBe('withdraw');
			expect(toastSpy.error).toHaveBeenCalledWith(
				'Solo se pueden retirar órdenes en estado "checked_in".',
			);
		});

		it('el depósito envía el casillero y la orden, y recarga casilleros y órdenes', async () => {
			api.techDropOff.mockResolvedValue({
				message: 'Equipo entregado.',
				data: buildOrder({ id: 42, logistics_status: 'ready_for_pickup' }),
				new_locker_pin: '1188',
			});
			const { result } = await renderLoaded();
			api.getLockersByLocation.mockClear();
			api.getServiceOrders.mockClear();

			await act(async () => {
				await result.current.handleDropOff(9, 42);
			});

			expect(api.techDropOff).toHaveBeenCalledWith({ locker_id: 9, service_order_id: 42 });
			expect(api.getLockersByLocation).toHaveBeenCalledWith(10);
			expect(api.getServiceOrders).toHaveBeenCalledTimes(1);
			expect(result.current.successPin).toBe('1188');
		});

		it('el reset envía el casillero y muestra su PIN nuevo', async () => {
			api.resetLocker.mockResolvedValue({
				message: 'Casillero reseteado y disponible.',
				data: buildLocker('available', { id: 3 }),
				new_locker_pin: '5502',
			});
			const { result } = await renderLoaded();

			await act(async () => {
				await result.current.handleReset(3);
			});

			expect(api.resetLocker).toHaveBeenCalledWith({ locker_id: 3 });
			expect(result.current.successPin).toBe('5502');
		});
	});

	it('expone la filial de la ubicación activa para los permisos', async () => {
		const { result } = await renderLoaded();

		expect(result.current.selectedLocationId).toBe(10);
		expect(result.current.selectedSubsidiaryId).toBe(3);
	});
});
