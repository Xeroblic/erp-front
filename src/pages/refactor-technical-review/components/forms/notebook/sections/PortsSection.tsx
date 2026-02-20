import React from 'react';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { getNotebookLabel } from '../../../translations/notebook.labels';
import { NOTEBOOK_HINTS, NOTEBOOK_WARNINGS } from '../../../constants/notebook/notebook.hints';
import { StepperInput } from '../../../ui/StepperInput';
import { YesNoSelector } from '../../../ui/YesNoSelector';
import Icon from '@/components/icon/Icon';

const PORTS = [
	{ label: 'USB-A', name: 'usb_a_ports' as const },
	{ label: 'USB-C', name: 'usb_c_ports' as const },
	{ label: 'HDMI', name: 'hdmi_ports' as const },
	{ label: 'DP', name: 'displayport_ports' as const },
	{ label: 'VGA', name: 'vga_ports' as const },
	{ label: 'RJ45', name: 'rj45_ports' as const },
	{ label: 'SD', name: 'sd_readers' as const },
];

const PortsSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	readOnly,
	watch,
	setValue,
	errors,
}) => {
	const allPortsFunctional = watch('all_ports_functional');
	const defectivePorts = watch('defective_ports_count');

	const getNumericValue = (field: keyof NotebookFormData): number => {
		const val = watch(field);
		return typeof val === 'number' ? val : 0;
	};

	return (
		<div className='space-y-6'>
			<div className='flex w-full flex-col items-start gap-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-6 lg:flex-row'>
				<div className='w-full flex-[2]'>
					<div className='grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
						{PORTS.map((port) => (
							<div key={port.name} className='flex flex-col items-center gap-3 p-2'>
								<label className='text-[10px] font-bold uppercase tracking-widest text-zinc-500'>
									{port.label}
								</label>
								<div className='w-full max-w-[140px]'>
									<StepperInput
										value={getNumericValue(port.name)}
										onChange={(val) => !readOnly && setValue(port.name, val)}
										max={12}
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className='hidden h-full min-h-[150px] w-px bg-zinc-800 lg:block' />

				<div className='w-full flex-1 lg:max-w-[300px]'>
					<div className='flex h-full flex-col justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-6 shadow-sm'>
						<YesNoSelector
							label='¿Todos los Puertos Funcionan?'
							value={allPortsFunctional}
							onChange={(val) => {
								if (readOnly) return;
								setValue('all_ports_functional', val);
								if (val === true) {
									setValue('defective_ports_count', 0);
								}
							}}
						/>
						<p className='mt-4 text-center text-[11px] italic text-zinc-500'>
							Marca "No" si detectas pines doblados o puertos sin respuesta.
						</p>
					</div>
				</div>
			</div>

			{/* Defective Ports */}
			{allPortsFunctional === false && (
				<div className='animate-in zoom-in flex flex-col items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4 hover:cursor-pointer dark:border-red-800 dark:bg-red-900/20'>
					<label className='text-sm font-bold text-red-800 dark:text-red-200'>
						Puertos Defectuosos
					</label>
					<StepperInput
						value={getNumericValue('defective_ports_count')}
						onChange={(val) => {
							if (readOnly) return;
							setValue('defective_ports_count', val);
							if (val > 0) setValue('all_ports_functional', false);
						}}
					/>

					{/* Warning */}
					<div className='flex items-start gap-2 rounded-lg border border-red-200 bg-red-100 p-2 text-xs text-red-800 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200'>
						<Icon
							icon='HeroExclamationTriangle'
							className='mt-0.5 h-4 w-4 flex-shrink-0'
						/>
						<span>{NOTEBOOK_WARNINGS.defective_ports_count}</span>
					</div>
				</div>
			)}

			{errors.all_ports_functional && (
				<p className='text-center text-xs text-red-500'>
					{errors.all_ports_functional.message}
				</p>
			)}
		</div>
	);
};

export default PortsSection;
