import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lockersInternalService } from '@/services/lockers/lockersInternalService';
import { lockersPublicService } from '@/services/lockers/lockersPublicService';

const { fetchData } = vi.hoisted(() => ({ fetchData: vi.fn() }));

vi.mock('@/services/ApiService', () => ({
	default: { fetchData, fetchNormalized: vi.fn() },
}));

const axiosResponse = (data: unknown) => ({ data });

describe('contrato de lockers con el backend', () => {
	beforeEach(() => {
		fetchData.mockReset();
	});

	it('el retiro del cliente envía el qr_token del casillero junto a la palabra clave', async () => {
		fetchData.mockResolvedValue(
			axiosResponse({ message: 'ok', data: {}, locker_number: '3', locker_pin: '4821' }),
		);

		await lockersPublicService.checkOutLocker({
			qr_token: 'qr-abc',
			withdrawal_keyword: 'MANZANA',
		});

		expect(fetchData).toHaveBeenCalledWith({
			url: '/lockers/check-out',
			method: 'POST',
			data: { qr_token: 'qr-abc', withdrawal_keyword: 'MANZANA' },
		});
	});

	it('withdraw conserva new_locker_pin, que el backend envía en la raíz y no dentro de data', async () => {
		fetchData.mockResolvedValue(
			axiosResponse({ message: 'ok', data: { id: 7 }, new_locker_pin: '1234' }),
		);

		const response = await lockersInternalService.techWithdraw({ service_order_id: 7 });

		expect(response.new_locker_pin).toBe('1234');
		expect(response.data).toEqual({ id: 7 });
	});

	it('drop-off envía sólo el casillero y la orden: el PIN lo genera el backend', async () => {
		fetchData.mockResolvedValue(
			axiosResponse({ message: 'ok', data: { id: 7 }, new_locker_pin: '5678' }),
		);

		const response = await lockersInternalService.techDropOff({
			locker_id: 2,
			service_order_id: 7,
		});

		expect(fetchData).toHaveBeenCalledWith({
			url: '/lockers/tech/drop-off',
			method: 'POST',
			data: { locker_id: 2, service_order_id: 7 },
		});
		expect(response.new_locker_pin).toBe('5678');
	});

	it('reset conserva new_locker_pin de la raíz', async () => {
		fetchData.mockResolvedValue(
			axiosResponse({ message: 'ok', data: { id: 2 }, new_locker_pin: '9012' }),
		);

		const response = await lockersInternalService.resetLocker({ locker_id: 2 });

		expect(response.new_locker_pin).toBe('9012');
	});
});
