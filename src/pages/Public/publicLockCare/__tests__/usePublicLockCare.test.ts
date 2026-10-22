import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { TicketFormValues } from '@/pages/Public/formLockCleare/components/FormLockCare.types';
import { buildLocker, buildOrder } from '@/test-utils/lockerFixtures';
import { usePublicLockCare } from '../hooks/usePublicLockCare';

const params: { token?: string } = { token: 'qr-abc' };
const api = vi.hoisted(() => ({
	getLockerInfo: vi.fn(),
	checkInLocker: vi.fn(),
	checkOutLocker: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useParams: () => params }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/services/lockers/lockersPublicService', () => ({ default: api }));

const completeForm: TicketFormValues = {
	name: 'Ana Pérez',
	email: 'ana@correo.cl',
	phone: '+56911112222',
	termsAccepted: true,
	requiresInvoice: 'no',
	invoiceRut: '',
	invoiceBusinessName: '',
	invoiceAddress: '',
	serviceType: 'reparacion',
	repairBrand: 'Lenovo',
	repairModel: 'ThinkPad T14',
	repairSerialNumber: '',
	repairIncludesCharger: 'si',
	upgradeType: '',
	upgradeBrand: '',
	upgradeModel: '',
	upgradeSerialNumber: '',
	notes: '',
	message: 'No enciende',
	attachments: [],
};

const renderLoaded = async () => {
	const hook = renderHook(() => usePublicLockCare());
	await waitFor(() => expect(hook.result.current.isLoadingInfo).toBe(false));
	return hook;
};

describe('usePublicLockCare', () => {
	beforeEach(() => {
		Object.values(api).forEach((fn) => fn.mockReset());
		params.token = 'qr-abc';
	});

	it('un casillero libre no ofrece retiro ni sugerencias', async () => {
		api.getLockerInfo.mockResolvedValue({
			is_available: true,
			message: 'El casillero está disponible.',
		});
		const { result } = await renderLoaded();

		expect(result.current.infoError).toBeNull();
		expect(result.current.checkOutPath).toBeNull();
		expect(result.current.suggestedLockers).toEqual([]);
	});

	it('un casillero no disponible ofrece el retiro con su propio token y los libres', async () => {
		api.getLockerInfo.mockResolvedValue({
			is_available: false,
			message:
				'Este casillero está ocupado. Te mostramos otros disponibles en esta ubicación.',
			available_lockers: ['2', '5'],
			available_lockers_count: 2,
		});
		const { result } = await renderLoaded();

		expect(result.current.checkOutPath).toBe('/lockers/qr-abc/check-out');
		expect(result.current.suggestedLockers).toEqual(['2', '5']);
	});

	it('muestra el mensaje del backend sin alterarlo', async () => {
		api.getLockerInfo.mockResolvedValue({
			is_available: false,
			message:
				'Este casillero está ocupado. Te mostramos otros disponibles en esta ubicación.',
			available_lockers: ['2'],
			available_lockers_count: 1,
		});
		const { result } = await renderLoaded();

		expect(result.current.infoError).toBe(
			'Este casillero está ocupado. Te mostramos otros disponibles en esta ubicación.',
		);
	});

	it('codifica el token al armar la ruta de retiro', async () => {
		params.token = 'qr/a b';
		api.getLockerInfo.mockResolvedValue({ is_available: false, message: 'Ocupado.' });
		const { result } = await renderLoaded();

		expect(result.current.checkOutPath).toBe('/lockers/qr%2Fa%20b/check-out');
	});

	it('un QR inexistente muestra el error y no ofrece retiro', async () => {
		api.getLockerInfo.mockRejectedValue({
			isAxiosError: true,
			response: {
				status: 404,
				data: { is_available: false, message: 'Casillero no encontrado.' },
			},
		});
		const { result } = await renderLoaded();

		expect(result.current.infoError).toBe('Casillero no encontrado.');
		expect(result.current.checkOutPath).toBeNull();
	});

	it('sin token no consulta el backend', async () => {
		params.token = undefined;
		const { result } = await renderLoaded();

		expect(api.getLockerInfo).not.toHaveBeenCalled();
		expect(result.current.infoError).not.toBeNull();
	});

	it('tras el ingreso muestra el PIN y el número que devolvió el backend', async () => {
		api.getLockerInfo.mockResolvedValue({ is_available: true, message: 'Disponible.' });
		api.checkInLocker.mockResolvedValue({
			message: 'Equipo registrado exitosamente.',
			data: buildOrder({ locker: buildLocker('occupied', { number: '4' }) }),
			locker_pin: '4821',
		});
		const { result } = await renderLoaded();

		await act(async () => {
			await result.current.formik.setValues(completeForm, false);
		});
		await act(async () => {
			await result.current.formik.submitForm();
		});

		expect(api.checkInLocker).toHaveBeenCalledWith(
			expect.objectContaining({ qr_token: 'qr-abc' }),
		);
		expect(result.current.pinReceived).toBe('4821');
		expect(result.current.lockerNumberReceived).toBe('4');
		expect(result.current.isPinModalOpen).toBe(true);
	});
});
