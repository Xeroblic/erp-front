import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import store from '@/store';
import ApiService from '@/services/ApiService';
import AceptarInvitacionEmpresa from '@/pages/AceptarInvitacionEmpresa';

/**
 * Regresión de ZF-14: `useForceLightMode()` se llamaba después de los returns
 * condicionales de carga/error, así que el render de "cargando" ejecutaba menos
 * hooks que el primero y React tumbaba la vista con "Rendered fewer hooks than
 * expected" — el formulario de contraseña nunca llegaba a montarse.
 */
const TOKEN = 'a26c5662-31f3-478e-aae2-42848fcce5d0';

const renderActivationPage = () =>
	render(
		<Provider store={store}>
			<MemoryRouter
				initialEntries={[`/usuarios/activar/${TOKEN}`]}
				future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<Routes>
					<Route path='/usuarios/activar/:token' element={<AceptarInvitacionEmpresa />} />
				</Routes>
			</MemoryRouter>
		</Provider>,
	);

describe('AceptarInvitacionEmpresa', () => {
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('muestra el formulario de contraseña tras validar la invitación', async () => {
		vi.spyOn(ApiService, 'fetchData').mockResolvedValue({
			data: {
				email: 'invitado@example.com',
				first_name: 'Prueba',
				last_name: 'ZF14',
				role_name: 'technician',
				branch_id: 1,
			},
		} as never);

		renderActivationPage();

		// El estado de carga se muestra primero y luego cede al formulario:
		// esta transición es la que rompía el conteo de hooks.
		await waitFor(() => {
			expect(screen.getByText('Activa tu cuenta')).toBeInTheDocument();
		});

		expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
		expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument();
		expect(screen.getByText('invitado@example.com')).toBeInTheDocument();

		// Ningún error de React (hooks / contexto de Redux) durante el ciclo de render.
		const reactErrors = consoleErrorSpy.mock.calls.filter((call) =>
			String(call[0]).match(/fewer hooks|react-redux context|Rendered more hooks/),
		);
		expect(reactErrors).toHaveLength(0);
	});

	it('muestra el estado de invitación no válida cuando el token fue usado', async () => {
		vi.spyOn(ApiService, 'fetchData').mockRejectedValue({
			response: { status: 410, data: { message: 'Invitation no longer valid' } },
		});

		renderActivationPage();

		await waitFor(() => {
			expect(screen.getByText('Invitación no válida')).toBeInTheDocument();
		});

		expect(screen.getByText(/ya fue utilizada o expiró/)).toBeInTheDocument();
		expect(screen.queryByText('Activa tu cuenta')).not.toBeInTheDocument();
	});
});
