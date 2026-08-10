import React from 'react';
import { Formik } from 'formik';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import store from '@/store';
import RegisterDeferredPaymentModal from '../components/modals/RegisterDeferredPaymentModal';
import {
	createDeferredPaymentActionSchema,
	type DeferredPaymentActionFormValues,
} from '../types';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));

const initialValues: DeferredPaymentActionFormValues = {
	amount: '',
	paid_at: '2026-08-10',
	method: 'transfer',
	receipt: null,
};

describe('RegisterDeferredPaymentModal', () => {
	beforeEach(() => {
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
	});

	afterEach(() => {
		document.getElementById('portal-root')?.remove();
	});

	it('destaca transferencia y tarjetas, y mantiene depósito entre los otros medios', async () => {
		render(
			<Provider store={store}>
				<Formik
					initialValues={initialValues}
					validationSchema={createDeferredPaymentActionSchema(100000)}
					onSubmit={vi.fn()}>
					{(formik) => (
						<RegisterDeferredPaymentModal
							isOpen
							setIsOpen={vi.fn()}
							formik={formik}
							busy={false}
							error={null}
						/>
					)}
				</Formik>
			</Provider>,
		);

		const methodSelect = (await screen.findByLabelText('Método')) as HTMLSelectElement;
		expect(Array.from(methodSelect.options, (option) => option.value)).toEqual([
			'transfer',
			'bank_card',
			'deposit',
			'check',
			'cash',
			'other',
		]);
		expect(methodSelect.options[1]).toHaveTextContent('Tarjetas bancarias');
		expect(methodSelect.options[2].parentElement).toHaveAttribute(
			'label',
			'Otros medios de pago',
		);

		await act(async () => {
			fireEvent.change(methodSelect, { target: { value: 'deposit' } });
			await Promise.resolve();
		});
		expect(methodSelect).toHaveValue('deposit');
	});
});
