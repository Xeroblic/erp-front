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
	default: {
		getCreditProfile: vi.fn(),
		updateCreditProfile: vi.fn(),
		deleteCreditProfile: vi.fn(),
	},
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
vi.mock('@/components/ui/Tooltip', () => ({
	default: ({ children, text }: { children: React.ReactNode; text: string }) => (
		<span data-tooltip={text}>{children}</span>
	),
}));
vi.mock('@/components/authorization/PermissionGuard', () => ({
	default: ({ children }: { children: React.ReactNode }) => children,
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
vi.mock('@/components/form/Checkbox', () => ({
	default: ({
		checked,
		onChange,
		label,
	}: {
		checked: boolean;
		onChange: React.ChangeEventHandler<HTMLInputElement>;
		label: string;
	}) => (
		<label>
			<input type='checkbox' checked={checked} onChange={onChange} />
			{label}
		</label>
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

const waitForCollectionEmail = async (expectedValue: string) => {
	const collectionEmail = await screen.findByLabelText('Correo de cobranza');
	await waitFor(() => expect(collectionEmail).toHaveValue(expectedValue));
	return collectionEmail;
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
		const collectionEmail = await waitForCollectionEmail('cobranza@cliente.cl');
		expect(getCreditProfileMock).toHaveBeenCalledWith(4, 8, expect.any(AbortSignal));
		fireEvent.change(collectionEmail, { target: { value: '   ' } });
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));

		await waitFor(() =>
			expect(updateCreditProfileMock).toHaveBeenCalledWith(
				4,
				8,
				expect.objectContaining({ collection_email: null }),
			),
		);
		expect(updateCreditProfileMock.mock.calls[0][2]).toHaveProperty('is_active', true);
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
		await waitForCollectionEmail('cobranza@cliente.cl');
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

		const collectionEmail = await waitForCollectionEmail('cobranza@cliente.cl');
		fireEvent.change(collectionEmail, { target: { value: 'invalido' } });
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));

		expect(await screen.findByText('Ingresa un correo de cobranza válido')).toBeInTheDocument();
		expect(updateCreditProfileMock).not.toHaveBeenCalled();
	});

	it('guarda la suspensión y elimina el perfil en la misma confirmación', async () => {
		updateCreditProfileMock.mockResolvedValue({ ...detailProfile, is_active: false });
		render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await waitForCollectionEmail('cobranza@cliente.cl');
		const activeCredit = screen.getByLabelText('Crédito vigente');
		expect(screen.getByText(/Suspender conserva las condiciones/i)).toBeInTheDocument();
		fireEvent.click(activeCredit);
		const deleteButton = screen.getByRole('button', { name: 'Eliminar perfil' });
		expect(deleteButton).toBeEnabled();
		fireEvent.click(deleteButton);

		expect(await screen.findByText(/Primero se guardará la suspensión/i)).toBeInTheDocument();
		expect(updateCreditProfileMock).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));

		await waitFor(() =>
			expect(updateCreditProfileMock).toHaveBeenCalledWith(
				4,
				8,
				expect.objectContaining({ is_active: false }),
			),
		);
		await waitFor(() => expect(deleteCreditProfileMock).toHaveBeenCalledWith(4, 8));
		expect(updateCreditProfileMock.mock.invocationCallOrder[0]).toBeLessThan(
			deleteCreditProfileMock.mock.invocationCallOrder[0],
		);
		expect(onSaved).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('suspende con las condiciones cargadas y no persiste el borrador antes de eliminar', async () => {
		updateCreditProfileMock.mockResolvedValue({ ...detailProfile, is_active: false });
		deleteCreditProfileMock.mockRejectedValue({
			response: { status: 422, data: { message: 'El perfil no se puede eliminar.' } },
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

		await waitForCollectionEmail('cobranza@cliente.cl');
		fireEvent.change(screen.getByLabelText('Plazo de pago (días)'), {
			target: { value: '90' },
		});
		fireEvent.change(screen.getByLabelText('Cupo de crédito'), {
			target: { value: '900000' },
		});
		fireEvent.change(screen.getByLabelText('Correo de cobranza'), {
			target: { value: 'borrador@cliente.cl' },
		});
		fireEvent.change(screen.getByLabelText('Notas'), { target: { value: 'Borrador' } });
		fireEvent.click(screen.getByLabelText('Crédito vigente'));
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));
		await screen.findByText(/¿Quieres eliminar este perfil de crédito/i);
		expect(
			screen.getByText(/Los cambios pendientes en las condiciones se descartarán/i),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));

		await waitFor(() =>
			expect(updateCreditProfileMock).toHaveBeenCalledWith(4, 8, {
				is_active: false,
				payment_term_days: detailProfile.payment_term_days,
				credit_limit: detailProfile.credit_limit,
				collection_email: detailProfile.collection_email,
				notes: detailProfile.notes,
			}),
		);
		expect(await screen.findByRole('alert')).toHaveTextContent(
			'La suspensión del crédito ya fue guardada. El perfil no se puede eliminar.',
		);
		expect(onClose).not.toHaveBeenCalled();
	});

	it('informa la suspensión aplicada si el DELETE falla con un error de red', async () => {
		updateCreditProfileMock.mockResolvedValue({ ...detailProfile, is_active: false });
		deleteCreditProfileMock.mockRejectedValue(new Error('Network Error'));
		render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await waitForCollectionEmail('cobranza@cliente.cl');
		fireEvent.click(screen.getByLabelText('Crédito vigente'));
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));
		await screen.findByText(/¿Quieres eliminar este perfil de crédito/i);
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'La suspensión del crédito ya fue guardada. Network Error',
		);
		expect(updateCreditProfileMock).toHaveBeenCalledOnce();
		expect(deleteCreditProfileMock).toHaveBeenCalledOnce();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('permite confirmar la eliminación de un crédito suspendido con un borrador inválido', async () => {
		const suspendedProfile = { ...listProfile, is_active: false };
		getCreditProfileMock.mockResolvedValue({ ...detailProfile, is_active: false });
		render(
			<CreditProfileEditModal
				profile={suspendedProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		fireEvent.change(await waitForCollectionEmail('cobranza@cliente.cl'), {
			target: { value: 'correo-invalido' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));

		expect(
			await screen.findByText(/¿Quieres eliminar este perfil de crédito/i),
		).toBeInTheDocument();
		expect(updateCreditProfileMock).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));

		await waitFor(() => expect(deleteCreditProfileMock).toHaveBeenCalledWith(4, 8));
		expect(updateCreditProfileMock).not.toHaveBeenCalled();
	});

	it('cierra el modal al guardar una suspensión sin eliminar el perfil', async () => {
		updateCreditProfileMock.mockResolvedValue({ ...detailProfile, is_active: false });
		render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await waitForCollectionEmail('cobranza@cliente.cl');
		fireEvent.click(screen.getByLabelText('Crédito vigente'));
		fireEvent.click(screen.getByRole('button', { name: 'Guardar condiciones' }));

		await waitFor(() =>
			expect(updateCreditProfileMock).toHaveBeenCalledWith(
				4,
				8,
				expect.objectContaining({ is_active: false }),
			),
		);
		expect(onClose).toHaveBeenCalledOnce();
		expect(deleteCreditProfileMock).not.toHaveBeenCalled();
	});

	it('conserva la confirmación y no refresca la lista entre el PUT y un 422 del DELETE', async () => {
		const pendingDelete = createDeferred<void>();
		updateCreditProfileMock.mockResolvedValue({ ...detailProfile, is_active: false });
		deleteCreditProfileMock.mockImplementation(() => pendingDelete.promise);
		render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await waitForCollectionEmail('cobranza@cliente.cl');
		fireEvent.click(screen.getByLabelText('Crédito vigente'));
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));
		await screen.findByText(/¿Quieres eliminar este perfil de crédito/i);
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));
		await waitFor(() => expect(deleteCreditProfileMock).toHaveBeenCalledWith(4, 8));
		expect(onSaved).not.toHaveBeenCalled();
		expect(screen.getByText(/¿Quieres eliminar este perfil de crédito/i)).toBeInTheDocument();

		await act(async () => {
			pendingDelete.reject({
				response: { data: { message: 'El cliente tiene saldo pendiente.' } },
			});
			await Promise.resolve();
		});

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'El cliente tiene saldo pendiente.',
		);
		expect(onClose).not.toHaveBeenCalled();
	});

	it('no elimina si no logra guardar la suspensión', async () => {
		updateCreditProfileMock.mockRejectedValue(new Error('No se pudo suspender el crédito.'));
		render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await waitForCollectionEmail('cobranza@cliente.cl');
		fireEvent.click(screen.getByLabelText('Crédito vigente'));
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));
		await screen.findByText(/¿Quieres eliminar este perfil de crédito/i);
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'No se pudo suspender el crédito.',
		);
		expect(deleteCreditProfileMock).not.toHaveBeenCalled();
		expect(onClose).not.toHaveBeenCalled();
	});

	it('deshabilita la eliminación de un perfil activo y explica que debe suspenderse', async () => {
		render(
			<CreditProfileEditModal
				profile={listProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await waitForCollectionEmail('cobranza@cliente.cl');
		const deleteButton = screen.getByRole('button', { name: 'Eliminar perfil' });
		expect(deleteButton).toBeDisabled();
		const deleteTooltip = deleteButton.closest('[data-tooltip]');
		expect(deleteTooltip).toHaveAttribute(
			'data-tooltip',
			'Suspende el crédito antes de eliminar el perfil.',
		);
		expect(deleteButton.parentElement).toHaveAttribute('tabindex', '0');
	});

	it('anticipa el saldo pendiente de un perfil suspendido antes de intentar eliminarlo', async () => {
		const suspendedProfileWithBalance = {
			...listProfile,
			is_active: false,
			outstanding_balance: '1500.00',
		};
		getCreditProfileMock.mockResolvedValue({ ...detailProfile, is_active: false });
		render(
			<CreditProfileEditModal
				profile={suspendedProfileWithBalance}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await waitForCollectionEmail('cobranza@cliente.cl');
		const deleteButton = screen.getByRole('button', { name: 'Eliminar perfil' });
		expect(deleteButton).toBeDisabled();
		expect(deleteButton.closest('[data-tooltip]')).toHaveAttribute(
			'data-tooltip',
			'No puedes eliminar el perfil mientras el cliente tenga saldo pendiente.',
		);
	});

	it('muestra el motivo del saldo pendiente en la confirmación directa', async () => {
		const suspendedProfileWithBalance = {
			...listProfile,
			is_active: false,
			outstanding_balance: '1500.00',
		};
		getCreditProfileMock.mockResolvedValue({ ...detailProfile, is_active: false });
		render(
			<CreditProfileEditModal
				profile={suspendedProfileWithBalance}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
				initialDeleteConfirmation
			/>,
		);

		await screen.findByText(/¿Quieres eliminar este perfil de crédito/i);
		expect(
			screen.getByText(
				'No puedes eliminar el perfil mientras el cliente tenga saldo pendiente.',
			),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Eliminar perfil' })).toBeDisabled();
	});

	it('elimina un perfil suspendido tras confirmarlo', async () => {
		const onDeleted = vi.fn();
		const suspendedProfile = { ...listProfile, is_active: false };
		getCreditProfileMock.mockResolvedValue({ ...detailProfile, is_active: false });
		render(
			<CreditProfileEditModal
				profile={suspendedProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
				onDeleted={onDeleted}
			/>,
		);

		await waitForCollectionEmail('cobranza@cliente.cl');
		expect(screen.getByLabelText('Crédito suspendido')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));

		expect(
			await screen.findByText(/¿Quieres eliminar este perfil de crédito/i),
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));

		await waitFor(() => expect(deleteCreditProfileMock).toHaveBeenCalledWith(4, 8));
		expect(onDeleted).toHaveBeenCalledOnce();
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('cierra el modal al cancelar una confirmación abierta desde la tabla', async () => {
		const suspendedProfile = { ...listProfile, is_active: false };
		getCreditProfileMock.mockResolvedValue({ ...detailProfile, is_active: false });
		render(
			<CreditProfileEditModal
				profile={suspendedProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
				initialDeleteConfirmation
			/>,
		);

		await screen.findByText(/¿Quieres eliminar este perfil de crédito/i);
		fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

		expect(onClose).toHaveBeenCalledOnce();
		expect(onSaved).not.toHaveBeenCalled();
		expect(updateCreditProfileMock).not.toHaveBeenCalled();
		expect(deleteCreditProfileMock).not.toHaveBeenCalled();
	});

	it('mantiene la confirmación abierta y muestra el motivo del backend ante un 422', async () => {
		const suspendedProfile = { ...listProfile, is_active: false };
		getCreditProfileMock.mockResolvedValue({ ...detailProfile, is_active: false });
		deleteCreditProfileMock.mockRejectedValue({
			response: { status: 422, data: { message: 'El cliente tiene documentos pendientes.' } },
		});
		render(
			<CreditProfileEditModal
				profile={suspendedProfile}
				subsidiaryId={4}
				branchId={1}
				onClose={onClose}
				onSaved={onSaved}
			/>,
		);

		await waitForCollectionEmail('cobranza@cliente.cl');
		fireEvent.click(screen.getByRole('button', { name: 'Eliminar perfil' }));
		await screen.findByText(/¿Quieres eliminar este perfil de crédito/i);
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
		await waitForCollectionEmail('nuevo@cliente.cl');
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

		await waitForCollectionEmail('cobranza@cliente.cl');
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

		await waitForCollectionEmail('nuevo@cliente.cl');
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

		await waitForCollectionEmail('cobranza@cliente.cl');
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

		await waitForCollectionEmail('cobranza@cliente.cl');
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

		await waitForCollectionEmail('cobranza@cliente.cl');
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

		await waitForCollectionEmail('nuevo@cliente.cl');
		await act(async () => {
			pendingSave.reject(new Error('Error del cliente anterior'));
			await Promise.resolve();
		});

		expect(screen.queryByText('Error del cliente anterior')).not.toBeInTheDocument();
	});
});
