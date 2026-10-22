import { describe, expect, it } from 'vitest';
import { buildLocker, buildOrder } from '@/test-utils/lockerFixtures';
import { getDropoffLockers, getEligibleOrders } from '../types';

const checkedIn = buildOrder({ id: 1, locker_id: 5, logistics_status: 'checked_in' });
const otherCheckedIn = buildOrder({ id: 2, locker_id: 6, logistics_status: 'checked_in' });
const inProgress = buildOrder({ id: 3, locker_id: 5, logistics_status: 'in_progress' });
const ready = buildOrder({ id: 4, locker_id: 7, logistics_status: 'ready_for_pickup' });
const orders = [checkedIn, otherCheckedIn, inProgress, ready];

const ids = (list: Array<{ id: number }>) => list.map((item) => item.id);

describe('getEligibleOrders', () => {
	it('al depositar ofrece sólo las órdenes que el técnico ya retiró', () => {
		expect(ids(getEligibleOrders('dropoff', null, orders))).toEqual([3]);
	});

	it('al retirar ofrece la orden activa del casillero', () => {
		const locker = buildLocker('occupied', { id: 5, active_service_order: checkedIn });

		expect(ids(getEligibleOrders('withdraw', locker, orders))).toEqual([1]);
	});

	it('al retirar sin orden activa busca las registradas en ese casillero', () => {
		const locker = buildLocker('occupied', { id: 5, active_service_order: null });

		expect(ids(getEligibleOrders('withdraw', locker, orders))).toEqual([1]);
	});

	it('el reset no usa órdenes', () => {
		const locker = buildLocker('quarantine', { id: 5 });

		expect(getEligibleOrders('reset', locker, orders)).toEqual([]);
	});
});

describe('getDropoffLockers', () => {
	it('ofrece los disponibles y conserva el que abrió la acción', () => {
		const lockers = [
			buildLocker('available', { id: 1 }),
			buildLocker('occupied', { id: 2 }),
			buildLocker('quarantine', { id: 3 }),
			buildLocker('ready_for_pickup', { id: 4 }),
			buildLocker('available', { id: 5 }),
		];

		expect(ids(getDropoffLockers(lockers, 2))).toEqual([1, 2, 5]);
	});

	it('sin casillero abierto ofrece sólo los disponibles', () => {
		const lockers = [buildLocker('available', { id: 1 }), buildLocker('occupied', { id: 2 })];

		expect(ids(getDropoffLockers(lockers, null))).toEqual([1]);
	});
});
