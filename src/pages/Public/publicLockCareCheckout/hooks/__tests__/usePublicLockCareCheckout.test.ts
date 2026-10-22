import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePublicLockCareCheckout } from '../usePublicLockCareCheckout';

const params: { token?: string } = { token: 'qr-abc' };

vi.mock('react-router-dom', () => ({ useParams: () => params }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const { checkOutLocker } = vi.hoisted(() => ({ checkOutLocker: vi.fn() }));

vi.mock('@/services/lockers/lockersPublicService', () => ({
	default: { checkOutLocker },
}));

const submitKeyword = async (
	result: { current: ReturnType<typeof usePublicLockCareCheckout> },
	keyword: string,
) => {
	await act(async () => {
		await result.current.formik.setFieldValue('withdrawal_keyword', keyword);
	});
	await act(async () => {
		await result.current.formik.submitForm();
	});
};

describe('usePublicLockCareCheckout', () => {
	beforeEach(() => {
		checkOutLocker.mockReset();
		params.token = 'qr-abc';
	});

	it('envía el token del QR escaneado junto a la palabra clave', async () => {
		checkOutLocker.mockResolvedValue({
			message: 'ok',
			data: {},
			locker_number: '3',
			locker_pin: '4821',
		});
		const { result } = renderHook(() => usePublicLockCareCheckout());

		await submitKeyword(result, 'MANZANA');

		expect(checkOutLocker).toHaveBeenCalledWith({
			qr_token: 'qr-abc',
			withdrawal_keyword: 'MANZANA',
		});
		expect(result.current.checkoutResult?.locker_pin).toBe('4821');
	});

	it('marca el bloqueo cuando el backend responde 429', async () => {
		checkOutLocker.mockRejectedValue({
			isAxiosError: true,
			response: { status: 429, data: { message: 'Too Many Attempts.' } },
		});
		const { result } = renderHook(() => usePublicLockCareCheckout());

		await submitKeyword(result, 'MANZANA');

		expect(result.current.isBlocked).toBe(true);
	});

	it('sin token en la URL no llama al backend', async () => {
		params.token = undefined;
		const { result } = renderHook(() => usePublicLockCareCheckout());

		await submitKeyword(result, 'MANZANA');

		expect(result.current.hasToken).toBe(false);
		expect(checkOutLocker).not.toHaveBeenCalled();
	});
});
