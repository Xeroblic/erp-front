import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildAuthState, renderWithStore } from '@/test-utils/renderWithStore';
import { buildLocation, buildLocker } from '@/test-utils/lockerFixtures';
import LockersDashboardTab from '../components/LockersDashboardTab';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));

const countFor = (label: string) =>
	screen.getByText(label, { selector: 'p' }).nextElementSibling?.textContent;

describe('LockersDashboardTab — resumen', () => {
	it('cuenta los casilleros de la ubicación por estado', () => {
		renderWithStore(
			<LockersDashboardTab
				locations={[buildLocation()]}
				selectedLocationId={10}
				lockers={[
					buildLocker('available', { id: 1 }),
					buildLocker('available', { id: 2 }),
					buildLocker('occupied', { id: 3 }),
					buildLocker('quarantine', { id: 4 }),
				]}
				serviceOrders={[]}
				isLoading={false}
				error={null}
				changeLocation={vi.fn()}
				fetchLockers={vi.fn()}
				openAction={vi.fn()}
				subsidiaryId={3}
				setDetailLocker={vi.fn()}
				setIsScanning={vi.fn()}
			/>,
			buildAuthState({ permisos: ['view-locker'] }),
		);

		expect(countFor('Disponible')).toBe('2');
		expect(countFor('Ocupado')).toBe('1');
		expect(countFor('Listo para retiro')).toBe('0');
		expect(countFor('En cuarentena')).toBe('1');
	});
});
