import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAuthState, renderWithStore } from '@/test-utils/renderWithStore';
import { buildLocker } from '@/test-utils/lockerFixtures';
import LockerActionModal from '../components/modal/LockerActionModal';

const quarantined = buildLocker('quarantine', { id: 3, number: '3' });

const renderResetModal = (permisos: string[], onSubmit = vi.fn()) => {
	renderWithStore(
		<LockerActionModal
			isOpen
			actionType='reset'
			selectedLocker={quarantined}
			serviceOrders={[]}
			lockers={[quarantined]}
			isActionLoading={false}
			subsidiaryId={3}
			onClose={vi.fn()}
			onSubmit={onSubmit}
		/>,
		buildAuthState({ permisos, accessSubsidiaries: [{ id: 3 }] }),
	);
	return onSubmit;
};

describe('LockerActionModal — permisos', () => {
	beforeEach(() => {
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
	});

	afterEach(() => {
		document.getElementById('portal-root')?.remove();
	});

	it('con operate-locker confirma el reset del casillero abierto', () => {
		const onSubmit = renderResetModal(['view-locker', 'operate-locker']);

		fireEvent.click(screen.getByRole('button', { name: 'Resetear' }));

		expect(onSubmit).toHaveBeenCalledWith({ orderId: null, actionLocker: quarantined });
	});

	it('sin operate-locker deja el confirmar visible pero deshabilitado', () => {
		const onSubmit = renderResetModal(['view-locker']);

		const confirm = screen.getByRole('button', { name: 'Resetear' });
		expect(confirm).toBeDisabled();
		fireEvent.click(confirm);
		expect(onSubmit).not.toHaveBeenCalled();
	});
});
