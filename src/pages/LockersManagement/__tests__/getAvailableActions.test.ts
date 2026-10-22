import { describe, expect, it } from 'vitest';
import { TLockerStatus } from '@/interface/lockers.interface';
import { getAvailableActions, TLockerRowAction } from '../types';

// Cada acción ofrecida debe ser una que `LockerService` del backend acepte en ese estado.
const cases: Array<[TLockerStatus, TLockerRowAction[]]> = [
	['occupied', ['withdraw', 'detail']],
	['available', ['dropoff', 'detail']],
	['ready_for_pickup', ['detail']],
	['quarantine', ['reset', 'detail']],
];

describe('getAvailableActions', () => {
	it.each(cases)('en %s ofrece %j', (status, expected) => {
		expect(getAvailableActions(status)).toEqual(expected);
	});
});
