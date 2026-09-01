import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { AioScreenSection } from '../aio/sections/AioScreenSection';
import MonitorScreenSection from '../monitor/sections/MonitorScreenSection';
import AioForm from '../aio/AioForm';
import MonitorForm from '../monitor/MonitorForm';
import { aioSchema, type AioFormData } from '../../validation/aio.schema';
import { monitorSchema, type MonitorFormData } from '../../validation/monitor.schema';

const formShellState = vi.hoisted(() => ({
	onValidateStep: undefined as
		| undefined
		| ((sectionKey: string) => Promise<{ isValid: boolean; message?: string }>),
}));

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

vi.mock('@/pages/refactor-technical-review/components/forms/shared/FormShell', () => ({
	default: ({
		onValidateStep,
	}: {
		onValidateStep?: (sectionKey: string) => Promise<{ isValid: boolean; message?: string }>;
	}) => {
		formShellState.onValidateStep = onValidateStep;
		return null;
	},
}));

interface ScreenHarnessProps {
	readOnly?: boolean;
	initialScreenCondition?: 'ok' | 'dead_pixels' | 'spots';
	initialDeadPixelsCount?: number;
	initialSpotsCount?: number;
}

const AioScreenHarness = ({
	readOnly = false,
	initialScreenCondition = 'ok',
	initialDeadPixelsCount,
}: ScreenHarnessProps) => {
	const {
		control,
		formState: { errors },
		watch,
		setValue,
	} = useForm<AioFormData>({
		defaultValues: {
			screen_condition: initialScreenCondition,
			dead_pixels_count: initialDeadPixelsCount,
		},
	});

	return (
		<>
			<AioScreenSection
				control={control}
				errors={errors}
				readOnly={readOnly}
				watch={watch}
				setValue={setValue}
			/>
			<output data-testid='dead-pixels-count'>
				{String(watch('dead_pixels_count') ?? '')}
			</output>
		</>
	);
};

const MonitorScreenHarness = ({
	readOnly = false,
	initialScreenCondition = 'ok',
	initialDeadPixelsCount,
	initialSpotsCount,
}: ScreenHarnessProps) => {
	const {
		control,
		formState: { errors },
		watch,
		setValue,
	} = useForm<MonitorFormData>({
		defaultValues: {
			screen_condition: initialScreenCondition,
			dead_pixels_count: initialDeadPixelsCount,
			spots_count: initialSpotsCount,
		},
	});

	return (
		<>
			<MonitorScreenSection
				control={control}
				errors={errors}
				readOnly={readOnly}
				watch={watch}
				setValue={setValue}
			/>
			<output data-testid='dead-pixels-count'>
				{String(watch('dead_pixels_count') ?? '')}
			</output>
			<output data-testid='spots-count'>{String(watch('spots_count') ?? '')}</output>
		</>
	);
};

describe.each([
	['AIO', aioSchema],
	['monitor', monitorSchema],
])('%s dead_pixels_count schema', (_equipmentType, schema) => {
	it('requires a positive counter only for dead pixels and clears it for other states', async () => {
		await expect(
			schema.validateAt('dead_pixels_count', {
				screen_condition: 'dead_pixels',
				dead_pixels_count: 1,
			}),
		).resolves.toBe(1);

		await expect(
			schema.validateAt('dead_pixels_count', {
				screen_condition: 'dead_pixels',
				dead_pixels_count: 0,
			}),
		).rejects.toThrow('Debe ser al menos 1');

		await expect(
			schema.validateAt('dead_pixels_count', {
				screen_condition: 'dead_pixels',
			}),
		).rejects.toThrow('Indica la cantidad de píxeles muertos');

		await expect(
			schema.validateAt('dead_pixels_count', {
				screen_condition: 'ok',
				dead_pixels_count: 3,
			}),
		).resolves.toBe(0);
	});
});

describe.each([
	['AIO', AioScreenHarness],
	['monitor', MonitorScreenHarness],
])('%s screen section', (_equipmentType, Harness) => {
	it('shows the dead-pixel counter only when selected and persists its increment', async () => {
		render(<Harness />);

		expect(screen.queryByText('Cantidad de píxeles muertos')).not.toBeInTheDocument();

		await act(async () => {
			fireEvent.click(screen.getByRole('radio', { name: 'Píxeles muertos' }));
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 0);
			});
		});

		expect(screen.getByText('Cantidad de píxeles muertos')).toBeInTheDocument();
		expect(screen.getByTestId('dead-pixels-count')).toHaveTextContent('1');
		expect(
			screen.getByRole('group', { name: 'Cantidad de píxeles muertos' }),
		).toBeInTheDocument();
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'Incrementar' }));
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 0);
			});
		});
		expect(screen.getByTestId('dead-pixels-count')).toHaveTextContent('2');

		const okScreenCondition = screen
			.getAllByRole('radio')
			.find((option) => option.dataset.value === 'ok');
		if (!okScreenCondition) {
			throw new Error('No se encontró la condición de pantalla OK');
		}

		await act(async () => {
			fireEvent.click(okScreenCondition);
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 0);
			});
		});
		expect(screen.getByTestId('dead-pixels-count')).toHaveTextContent('0');
	});

	it('disables the dead-pixel counter in read-only mode', () => {
		render(
			<Harness readOnly initialScreenCondition='dead_pixels' initialDeadPixelsCount={1} />,
		);

		expect(screen.getByRole('button', { name: 'Decrementar' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Incrementar' })).toBeDisabled();
	});
});

describe('monitor screen section spots counter', () => {
	it('clears the spots counter when the screen condition changes', async () => {
		render(<MonitorScreenHarness initialScreenCondition='spots' initialSpotsCount={3} />);

		const okScreenCondition = screen
			.getAllByRole('radio')
			.find((option) => option.dataset.value === 'ok');
		if (!okScreenCondition) {
			throw new Error('No se encontró la condición de pantalla OK');
		}

		await act(async () => {
			fireEvent.click(okScreenCondition);
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 0);
			});
		});

		expect(screen.getByTestId('spots-count')).toHaveTextContent('0');
	});
});

const VALID_AIO_SCREEN_VALUES: Record<string, unknown> = {
	screen_inches: '24',
	is_touchscreen: false,
	screen_condition: 'dead_pixels',
	stand_condition: 'ok',
	cover_condition: 'ok',
};

const VALID_MONITOR_SCREEN_VALUES: Record<string, unknown> = {
	screen_inches: '24',
	screen_resolution: '1920x1080',
	is_touchscreen: false,
	screen_condition: 'dead_pixels',
	stand_condition: 'ok',
	frame_condition: 'ok',
};

describe.each([
	['AIO', AioForm, VALID_AIO_SCREEN_VALUES],
	['monitor', MonitorForm, VALID_MONITOR_SCREEN_VALUES],
])('%s form screen validation', (_equipmentType, Form, defaultValues) => {
	it('blocks the screen step when dead pixels has no counter', async () => {
		formShellState.onValidateStep = undefined;
		render(
			<Form
				defaultValues={defaultValues}
				onSubmit={() => Promise.resolve()}
				onBack={() => undefined}
			/>,
		);

		let validation: { isValid: boolean; message?: string } | undefined;
		await act(async () => {
			validation = await formShellState.onValidateStep?.('screen');
		});

		expect(validation).toMatchObject({
			isValid: false,
			message: 'Indica la cantidad de píxeles muertos',
		});
	});
});
