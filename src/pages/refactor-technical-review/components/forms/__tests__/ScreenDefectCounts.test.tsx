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
	getValues: undefined as undefined | (() => Record<string, unknown>),
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
		sectionProps,
	}: {
		onValidateStep?: (sectionKey: string) => Promise<{ isValid: boolean; message?: string }>;
		sectionProps?: { getValues?: () => Record<string, unknown> };
	}) => {
		formShellState.onValidateStep = onValidateStep;
		formShellState.getValues = sectionProps?.getValues;
		return null;
	},
}));

interface ScreenHarnessProps {
	readOnly?: boolean;
	initialScreenCondition?: 'ok' | 'dead_pixels';
	initialDeadPixelsCount?: number;
}

interface MonitorScreenHarnessProps extends Omit<ScreenHarnessProps, 'initialScreenCondition'> {
	initialScreenCondition?: 'ok' | 'dead_pixels' | 'spots';
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
}: MonitorScreenHarnessProps) => {
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
	// `readOnly` desactiva la normalización al cargar, dejando observable el estado
	// inválido: así la prueba sigue ejerciendo el registro de `dead_pixels_count` en
	// los campos de la sección Pantalla y el `min(1)` del schema, que son la línea
	// que evita el 422.
	it('blocks the screen step when dead pixels has no counter', async () => {
		formShellState.onValidateStep = undefined;
		render(
			<Form
				defaultValues={defaultValues}
				onSubmit={() => Promise.resolve()}
				onBack={() => undefined}
				readOnly
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

// ─── Normalización de contadores al cargar un borrador existente ──────────────
// El autosave y el bypass «No enciende» leen los valores crudos de RHF: un par
// incoherente que llega del backend debe corregirse al montar, no sólo cuando el
// técnico vuelve a tocar la tarjeta de condición.
describe.each([
	['AIO', AioForm],
	['monitor', MonitorForm],
])('%s form counter normalization on load', (_equipmentType, Form) => {
	const renderForm = async (defaultValues: Record<string, unknown>) => {
		formShellState.getValues = undefined;
		formShellState.onValidateStep = undefined;
		render(
			<Form
				defaultValues={defaultValues}
				onSubmit={() => Promise.resolve()}
				onBack={() => undefined}
			/>,
		);
		await act(async () => {
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 0);
			});
		});
	};

	it('seeds the minimum count for a draft saved with dead pixels and no counter', async () => {
		await renderForm({ screen_condition: 'dead_pixels' });

		expect(formShellState.getValues?.().dead_pixels_count).toBe(1);
	});

	it('clears a stale counter for a draft whose condition is no longer dead pixels', async () => {
		await renderForm({ screen_condition: 'ok', dead_pixels_count: 5 });

		expect(formShellState.getValues?.().dead_pixels_count).toBe(0);
	});

	it('keeps a valid counter untouched', async () => {
		await renderForm({ screen_condition: 'dead_pixels', dead_pixels_count: 4 });

		expect(formShellState.getValues?.().dead_pixels_count).toBe(4);
	});
});

describe('monitor form spots normalization on load', () => {
	const renderMonitor = async (defaultValues: Record<string, unknown>) => {
		formShellState.getValues = undefined;
		render(
			<MonitorForm
				defaultValues={defaultValues}
				onSubmit={() => Promise.resolve()}
				onBack={() => undefined}
			/>,
		);
		await act(async () => {
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 0);
			});
		});
	};

	it('clears a stale spots counter for a draft whose condition is no longer spots', async () => {
		await renderMonitor({ screen_condition: 'ok', spots_count: 3 });

		expect(formShellState.getValues?.().spots_count).toBe(0);
	});

	it('seeds the minimum spots counter for a draft saved with spots and no counter', async () => {
		await renderMonitor({ screen_condition: 'spots' });

		expect(formShellState.getValues?.().spots_count).toBe(1);
	});
});
