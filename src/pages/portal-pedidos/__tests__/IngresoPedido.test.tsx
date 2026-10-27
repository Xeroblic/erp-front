import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'react-toastify';
import { buildAuthState, renderWithStore } from '@/test-utils/renderWithStore';
import IngresoPedido from '../components/IngresoPedido';

/**
 * El formulario pasó de react-hook-form a Formik + Yup. Las pruebas fijan las reglas
 * que ya tenía: RUT válido y obligatorio, canal obligatorio, y al menos una
 * cotización o un link para poder ingresar el pedido.
 */

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/icon/Icon', () => ({ default: () => null }));
// react-select no se deja operar en jsdom: se sustituye por un select nativo.
vi.mock('@/components/form/SelectReact', () => ({
	default: ({
		id,
		options,
		onChange,
	}: {
		id: string;
		options: { value: string; label: string }[];
		onChange: (option: { value: string; label: string } | null) => void;
	}) => (
		<select
			id={id}
			aria-label='Canal de Compra'
			onChange={(event) =>
				onChange(options.find((option) => option.value === event.target.value) ?? null)
			}>
			<option value=''>Selecciona un canal...</option>
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	),
}));

const renderForm = () => renderWithStore(<IngresoPedido />, buildAuthState());

const submitButton = () => screen.getByRole('button', { name: /Ingresar Pedido/ });

const fillValidOrder = () => {
	fireEvent.change(screen.getByPlaceholderText('12345678-9'), {
		target: { value: '12345678-5' },
	});
	fireEvent.change(screen.getByPlaceholderText('Ej. Juan Pérez o Empresa SpA'), {
		target: { value: 'cliente de prueba' },
	});
	fireEvent.change(screen.getByLabelText('Canal de Compra'), { target: { value: 'WhatsApp' } });
	fireEvent.change(screen.getByPlaceholderText('https://...'), {
		target: { value: 'https://ejemplo.cl/oc-1' },
	});
};

describe('IngresoPedido', () => {
	beforeEach(() => {
		vi.mocked(toast.success).mockClear();
	});

	it('parte con el envío deshabilitado y valida el RUT', async () => {
		renderForm();

		await waitFor(() => expect(submitButton()).toBeDisabled());

		const rut = screen.getByPlaceholderText('12345678-9');
		fireEvent.change(rut, { target: { value: '12345678-0' } });
		expect(await screen.findByText('RUT no válido')).toBeInTheDocument();

		fireEvent.change(rut, { target: { value: '' } });
		expect(await screen.findByText('El RUT del cliente es obligatorio')).toBeInTheDocument();
	});

	it('habilita el envío con datos válidos y capitaliza el nombre', async () => {
		renderForm();
		fillValidOrder();

		await waitFor(() => expect(submitButton()).toBeEnabled());
		expect(screen.getByPlaceholderText('Ej. Juan Pérez o Empresa SpA')).toHaveValue(
			'Cliente de prueba',
		);
	});

	it('exige una cotización o un link', async () => {
		renderForm();
		fillValidOrder();
		await waitFor(() => expect(submitButton()).toBeEnabled());

		fireEvent.change(screen.getByPlaceholderText('https://...'), { target: { value: '' } });

		expect(
			await screen.findByText('Debe adjuntar una Cotización o ingresar un Link válido'),
		).toBeInTheDocument();
		expect(submitButton()).toBeDisabled();

		const file = new File(['pdf'], 'cotizacion.pdf', { type: 'application/pdf' });
		fireEvent.change(screen.getByLabelText('Cotización (Opcional si hay Link)'), {
			target: { files: [file] },
		});

		await waitFor(() => expect(submitButton()).toBeEnabled());
		expect(
			screen.queryByText('Debe adjuntar una Cotización o ingresar un Link válido'),
		).not.toBeInTheDocument();
	});

	it('ingresa el pedido, avisa y limpia el formulario', async () => {
		renderForm();
		fillValidOrder();
		await waitFor(() => expect(submitButton()).toBeEnabled());

		fireEvent.click(submitButton());

		await waitFor(
			() => expect(toast.success).toHaveBeenCalledWith('Pedido ingresado con éxito'),
			{
				timeout: 3000,
			},
		);
		expect(screen.getByPlaceholderText('12345678-9')).toHaveValue('');
		expect(screen.getByPlaceholderText('https://...')).toHaveValue('');
		await waitFor(() => expect(submitButton()).toBeDisabled());
	});

	it('al limpiar vacía los campos y vuelve a deshabilitar el envío', async () => {
		renderForm();
		fillValidOrder();
		await waitFor(() => expect(submitButton()).toBeEnabled());

		fireEvent.click(screen.getByRole('button', { name: 'Limpiar Formulario' }));

		expect(screen.getByPlaceholderText('12345678-9')).toHaveValue('');
		expect(screen.getByPlaceholderText('Ej. Juan Pérez o Empresa SpA')).toHaveValue('');
		await waitFor(() => expect(submitButton()).toBeDisabled());
	});
});
