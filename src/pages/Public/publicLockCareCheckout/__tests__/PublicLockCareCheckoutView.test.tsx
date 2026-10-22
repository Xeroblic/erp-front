import React from 'react';
import { screen } from '@testing-library/react';
import { FormikProps } from 'formik';
import { describe, expect, it, vi } from 'vitest';
import { buildAuthState, renderWithStore } from '@/test-utils/renderWithStore';
import { buildOrder } from '@/test-utils/lockerFixtures';
import { ICheckOutResponse } from '@/interface/lockers.interface';
import { PublicLockCareCheckoutView } from '../PublicLockCareCheckoutView';
import { ICheckOutForm } from '../types';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));
vi.mock('@/components/layouts/PageWrapper/PageWrapper', () => ({
	default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const formik = {
	values: { withdrawal_keyword: '' },
	touched: {},
	errors: {},
	handleSubmit: vi.fn(),
	handleChange: vi.fn(),
	handleBlur: vi.fn(),
} as unknown as FormikProps<ICheckOutForm>;

const renderView = (props: { hasToken: boolean; checkoutResult: ICheckOutResponse | null }) =>
	renderWithStore(
		<PublicLockCareCheckoutView
			formik={formik}
			isSubmittingCheckOut={false}
			isBlocked={false}
			hasToken={props.hasToken}
			checkoutResult={props.checkoutResult}
		/>,
		buildAuthState(),
	);

describe('PublicLockCareCheckoutView', () => {
	it('sin token pide escanear el QR y no muestra el campo de palabra clave', () => {
		renderView({ hasToken: false, checkoutResult: null });

		expect(screen.getByText('Escanea el QR del casillero')).toBeInTheDocument();
		expect(screen.queryByLabelText(/Palabra Clave/i)).not.toBeInTheDocument();
	});

	it('con token pide la palabra clave', () => {
		renderView({ hasToken: true, checkoutResult: null });

		expect(screen.getByLabelText(/Palabra Clave/i)).toBeInTheDocument();
	});

	it('tras validar la clave muestra el número y el PIN del casillero', () => {
		renderView({
			hasToken: true,
			checkoutResult: {
				message: 'Retiro autorizado.',
				data: buildOrder({ logistics_status: 'checked_out' }),
				locker_number: '12',
				locker_pin: '4821',
			},
		});

		expect(screen.getAllByText('12').length).toBeGreaterThan(0);
		expect(screen.getAllByText('4821').length).toBeGreaterThan(0);
		expect(screen.queryByLabelText(/Palabra Clave/i)).not.toBeInTheDocument();
	});
});
