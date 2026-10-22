import { describe, expect, it } from 'vitest';
import { ILockerInternal } from '@/interface/lockers.interface';
import { resolveActionCommand } from '../types';

const locker = (id: number, status: ILockerInternal['status']): ILockerInternal => ({
	id,
	location_id: 1,
	number: String(id),
	qr_token: `qr-${id}`,
	status,
	status_label: status,
	active_service_order: null,
});

const opened = locker(1, 'available');
const chosen = locker(2, 'available');

describe('resolveActionCommand', () => {
	it('deposita en el casillero elegido en el modal, no en el que abrió la acción', () => {
		expect(
			resolveActionCommand('dropoff', { orderId: 7, actionLocker: chosen }, opened),
		).toEqual({ kind: 'dropoff', lockerId: 2, orderId: 7 });
	});

	it('deposita en el casillero que abrió la acción si el modal no eligió otro', () => {
		expect(resolveActionCommand('dropoff', { orderId: 7, actionLocker: null }, opened)).toEqual(
			{ kind: 'dropoff', lockerId: 1, orderId: 7 },
		);
	});

	it('no deposita sin orden de servicio', () => {
		expect(
			resolveActionCommand('dropoff', { orderId: null, actionLocker: chosen }, opened),
		).toBeNull();
	});

	it('retira por la orden, sin casillero', () => {
		expect(
			resolveActionCommand(
				'withdraw',
				{ orderId: 9, actionLocker: locker(3, 'occupied') },
				null,
			),
		).toEqual({ kind: 'withdraw', orderId: 9 });
	});

	it('no retira sin orden de servicio', () => {
		expect(
			resolveActionCommand(
				'withdraw',
				{ orderId: null, actionLocker: locker(3, 'occupied') },
				null,
			),
		).toBeNull();
	});

	it('resetea el casillero del modal', () => {
		expect(
			resolveActionCommand(
				'reset',
				{ orderId: null, actionLocker: locker(4, 'quarantine') },
				null,
			),
		).toEqual({ kind: 'reset', lockerId: 4 });
	});

	it('no hace nada sin acción ni casillero', () => {
		expect(resolveActionCommand(null, { orderId: 7, actionLocker: chosen }, opened)).toBeNull();
		expect(
			resolveActionCommand('reset', { orderId: null, actionLocker: null }, null),
		).toBeNull();
	});
});
