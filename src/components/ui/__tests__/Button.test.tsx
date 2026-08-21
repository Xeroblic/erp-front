import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Button from '../Button';

vi.mock('@/hooks/useAuthorization', () => ({
	default: () => ({ hasAnyPermission: vi.fn(() => true), isSuperAdmin: false }),
}));
vi.mock('@/hooks/useColorIntensity', () => ({
	default: () => ({ textColor: 'text-white', shadeColorIntensity: '600' }),
}));
vi.mock('@/hooks/useReactiveThemeConfig', () => ({
	default: () => ({ themeColor: 'blue', themeColorShade: '500' }),
}));
vi.mock('@/utils/tailwindColorResolver.util', () => ({
	resolveTailwindColor: () => '#2563eb',
	resolveTailwindColorAlpha: () => 'rgba(37, 99, 235, 0.5)',
}));

const deferred = <T,>() => {
	let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
	let reject: (reason?: unknown) => void = () => undefined;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});

	return { promise, resolve, reject };
};

const advanceBy = (milliseconds: number) => {
	act(() => {
		vi.advanceTimersByTime(milliseconds);
	});
};

describe('Button click guard', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	it('bloquea el doble click síncrono durante 400 ms', () => {
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Guardar</Button>);
		const button = screen.getByRole('button', { name: 'Guardar' });

		fireEvent.click(button);
		fireEvent.click(button);

		expect(onClick).toHaveBeenCalledOnce();
		expect(button).toBeDisabled();

		advanceBy(399);
		expect(button).toBeDisabled();

		advanceBy(1);
		expect(button).toBeEnabled();
	});

	it('mantiene el bloqueo mínimo cuando la promesa termina antes de 400 ms', async () => {
		const pending = deferred<void>();
		render(<Button onClick={() => pending.promise}>Guardar</Button>);
		const button = screen.getByRole('button', { name: 'Guardar' });

		fireEvent.click(button);
		await act(async () => {
			pending.resolve();
			await Promise.resolve();
		});

		advanceBy(399);
		expect(button).toBeDisabled();

		advanceBy(1);
		expect(button).toBeEnabled();
	});

	it('espera al handler asíncrono cuando supera los 400 ms', async () => {
		const pending = deferred<void>();
		render(<Button onClick={() => pending.promise}>Guardar</Button>);
		const button = screen.getByRole('button', { name: 'Guardar' });

		fireEvent.click(button);
		advanceBy(400);
		expect(button).toBeDisabled();

		await act(async () => {
			pending.resolve();
			await Promise.resolve();
		});
		expect(button).toBeEnabled();
	});

	it('libera el guard ante rechazo asíncrono o excepción síncrona', async () => {
		const pending = deferred<void>();
		const { rerender } = render(<Button onClick={() => pending.promise}>Guardar</Button>);
		let button = screen.getByRole('button', { name: 'Guardar' });

		fireEvent.click(button);
		await act(async () => {
			pending.reject(new Error('No se pudo guardar'));
			await Promise.resolve();
		});
		advanceBy(400);
		expect(button).toBeEnabled();

		rerender(
			<Button
				onClick={() => {
					throw new Error('Fallo síncrono');
				}}>
				Guardar
			</Button>,
		);
		button = screen.getByRole('button', { name: 'Guardar' });
		fireEvent.click(button);
		advanceBy(400);
		expect(button).toBeEnabled();
	});

	it('cancela el timer al desmontar y no programa otro al resolver después', async () => {
		const { unmount } = render(<Button onClick={() => undefined}>Guardar</Button>);
		fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
		expect(vi.getTimerCount()).toBe(1);

		unmount();
		expect(vi.getTimerCount()).toBe(0);
		advanceBy(400);

		const pending = deferred<void>();
		const asyncRender = render(<Button onClick={() => pending.promise}>Guardar</Button>);
		fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
		asyncRender.unmount();

		await act(async () => {
			pending.resolve();
			await Promise.resolve();
		});
		expect(vi.getTimerCount()).toBe(0);
	});
});
