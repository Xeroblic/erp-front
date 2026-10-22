import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildAuthState, renderWithStore } from '@/test-utils/renderWithStore';
import { buildLocker, buildOrder } from '@/test-utils/lockerFixtures';
import ListLockers from '../components/table/ListLockers';

const lockers = [
	buildLocker('occupied', {
		id: 1,
		number: '1',
		active_service_order: buildOrder({ id: 7, locker_id: 1 }),
	}),
	buildLocker('available', { id: 2, number: '2' }),
	buildLocker('quarantine', { id: 3, number: '3' }),
];

const renderList = (auth: Parameters<typeof buildAuthState>[0]) =>
	renderWithStore(
		<ListLockers
			lockers={lockers}
			serviceOrders={[]}
			isLoading={false}
			error={null}
			openAction={vi.fn()}
			subsidiaryId={3}
			setDetailLocker={vi.fn()}
		/>,
		buildAuthState(auth),
	);

const actionButtons = () => ({
	withdraw: screen.queryByRole('button', { name: /Retirar/ }),
	dropoff: screen.queryByRole('button', { name: /Depositar/ }),
	reset: screen.queryByRole('button', { name: /Reset/ }),
});

describe('ListLockers — permisos', () => {
	it('con operate-locker sobre la filial muestra retirar, depositar y resetear', () => {
		renderList({
			permisos: ['view-locker', 'operate-locker'],
			accessSubsidiaries: [{ id: 3 }],
		});

		const buttons = actionButtons();
		expect(buttons.withdraw).toBeInTheDocument();
		expect(buttons.dropoff).toBeInTheDocument();
		expect(buttons.reset).toBeInTheDocument();
	});

	it('sólo con view-locker oculta las acciones y deja el detalle', () => {
		renderList({ permisos: ['view-locker'], accessSubsidiaries: [{ id: 3 }] });

		const buttons = actionButtons();
		expect(buttons.withdraw).not.toBeInTheDocument();
		expect(buttons.dropoff).not.toBeInTheDocument();
		expect(buttons.reset).not.toBeInTheDocument();
		expect(screen.getAllByRole('button', { name: /Detalle/ })).toHaveLength(3);
	});

	it('con operate-locker sobre otra filial oculta las acciones', () => {
		renderList({
			permisos: ['view-locker', 'operate-locker'],
			accessSubsidiaries: [{ id: 99 }],
		});

		expect(actionButtons().withdraw).not.toBeInTheDocument();
	});
});
