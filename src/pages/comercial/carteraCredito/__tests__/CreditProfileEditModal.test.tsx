import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
	IDeferredPaymentCreditProfile,
	IDeferredPaymentCreditProfileListItem,
} from '@/interface/deferredPayments.interface';
// eslint-disable-next-line import/extensions
import deferredPaymentsService from '@/services/deferredPaymentsService';
import CreditProfileEditModal from '../components/CreditProfileEditModal';

vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@/services/deferredPaymentsService', () => ({
	default: { getCreditProfile: vi.fn(), updateCreditProfile: vi.fn(), deleteCreditProfile: vi.fn() },
}));
vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
		isOpen ? <div>{children}</div> : null,
	ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalHeader: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));
vi.mock('@/components/ui/Alert', () => ({
	default: ({ children }: { children: React.ReactNode }) => <div role='alert'>{children}</div>,
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({
		children,
		isDisable,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isDisable?: boolean }) => (
		<button {...props} type='button' disabled={isDisable}>
			{children}
		</button>
	),
}));
vi.mock('@/components/ui/ProtectedButton', () => ({
	default: ({
		children,
		isDisable,
		isLoading,
		branchId: _branchId,
		subsidiaryId: _subsidiaryId,
		permission: _permission,
		scope: _scope,
		...props
	}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
		isDisable?: boolean;
		isLoading?: boolean;
		branchId?: number | null;
		subsidiaryId?: number | null;
		permission?: string;
		scope?: string;
	}) => (
		<button {...props} type='button' disabled={isDisable}>
			{isLoading ? 'Guardando' : children}
		</button>
	),
}));
vi.mock('@/components/form/Input', () => ({
	default: ({
		isTouched: _isTouched,
		isValid: _isValid,
		invalidFeedback,
		...props
	}: React.InputHTMLAttributes<HTMLInputElement> & {
		isTouched?: boolean;
		isValid?: boolean;
		invalidFeedback?: string;
	}) => (
		<label>
			<input {...props} />
			{invalidFeedback}
		</label>
	),
}));
vi.mock('@/components/form/Textarea', () => ({
	default: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));
vi.mock('@/components/form/Label', () => ({
	default: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
		<label {...props}>{children}</label>
	),
}));
const listProfile: IDeferredPaymentCreditProfileListItem = {
	id: 7,
	customer_sale_id: 8,
	is_active: true,
	payment_term_days: 30,
	credit_limit: '500000.00',
	notes: null,
	outstanding_balance: '0.00',
	available_credit: '500000.00',
	credit_limit_exceeded: false,
	customer: null,
	created_at: null,
	updated_at: null,
};

const detailProfile: IDeferredPaymentCreditProfile = {
	id: 7,
	customer_sale_id: 8,
	is_active: true,
	payment_term_days: 30,
	credit_limit: '500000.00',
	collection_email: 'cobranza@cliente.cl',
	notes: null,
};

const createDeferred = <T,>() => {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
};

describe('CreditProfileEditModal', () => {
	const getCreditProfileMock = vi.mocked(deferredPaymentsService.getCreditProfile);
	const updateCreditProfileMock = vi.mocked(deferredPaymentsService.updateCreditProfile);
	const deleteCreditProfileMock = vi.mocked(deferredPaymentsService.deleteCreditProfile);
	const onClose = vi.fn();
	const onSaved = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		getCreditProfileMock.mockResolvedValue(detailProfile);
		updateCreditProfileMock.mockResolvedValue(detailProfile);
		deleteCreditProfileMock.mockResolvedValue(undefined);
	});

	it('carga el perfil individual y normaliza un correo vacío al guardar', async () => {
		render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		expect(screen.getByLabelText('Cargando condiciones de crédito')).toBeInTheDocument();
		const collectionEmail = await screen.findByLabelText('Correo de cobranza');
		expect(getCreditProfileMock).toHaveBeenCalledWith(4, 8, expect.any(AbortSignal));
		expect(collectionEmail).toHaveValue('cobranza@cliente.cl');
		fireEvent.change(collectionEmail, { target: { value: '   ' } });
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));

		await waitFor(() =>
			expect(updateCreditProfileMock).toHaveBeenCalledWith(
				4,
				8,
				expect.objectContaining({ collection_email: null }),
			),
		);
		expect(updateCreditProfileMock.mock.calls[0][2]).not.toHaveProperty('is_active');
		expect(onSaved).toHaveBeenCalledTimes(1);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('muestra un error recuperable y vuelve a consultar el perfil', async () => {
		getCreditProfileMock
			.mockRejectedValueOnce(new Error('Servicio no disponible'))
			.mockResolvedValueOnce(detailProfile);
		render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Guardar condiciones' })).toBeDisabled();
		fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
		expect(await screen.findByLabelText('Correo de cobranza')).toHaveValue(
			'cobranza@cliente.cl',
		);
		expect(getCreditProfileMock).toHaveBeenCalledTimes(2);
	});

	it('bloquea un correo inválido antes de invocar el PUT', async () => {
		render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		const collectionEmail = await screen.findByLabelText('Correo de cobranza');
		fireEvent.change(collectionEmail, { target: { value: 'invalido' } });
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));

		expect(await screen.findByText('Ingresa un correo de cobranza válido')).toBeInTheDocument();
		expect(updateCreditProfileMock).not.toHaveBeenCalled();
	});

	it('reemplaza la suspensión por la eliminación confirmada del perfil', async () => {
		const onDeleted = vi.fn();
		render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
				onDeleted={onDeleted}
			/>,
		);

		await screen.findByLabelText('Correo de cobranza');
		expect(screen.queryByText('Crédito vigente')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));

		expect(await screen.findByText(/¿Quieres eliminar este perfil de crédito/i)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));

		await waitFor(() => expect(deleteCreditProfileMock).toHaveBeenCalledWith(4, 8));
		expect(onDeleted).toHaveBeenCalledOnce();
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('mantiene la confirmación abierta y muestra el motivo del backend ante un 422', async () => {
		deleteCreditProfileMock.mockRejectedValue({
			response: { status: 422, data: { message: 'El cliente tiene documentos pendientes.' } },
		});
		render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await screen.findByLabelText('Correo de cobranza');
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'El cliente tiene documentos pendientes.',
		);
		expect(onClose).not.toHaveBeenCalled();
	});

	it('aborta la carga anterior al cambiar de cliente', async () => {
		let firstSignal: AbortSignal | undefined;
		getCreditProfileMock
			.mockImplementationOnce(
				(_subsidiaryId, _customerSaleId, signal) =>
					new Promise<IDeferredPaymentCreditProfile>(() => {
						firstSignal = signal;
					}),
			)
			.mockResolvedValueOnce({
				...detailProfile,
				id: 9,
				customer_sale_id: 9,
				collection_email: 'nuevo@cliente.cl',
			});
		const view = render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await waitFor(() => expect(firstSignal).toBeDefined());
		view.rerender(
			<CreditProfileEditModal
				profile={{ ...listProfile, id: 9, customer_sale_id: 9 }}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		expect(firstSignal?.aborted).toBe(true);
		expect(await screen.findByLabelText('Correo de cobranza')).toHaveValue('nuevo@cliente.cl');
	});

	it('descarta el resultado de un guardado anterior al cambiar de cliente', async () => {
		const pendingSave = createDeferred<IDeferredPaymentCreditProfile>();
		getCreditProfileMock.mockResolvedValueOnce(detailProfile).mockResolvedValueOnce({
			...detailProfile,
			id: 9,
			customer_sale_id: 9,
			collection_email: 'nuevo@cliente.cl',
		});
		updateCreditProfileMock.mockImplementationOnce(() => pendingSave.promise);
		const view = render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await screen.findByLabelText('Correo de cobranza');
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));
		await waitFor(() => expect(updateCreditProfileMock).toHaveBeenCalledTimes(1));
		view.rerender(
			<CreditProfileEditModal
				profile={{ ...listProfile, id: 9, customer_sale_id: 9 }}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		expect(await screen.findByLabelText('Correo de cobranza')).toHaveValue('nuevo@cliente.cl');
		await act(async () => {
			pendingSave.resolve(detailProfile);
			await Promise.resolve();
		});

		expect(onSaved).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('descarta el resultado de un guardado anterior al cambiar de subsidiaria', async () => {
		const pendingSave = createDeferred<IDeferredPaymentCreditProfile>();
		getCreditProfileMock
			.mockResolvedValueOnce(detailProfile)
			.mockResolvedValueOnce(detailProfile);
		updateCreditProfileMock.mockImplementationOnce(() => pendingSave.promise);
		const view = render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await screen.findByLabelText('Correo de cobranza');
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));
		await waitFor(() => expect(updateCreditProfileMock).toHaveBeenCalledTimes(1));
		view.rerender(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={5}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		expect(await screen.findByLabelText('Correo de cobranza')).toHaveValue(
			'cobranza@cliente.cl',
		);
		await act(async () => {
			pendingSave.resolve(detailProfile);
			await Promise.resolve();
		});

		expect(onSaved).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('descarta el error de un guardado anterior al cambiar de cliente', async () => {
		const pendingSave = createDeferred<IDeferredPaymentCreditProfile>();
		getCreditProfileMock.mockResolvedValueOnce(detailProfile).mockResolvedValueOnce({
			...detailProfile,
			id: 9,
			customer_sale_id: 9,
			collection_email: 'nuevo@cliente.cl',
		});
		updateCreditProfileMock.mockImplementationOnce(() => pendingSave.promise);
		const view = render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await screen.findByLabelText('Correo de cobranza');
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));
		await waitFor(() => expect(updateCreditProfileMock).toHaveBeenCalledTimes(1));
		view.rerender(
			<CreditProfileEditModal
				profile={{ ...listProfile, id: 9, customer_sale_id: 9 }}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		expect(await screen.findByLabelText('Correo de cobranza')).toHaveValue('nuevo@cliente.cl');
		await act(async () => {
			pendingSave.reject(new Error('Error del cliente anterior'));
			await Promise.resolve();
		});

		expect(screen.queryByText('Error del cliente anterior')).not.toBeInTheDocument();
	});
});
