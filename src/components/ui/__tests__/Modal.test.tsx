import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '../Modal';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ i18n: { dir: () => 'ltr' } }),
}));
vi.mock('../CloseButton', () => ({
	default: () => <button type='button'>Cerrar</button>,
}));
vi.mock('../../icon/Icon', () => ({
	default: () => <span aria-hidden='true' />,
}));

interface TestModalProps {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	title?: string;
}

const TestModal = ({ isOpen, setIsOpen, title = 'Modal de prueba' }: TestModalProps) => (
	<Modal isOpen={isOpen} setIsOpen={setIsOpen} isCentered>
		<ModalHeader>{title}</ModalHeader>
		<ModalBody>
			<button type='button'>Primera acción</button>
			<button type='button'>Última acción</button>
		</ModalBody>
		<ModalFooter>
			<button type='button'>Confirmar</button>
		</ModalFooter>
	</Modal>
);

const ModalHarness = () => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<>
			<button type='button' onClick={() => setIsOpen(true)}>
				Abrir modal
			</button>
			<TestModal isOpen={isOpen} setIsOpen={setIsOpen} />
		</>
	);
};

describe('Modal', () => {
	beforeEach(() => {
		const portalRoot = document.createElement('div');
		portalRoot.id = 'portal-root';
		document.body.appendChild(portalRoot);
	});

	afterEach(() => {
		document.getElementById('portal-root')?.remove();
		vi.restoreAllMocks();
	});

	it('eleva el backdrop sobre los drawers y preserva el orden de modales apilados', () => {
		const setFirstModalOpen = vi.fn();
		const setSecondModalOpen = vi.fn();
		render(
			<>
				<TestModal isOpen setIsOpen={setFirstModalOpen} title='Primer modal' />
				<TestModal isOpen setIsOpen={setSecondModalOpen} title='Segundo modal' />
			</>,
		);

		const backdrops = document.querySelectorAll<HTMLElement>(
			'[data-component-name="Modal/BackDrop"]',
		);
		const dialogs = document.querySelectorAll<HTMLElement>('[data-component-name="Modal"]');

		expect(backdrops[0]).toHaveStyle({ zIndex: '1060' });
		expect(dialogs[0]).toHaveStyle({ zIndex: '1065' });
		expect(backdrops[1]).toHaveStyle({ zIndex: '1080' });
		expect(dialogs[1]).toHaveStyle({ zIndex: '1085' });

		fireEvent.mouseDown(backdrops[1]);
		expect(setFirstModalOpen).not.toHaveBeenCalled();
		expect(setSecondModalOpen).toHaveBeenCalledWith(false);
	});

	it('bloquea el scroll mientras hay modales abiertos y lo restaura al cerrar el último', () => {
		const { rerender } = render(
			<>
				<TestModal isOpen setIsOpen={vi.fn()} title='Primer modal' />
				<TestModal isOpen setIsOpen={vi.fn()} title='Segundo modal' />
			</>,
		);

		expect(document.body.style.overflow).toBe('hidden');
		expect(document.documentElement.style.overflow).toBe('hidden');

		rerender(<TestModal isOpen setIsOpen={vi.fn()} title='Segundo modal' />);

		expect(document.body.style.overflow).toBe('hidden');
		expect(document.documentElement.style.overflow).toBe('hidden');

		rerender(<TestModal isOpen={false} setIsOpen={vi.fn()} title='Segundo modal' />);

		expect(document.body.style.overflow).toBe('');
		expect(document.documentElement.style.overflow).toBe('');
	});

	it('mantiene el teclado en el modal superior si se desmonta una capa inferior', () => {
		const setFirstModalOpen = vi.fn();
		const setSecondModalOpen = vi.fn();
		const { rerender } = render(
			<>
				<TestModal key='first' isOpen setIsOpen={setFirstModalOpen} title='Primer modal' />
				<TestModal key='second' isOpen setIsOpen={setSecondModalOpen} title='Segundo modal' />
			</>,
		);

		rerender(
			<TestModal key='second' isOpen setIsOpen={setSecondModalOpen} title='Segundo modal' />,
		);
		const dialog = screen.getByRole('dialog', { name: 'Segundo modal' });
		const buttons = within(dialog).getAllByRole('button');
		const firstButton = buttons[0];
		buttons[buttons.length - 1].focus();
		fireEvent.keyDown(window, { key: 'Tab' });
		expect(document.activeElement).toBe(firstButton);
		fireEvent.keyDown(window, { key: 'Escape' });

		expect(setFirstModalOpen).not.toHaveBeenCalled();
		expect(setSecondModalOpen).toHaveBeenCalledWith(false);
	});

	it('atrapa Tab y Shift+Tab dentro del modal', () => {
		render(<TestModal isOpen setIsOpen={vi.fn()} />);

		const dialog = screen.getByRole('dialog', { name: 'Modal de prueba' });
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		const buttons = within(dialog).getAllByRole('button');
		const firstButton = buttons[0];
		const lastButton = buttons[buttons.length - 1];

		expect(document.activeElement).toBe(firstButton);
		lastButton.focus();
		fireEvent.keyDown(window, { key: 'Tab' });
		expect(document.activeElement).toBe(firstButton);

		fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
		expect(document.activeElement).toBe(lastButton);
	});

	it('incluye el indicador de scroll en el recorrido del foco sin alcanzar el fondo', async () => {
		vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
		vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
		const setIsOpen = vi.fn();
		render(
			<>
				<button type='button'>Control del fondo</button>
				<TestModal isOpen setIsOpen={setIsOpen} />
			</>,
		);

		const scrollHint = await screen.findByRole('button', {
			name: 'Hay más contenido, desplázate hacia abajo',
		});
		const dialog = screen.getByRole('dialog', { name: 'Modal de prueba' });
		const firstButton = within(dialog).getAllByRole('button')[0];
		expect(dialog).toContainElement(scrollHint);

		fireEvent.mouseDown(scrollHint);
		fireEvent.touchStart(scrollHint);
		expect(setIsOpen).not.toHaveBeenCalled();

		scrollHint.focus();
		expect(fireEvent.keyDown(window, { key: 'Tab' })).toBe(false);
		expect(document.activeElement).toBe(firstButton);

		firstButton.focus();
		expect(fireEvent.keyDown(window, { key: 'Tab', shiftKey: true })).toBe(false);
		expect(document.activeElement).toBe(scrollHint);
		expect(document.activeElement).not.toBe(
			screen.getByRole('button', { name: 'Control del fondo' }),
		);
	});

	it('cierra con Escape y devuelve el foco al disparador', async () => {
		render(<ModalHarness />);

		const trigger = screen.getByRole('button', { name: 'Abrir modal' });
		trigger.focus();
		fireEvent.click(trigger);
		expect(screen.getByRole('dialog', { name: 'Modal de prueba' })).toBeInTheDocument();

		fireEvent.keyDown(window, { key: 'Escape' });

		await waitFor(() =>
			expect(
				screen.queryByRole('dialog', { name: 'Modal de prueba' }),
			).not.toBeInTheDocument(),
		);
		expect(document.activeElement).toBe(trigger);
	});
});
