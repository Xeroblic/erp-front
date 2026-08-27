import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FieldValues } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import AioForm from '../../aio/AioForm';
import DesktopForm from '../../desktop/DesktopForm';
import NotebookForm from '../../notebook/NotebookForm';
import type { FormSectionProps } from '../types';

vi.mock('@/components/form/Checkbox', () => ({
	default: ({
		checked,
		label,
		onChange,
	}: {
		checked?: boolean;
		label?: string;
		onChange?: React.ChangeEventHandler<HTMLInputElement>;
	}) => (
		<label>
			<input type='checkbox' checked={checked} onChange={onChange} />
			{label}
		</label>
	),
}));

vi.mock('@/components/form/Input', () => ({
	default: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
		(props, ref) => <input {...props} ref={ref} />,
	),
}));

vi.mock('@/pages/refactor-technical-review/components/ui/InputUnitSelector', () => ({
	InputUnitSelector: ({ value }: { value: string }) => <input value={value} readOnly />,
}));

vi.mock('@/pages/refactor-technical-review/components/ui/selectors/ProcessorSelector', () => ({
	ProcessorSelector: () => <div data-testid='processor-selector' />,
}));

vi.mock('@/components/icon/Icon', () => ({
	default: () => <span data-testid='icon' />,
}));

vi.mock('@/pages/refactor-technical-review/components/forms/shared/NoEnciendeButton', () => ({
	NoEnciendeButton: () => null,
}));

vi.mock('@/pages/refactor-technical-review/components/forms/shared/FormShell', () => ({
	default: ({
		sections,
		sectionProps,
	}: {
		sections: Array<{
			key: string;
			component: React.ComponentType<FormSectionProps<FieldValues>>;
		}>;
		sectionProps: FormSectionProps<FieldValues>;
	}) => {
		const HardwareSection = sections.find(({ key }) => key === 'hardware')?.component;

		return HardwareSection ? (
			<HardwareSection
				control={sectionProps.control}
				errors={sectionProps.errors}
				readOnly={sectionProps.readOnly}
				watch={sectionProps.watch}
				setValue={sectionProps.setValue}
				onDirectSubmit={sectionProps.onDirectSubmit}
			/>
		) : null;
	},
}));

const HARDWARE_DEFAULT_VALUES: Record<string, unknown> = {
	has_no_ram: false,
	has_no_storage: false,
	ram_size: '8GB',
	ram_slots: '2',
	ram_type: 'DDR4',
	storage_size: '512GB',
	storage_technology: 'SSD',
};

const onSubmit = (): Promise<void> => Promise.resolve();
const onBack = (): void => undefined;

interface HardwareHarnessProps {
	registerGetFormValues: (getter: () => Record<string, unknown>) => void;
}

const hardwareForms = [
	{
		name: 'notebook',
		Harness: ({ registerGetFormValues }: HardwareHarnessProps) => (
			<NotebookForm
				defaultValues={HARDWARE_DEFAULT_VALUES}
				onSubmit={onSubmit}
				onBack={onBack}
				registerGetFormValues={registerGetFormValues}
			/>
		),
	},
	{
		name: 'desktop',
		Harness: ({ registerGetFormValues }: HardwareHarnessProps) => (
			<DesktopForm
				defaultValues={HARDWARE_DEFAULT_VALUES}
				onSubmit={onSubmit}
				onBack={onBack}
				registerGetFormValues={registerGetFormValues}
			/>
		),
	},
	{
		name: 'AIO',
		Harness: ({ registerGetFormValues }: HardwareHarnessProps) => (
			<AioForm
				defaultValues={HARDWARE_DEFAULT_VALUES}
				onSubmit={onSubmit}
				onBack={onBack}
				registerGetFormValues={registerGetFormValues}
			/>
		),
	},
];

describe.each(hardwareForms)('Hardware sections: $name', ({ Harness }) => {
	it('preserves hardware values through the real absence collapse and restore cycle', async () => {
		let getValues: (() => Record<string, unknown>) | undefined;
		render(
			<Harness
				registerGetFormValues={(getter) => {
					getValues = getter;
				}}
			/>,
		);

		fireEvent.click(screen.getByRole('checkbox', { name: 'Tiene RAM' }));
		fireEvent.click(screen.getByRole('checkbox', { name: 'Tiene disco' }));

		expect(screen.getByText('No tiene RAM')).toBeInTheDocument();
		expect(screen.getByText('No tiene disco')).toBeInTheDocument();

		fireEvent.click(screen.getByRole('checkbox', { name: 'Tiene RAM' }));
		fireEvent.click(screen.getByRole('checkbox', { name: 'Tiene disco' }));

		await waitFor(() => {
			expect(getValues?.()).toMatchObject(HARDWARE_DEFAULT_VALUES);
			expect(screen.getByDisplayValue('8GB')).toBeInTheDocument();
			expect(screen.getByDisplayValue('2')).toBeInTheDocument();
			expect(screen.getByDisplayValue('512GB')).toBeInTheDocument();
			expect(screen.getByRole('radio', { name: 'DDR4' })).toHaveAttribute(
				'aria-checked',
				'true',
			);
			expect(screen.getByRole('radio', { name: /SSD/ })).toHaveAttribute(
				'aria-checked',
				'true',
			);
		});
	});
});
