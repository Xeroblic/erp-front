import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '@/components/ErrorBoundary';

const CHUNK_ERROR = 'Failed to fetch dynamically imported module: https://erp/assets/page-abc.js';

const Thrower = ({ message }: { message: string }): never => {
	throw new Error(message);
};

const renderWithError = (message: string) =>
	render(
		<ErrorBoundary>
			<Thrower message={message} />
		</ErrorBoundary>,
	);

describe('ErrorBoundary ante chunks obsoletos', () => {
	const originalLocation = window.location;
	const reload = vi.fn();

	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: { ...originalLocation, reload },
		});
		window.sessionStorage.clear();
		reload.mockClear();
	});

	afterEach(() => {
		Object.defineProperty(window, 'location', {
			configurable: true,
			value: originalLocation,
		});
		vi.restoreAllMocks();
	});

	it('recarga sola cuando falta un chunk', () => {
		renderWithError(CHUNK_ERROR);

		expect(reload).toHaveBeenCalledTimes(1);
		expect(screen.getByText('Actualizando la aplicación...')).toBeInTheDocument();
	});

	it('no entra en bucle si el chunk sigue faltando tras recargar', () => {
		renderWithError(CHUNK_ERROR).unmount();
		reload.mockClear();

		renderWithError(CHUNK_ERROR);

		expect(reload).not.toHaveBeenCalled();
		expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
	});

	it('no recarga ante un error que no es de chunk', () => {
		renderWithError('Cannot read properties of undefined');

		expect(reload).not.toHaveBeenCalled();
		expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
	});

	it('no recarga si no puede dejar la marca que evita el bucle', () => {
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('QuotaExceededError');
		});

		renderWithError(CHUNK_ERROR);

		expect(reload).not.toHaveBeenCalled();
		expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
	});
});
