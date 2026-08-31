import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { AioScreenSection } from '../aio/sections/AioScreenSection';
import MonitorScreenSection from '../monitor/sections/MonitorScreenSection';
import { aioSchema, type AioFormData } from '../../validation/aio.schema';
import { monitorSchema, type MonitorFormData } from '../../validation/monitor.schema';

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

interface ScreenHarnessProps {
	readOnly?: boolean;
	initialScreenCondition?: 'ok' | 'dead_pixels';
	initialDeadPixelsCount?: number;
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
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: 'Incrementar' }));
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 0);
			});
		});
		expect(screen.getByTestId('dead-pixels-count')).toHaveTextContent('1');
	});

	it('disables the dead-pixel counter in read-only mode', () => {
		render(
			<Harness readOnly initialScreenCondition='dead_pixels' initialDeadPixelsCount={1} />,
		);

		expect(screen.getByRole('button', { name: 'Decrementar' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Incrementar' })).toBeDisabled();
	});
});
