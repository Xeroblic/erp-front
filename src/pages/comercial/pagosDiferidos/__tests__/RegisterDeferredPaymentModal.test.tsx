import React from 'react';
import { Formik } from 'formik';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import store from '@/store';
import RegisterDeferredPaymentModal from '../components/modals/RegisterDeferredPaymentModal';
import { syncSingleFileInput } from '../hooks/useAttachmentsFileDrop';
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

const dragFile = () => {
	fireEvent.dragEnter(window, { dataTransfer: { types: ['Files'] } });
};

const dropFile = (file: File) => {
	const dataTransfer = { files: [file], types: ['Files'], dropEffect: 'none' };
	fireEvent.drop(window, { dataTransfer });
};

describe('RegisterDeferredPaymentModal', () => {
	beforeEach(() => {
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
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

	it('acepta un comprobante soltado y conserva el input tradicional', async () => {
		const onSubmit = vi.fn();
		render(
			<Provider store={store}>
				<Formik
					initialValues={initialValues}
					validationSchema={createDeferredPaymentActionSchema(100000)}
					onSubmit={onSubmit}>
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

		const file = new File(['comprobante'], 'abono.pdf', { type: 'application/pdf' });
		dragFile();
		expect(await screen.findByTestId('attachments-drop-overlay')).toBeInTheDocument();
		dropFile(file);

		await act(async () => {
			await Promise.resolve();
		});
		expect(screen.queryByTestId('attachments-drop-overlay')).not.toBeInTheDocument();
		expect(screen.queryByText('Comprobante seleccionado:')).not.toBeInTheDocument();
		expect(screen.getByLabelText('Comprobante (opcional)')).toHaveAttribute(
			'accept',
			'.pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx',
		);

		await act(async () => {
			fireEvent.change(screen.getByLabelText('Monto (CLP)'), {
				target: { value: '10000' },
			});
			fireEvent.submit(document.getElementById('deferred-payment-action-form')!);
		});
		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({ receipt: file }),
			expect.anything(),
		);
	});

	it('sincroniza un único comprobante soltado con el selector nativo', () => {
		const file = new File(['comprobante'], 'abono.pdf', { type: 'application/pdf' });
		const files = {
			0: file,
			length: 1,
			item: (index: number) => (index === 0 ? file : null),
		} as unknown as FileList;
		const addFile = vi.fn();
		class TestDataTransfer {
			items = { add: addFile };
			files = files;
		}
		const input = document.createElement('input');
		input.type = 'file';
		Object.defineProperty(input, 'files', { configurable: true, value: null, writable: true });
		vi.stubGlobal('DataTransfer', TestDataTransfer);

		syncSingleFileInput(input, file);

		expect(addFile).toHaveBeenCalledWith(file);
		expect(input.files).toBe(files);
	});
});
