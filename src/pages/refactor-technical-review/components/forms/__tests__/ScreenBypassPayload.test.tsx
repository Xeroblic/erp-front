import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import MonitorScreenSection from '../monitor/sections/MonitorScreenSection';
import AioHardwareSection from '../aio/sections/AioHardwareSection';
import { type MonitorFormData } from '../../validation/monitor.schema';
import { type AioFormData } from '../../validation/aio.schema';

vi.mock('@/components/icon/Icon', () => ({
	default: () => <span data-testid='icon' />,
}));

vi.mock('@/components/form/Input', () => ({
	default: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
		(props, ref) => <input {...props} ref={ref} />,
	),
}));

vi.mock('@/components/form/Checkbox', () => ({
	default: ({ checked, onChange }: { checked?: boolean; onChange?: () => void }) => (
		<input type='checkbox' checked={checked} onChange={onChange} />
	),
}));

vi.mock('@/components/form/SelectReact', () => ({
	default: () => <select aria-label='select-mock' />,
}));

/** `ProcessorSelector` consulta el store; la sección sólo se monta por su bypass. */
vi.mock('@/pages/refactor-technical-review/components/ui/selectors/ProcessorSelector', () => ({
	ProcessorSelector: () => <input aria-label='processor-mock' />,
}));

/** `Button` lee el tema desde el store; aquí sólo interesa el click. */
vi.mock('@/components/ui/Button', () => ({
	default: ({
		children,
		onClick,
	}: {
		children: React.ReactNode;
		onClick?: React.MouseEventHandler<HTMLButtonElement>;
	}) => (
		<button type='button' onClick={onClick}>
			{children}
		</button>
	),
}));

/**
 * El bypass «No enciende» arma su payload y llama a `onSubmit` directamente, sin
 * pasar por el resolver de Yup. El modal de confirmación se reemplaza por un
 * contenedor plano para poder ejercer el flujo completo en jsdom.
 */
vi.mock('@/components/ui/Modal', () => ({
	default: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
		isOpen ? <div>{children}</div> : null,
	ModalHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
	ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const confirmNoEnciende = () => {
	act(() => {
		fireEvent.click(screen.getByRole('button', { name: /Equipo NO ENCIENDE/i }));
	});
	act(() => {
		fireEvent.click(screen.getByRole('button', { name: /Confirmar y Enviar/i }));
	});
};

const MonitorBypassHarness = ({
	onDirectSubmit,
}: {
	onDirectSubmit: (payload: Partial<MonitorFormData>) => void;
}) => {
	const {
		control,
		formState: { errors },
		watch,
		setValue,
	} = useForm<MonitorFormData>({
		defaultValues: {
			screen_inches: '24',
			screen_resolution: '1920x1080',
			screen_condition: 'dead_pixels',
			dead_pixels_count: 7,
		},
	});

	return (
		<MonitorScreenSection
			control={control}
			errors={errors}
			readOnly={false}
			watch={watch}
			setValue={setValue}
			onDirectSubmit={onDirectSubmit}
		/>
	);
};

const AioBypassHarness = ({
	onDirectSubmit,
}: {
	onDirectSubmit: (payload: Partial<AioFormData>) => void;
}) => {
	const {
		control,
		formState: { errors },
		watch,
		setValue,
	} = useForm<AioFormData>({
		defaultValues: {
			processor: 'i5',
			has_no_ram: true,
			has_no_storage: true,
			screen_inches: '24',
			screen_condition: 'dead_pixels',
			dead_pixels_count: 7,
		},
	});

	return (
		<AioHardwareSection
			control={control}
			errors={errors}
			readOnly={false}
			watch={watch}
			setValue={setValue}
			onDirectSubmit={onDirectSubmit}
		/>
	);
};

describe('«No enciende» bypass payload', () => {
	it('monitor: envía dead_pixels_count en 0 junto a la pantalla rota', () => {
		const onDirectSubmit = vi.fn();
		render(<MonitorBypassHarness onDirectSubmit={onDirectSubmit} />);

		confirmNoEnciende();

		expect(onDirectSubmit).toHaveBeenCalledTimes(1);
		expect(onDirectSubmit.mock.calls[0][0]).toMatchObject({
			screen_condition: 'broken',
			spots_count: 0,
			dead_pixels_count: 0,
		});
	});

	it('AIO: envía dead_pixels_count en 0 junto a la pantalla rota', () => {
		const onDirectSubmit = vi.fn();
		render(<AioBypassHarness onDirectSubmit={onDirectSubmit} />);

		confirmNoEnciende();

		expect(onDirectSubmit).toHaveBeenCalledTimes(1);
		expect(onDirectSubmit.mock.calls[0][0]).toMatchObject({
			screen_condition: 'broken',
			dead_pixels_count: 0,
		});
	});
});
