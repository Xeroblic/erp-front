import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DesktopForm from '../desktop/DesktopForm';
import type { DesktopFormData } from '../../validation/desktop.schema';

vi.mock('@/components/icon/Icon', () => ({ default: () => <span /> }));
vi.mock('../shared/gallery/GallerySection', () => ({ default: () => <div /> }));
vi.mock('@/pages/catalogos/marcas/components/hooks/useMarcas', () => ({
	useMarcas: () => ({ brands: [], loading: false }),
}));
vi.mock('@/components/form/Input', () => ({
	default: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
		(props, ref) => <input ref={ref} {...props} />,
	),
}));
vi.mock('@/components/form/Checkbox', () => ({
	default: ({ checked, onChange }: { checked?: boolean; onChange?: () => void }) => (
		<input aria-label='checkbox-mock' type='checkbox' checked={checked} onChange={onChange} />
	),
}));
vi.mock('@/components/form/SelectReact', () => ({
	default: () => <select aria-label='select-mock' />,
}));
vi.mock('@/pages/refactor-technical-review/components/ui/selectors/ProcessorSelector', () => ({
	ProcessorSelector: () => <input aria-label='processor' />,
}));
vi.mock('@/components/ui/Button', () => ({
	default: ({
		children,
		onClick,
		disabled,
	}: {
		children: React.ReactNode;
		onClick?: React.MouseEventHandler<HTMLButtonElement>;
		disabled?: boolean;
	}) => (
		<button type='button' onClick={onClick} disabled={disabled}>
			{children}
		</button>
	),
}));
vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
		isOpen ? <div>{children}</div> : null,
	ModalHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const COMPLETE: Partial<DesktopFormData> = {
	brand: 'HP',
	model: 'EliteDesk',
	line: '800',
	general_condition: 'good_shape',
	processor: 'Intel i5',
	has_no_ram: false,
	has_no_storage: false,
	ram_size: '8GB',
	ram_slots: '8x1',
	ram_type: 'DDR4',
	storage_size: '256GB',
	storage_technology: 'SSD',
	cover_condition: 'ok',
	includes_charger: false,
	powers_on: true,
	operating_system: 'Windows 11',
	has_wifi: true,
	has_bluetooth: true,
	has_cd_drive: false,
};

const antennaGroup = () => screen.getByRole('group', { name: '¿Incluye antena?' });
const conditionGroup = () => screen.getByRole('group', { name: /Estado de la antena/ });

const mountForm = (
	values: Partial<DesktopFormData> = {},
	section = 'accessories',
	onSubmit = vi.fn<(data: DesktopFormData) => Promise<void>>().mockResolvedValue(undefined),
	readOnly = false,
) => {
	const getter: { current?: () => Record<string, unknown> } = {};
	const result = render(
		<DesktopForm
			defaultValues={{ ...COMPLETE, ...values }}
			onSubmit={onSubmit}
			onBack={vi.fn()}
			initialSectionKey={section}
			readOnly={readOnly}
			registerGetFormValues={(getValues) => {
				getter.current = getValues;
			}}
		/>,
	);
	return { ...result, getter, onSubmit };
};

describe('ZF-123 · antena de desktop', () => {
	beforeEach(() => {
		window.scrollTo = vi.fn();
	});
	it('hidrata el estado, lo limpia al responder No y exige elegirlo nuevamente al volver a Sí', async () => {
		const { getter } = mountForm({ includes_antenna: true, antenna_condition: 'loose' });
		await screen.findByRole('group', { name: /Estado de la antena/ });
		expect(
			await within(conditionGroup()).findByRole('button', { name: 'Suelta', pressed: true }),
		).toBeInTheDocument();
		fireEvent.click(within(antennaGroup()).getByRole('button', { name: 'No' }));
		await waitFor(() =>
			expect(
				screen.queryByRole('group', { name: /Estado de la antena/ }),
			).not.toBeInTheDocument(),
		);
		expect(getter.current?.()).toMatchObject({
			includes_antenna: false,
			antenna_condition: null,
		});
		fireEvent.click(within(antennaGroup()).getByRole('button', { name: 'Sí' }));
		expect(getter.current?.()).toMatchObject({
			includes_antenna: true,
			antenna_condition: null,
		});
		await waitFor(() =>
			expect(screen.getByText('Indica el estado de la antena')).toBeInTheDocument(),
		);
		fireEvent.click(within(conditionGroup()).getByRole('button', { name: 'Rota' }));
		await waitFor(() =>
			expect(screen.queryByText('Indica el estado de la antena')).not.toBeInTheDocument(),
		);
		expect(getter.current?.().antenna_condition).toBe('broken');
		fireEvent.click(within(antennaGroup()).getByRole('button', { name: 'Sí' }));
		expect(getter.current?.().antenna_condition).toBe('broken');
	});

	it.each([false, null, undefined])(
		'permite finalizar con includes_antenna=%s sin pedir estado',
		async (includes_antenna) => {
			const { onSubmit } = mountForm(
				{ includes_antenna, antenna_condition: null },
				'gallery',
			);
			await act(async () => {
				fireEvent.click(await screen.findByText('Finalizar Revisión'));
			});
			await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
		},
	);

	it('bloquea el cierre con Sí sin estado y abre Accesorios con el error visible', async () => {
		const { onSubmit } = mountForm(
			{ includes_antenna: true, antenna_condition: null },
			'gallery',
		);
		await act(async () => {
			fireEvent.click(await screen.findByText('Finalizar Revisión'));
		});
		expect(onSubmit).not.toHaveBeenCalled();
		expect(await screen.findByRole('alert')).toHaveTextContent('Indica el estado de la antena');
		expect(conditionGroup()).toBeInTheDocument();
	});

	it('finaliza y conserva el estado elegido', async () => {
		const { onSubmit } = mountForm(
			{ includes_antenna: true, antenna_condition: 'loose' },
			'gallery',
		);
		await act(async () => {
			fireEvent.click(await screen.findByText('Finalizar Revisión'));
		});
		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith(
				expect.objectContaining({ includes_antenna: true, antenna_condition: 'loose' }),
			),
		);
	});

	it('conserva el borrador y muestra el 422 remoto junto al selector', async () => {
		const message = 'Debes completar el estado de la antena antes de finalizar la revisión.';
		const onSubmit = vi.fn<(data: DesktopFormData) => Promise<void>>().mockRejectedValue({
			message: 'Validación fallida',
			errors: { antenna_condition: [message] },
		});
		const { getter } = mountForm(
			{ includes_antenna: true, antenna_condition: 'loose' },
			'gallery',
			onSubmit,
		);
		await act(async () => {
			fireEvent.click(await screen.findByText('Finalizar Revisión'));
		});
		expect(await screen.findByRole('alert')).toHaveTextContent(message);
		expect(conditionGroup()).toBeInTheDocument();
		expect(getter.current?.()).toMatchObject({
			model: 'EliteDesk',
			antenna_condition: 'loose',
		});
	});

	it('el atajo No enciende exige el estado de una antena ya declarada', async () => {
		const { onSubmit } = mountForm(
			{ includes_antenna: true, antenna_condition: null },
			'hardware',
		);
		fireEvent.click(await screen.findByText('Equipo NO ENCIENDE (Enviar como Categoría M)'));
		act(() => {
			fireEvent.click(screen.getByText('Confirmar y Enviar a Categoría M'));
		});
		expect(onSubmit).not.toHaveBeenCalled();
		expect(await screen.findByRole('alert')).toHaveTextContent('Indica el estado de la antena');
	});

	it('deshabilita los controles en modo lectura', async () => {
		mountForm(
			{ includes_antenna: true, antenna_condition: 'loose' },
			'accessories',
			undefined,
			true,
		);
		await screen.findByRole('group', { name: '¿Incluye antena?' });
		[
			...within(antennaGroup()).getAllByRole('button'),
			...within(conditionGroup()).getAllByRole('button'),
		].forEach((button) => {
			expect(button).toBeDisabled();
		});
	});
});
