import React, { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { FormSectionProps } from '../../shared/types';
import { MonitorFormData } from '../../../validation/monitor.schema';
import { StepperInput } from '../../../ui/StepperInput';
import { YesNoSelector } from '../../../ui/YesNoSelector';
import { MONITOR_HINTS, MONITOR_WARNINGS } from '../../../constants/monitor/monitor.hints';
import { getMonitorLabel } from '../../../translations/monitor.labels';
import Icon from '@/components/icon/Icon';

const PORTS_CONFIG = [
	{ key: 'vga_ports', icon: 'Video', color: 'orange' },
	{ key: 'hdmi_ports', icon: 'DeviceTv', color: 'emerald' },
	{ key: 'displayport_ports', icon: 'MonitorSpeaker', color: 'indigo' },
	{ key: 'dvi_ports', icon: 'ViewColumns', color: 'zinc' },
	{ key: 'usb_c_ports', icon: 'UsbSymbol', color: 'sky' },
	{ key: 'rj45_ports', icon: 'Squares2X2', color: 'violet' },
	{ key: 'usb_hub_ports', icon: 'UsbSymbol', color: 'blue' },
] as const;

export const MonitorPortsSection: React.FC<FormSectionProps<MonitorFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	const defectiveCount = watch('defective_ports_count') || 0;
	const defectiveCriticalCount = watch('defective_ports_critical_count') || 0;
	const allFunctional = watch('all_ports_functional');

	// Auto-uncheck "all ports functional" if defective ports are found
	useEffect(() => {
		if ((defectiveCount > 0 || defectiveCriticalCount > 0) && allFunctional) {
			setValue('all_ports_functional', false, { shouldValidate: true });
		}
	}, [defectiveCount, defectiveCriticalCount, allFunctional, setValue]);

	return (
		<div className='space-y-8'>
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50'>
				<h4 className='mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
					Cantidad de Puertos
				</h4>

				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5'>
					{PORTS_CONFIG.map(({ key, icon, color }) => (
						<div
							key={key}
							className={`rounded-xl border hover:cursor-pointer border-${color}-200 bg-${color}-500/10 p-4 transition-colors duration-200 hover:bg-${color}-500/20 dark:border-${color}-800/50 dark:bg-${color}-900/10 dark:hover:bg-${color}-900/20`}>
							<label
								className={`mb-3 flex items-center gap-2 text-xs font-bold text-${color}-800 dark:text-${color}-200`}>
								<Icon icon={icon} className='h-4 w-4' />
								{getMonitorLabel(key)}
							</label>
							<Controller
								name={key as keyof MonitorFormData}
								control={control}
								render={({ field }) => (
									<div className='w-full'>
										<StepperInput
											value={
												typeof field.value === 'number' ? field.value : 0
											}
											onChange={(val) => !readOnly && field.onChange(val)}
											max={16}
										/>
									</div>
								)}
							/>
						</div>
					))}
				</div>
			</div>

			<div
				className={`grid grid-cols-1 gap-8 ${
					allFunctional === false ? 'md:grid-cols-1' : ''
				}`}>
				<div
					className={`rounded-xl border p-6 transition-colors duration-200 hover:cursor-pointer ${
						defectiveCount > 0 || defectiveCriticalCount > 0
							? 'border-red-200 bg-red-500/10 hover:bg-red-500/20 dark:border-red-800/50 dark:bg-red-900/10 dark:hover:bg-red-900/20'
							: 'border-green-200 bg-green-500/10 hover:bg-green-500/20 dark:border-green-800/50 dark:bg-green-900/10 dark:hover:bg-green-900/20'
					}`}>
					<div className='mb-3 flex items-center justify-between'>
						<label className='flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100'>
							<Icon
								icon='HeroShieldCheck'
								className='h-5 w-5 text-green-600 dark:text-green-400'
							/>
							{getMonitorLabel('all_ports_functional')}
						</label>
						<div className='min-w-[120px]'>
							<YesNoSelector
								label=''
								value={allFunctional}
								onChange={(val) => {
									if (
										readOnly ||
										defectiveCount > 0 ||
										defectiveCriticalCount > 0
									)
										return;
									setValue('all_ports_functional', val, {
										shouldValidate: true,
									});
									if (val === true) {
										setValue('defective_ports_count', 0, {
											shouldValidate: true,
										});
										setValue('defective_ports_critical_count', 0, {
											shouldValidate: true,
										});
									}
								}}
							/>
						</div>
					</div>
					<p className='text-xs text-zinc-500'>
						{defectiveCount > 0 || defectiveCriticalCount > 0
							? 'No seleccionable si hay puertos en mal estado'
							: 'Márcalo si probaste todos los puertos y no hay fallas'}
					</p>
					{errors.all_ports_functional && (
						<p className='mt-2 text-xs text-red-500'>
							{errors.all_ports_functional.message}
						</p>
					)}
				</div>

				{allFunctional === false && (
					<div className='animate-in zoom-in grid grid-cols-1 gap-6 md:grid-cols-2'>
						{/* Regular Defective Ports */}
						<div className='rounded-xl border border-red-200 bg-red-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-red-500/20 dark:border-red-800/50 dark:bg-red-900/10 dark:hover:bg-red-900/20'>
							<label className='mb-3 flex items-center gap-2 font-bold text-red-900 dark:text-red-100'>
								<Icon
									icon='HeroExclamationTriangle'
									className='h-5 w-5 text-red-600 dark:text-red-400'
								/>
								{getMonitorLabel('defective_ports_count')}
							</label>
							<Controller
								name='defective_ports_count'
								control={control}
								render={({ field }) => (
									<div className='w-[140px]'>
										<StepperInput
											value={
												typeof field.value === 'number' ? field.value : 0
											}
											onChange={(val) => {
												if (readOnly) return;
												field.onChange(val);
												if (val > 0)
													setValue('all_ports_functional', false, {
														shouldValidate: true,
													});
											}}
											max={20}
										/>
									</div>
								)}
							/>
							{errors.defective_ports_count && (
								<p className='mt-1 text-xs text-red-500'>
									{errors.defective_ports_count.message}
								</p>
							)}
							<p className='mt-2 text-xs font-semibold text-red-600 dark:text-red-400'>
								{MONITOR_HINTS.defective_ports_count}
							</p>
						</div>

						{/* Critical Defective Ports */}
						<div className='rounded-xl border border-amber-200 bg-amber-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-amber-500/20 dark:border-amber-800/50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20'>
							<label className='mb-3 flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100'>
								<Icon
									icon='HeroBellAlert'
									className='h-5 w-5 text-amber-600 dark:text-amber-400'
								/>
								{getMonitorLabel('defective_ports_critical_count')}
							</label>
							<Controller
								name='defective_ports_critical_count'
								control={control}
								render={({ field }) => (
									<div className='w-[140px]'>
										<StepperInput
											value={
												typeof field.value === 'number' ? field.value : 0
											}
											onChange={(val) => {
												if (readOnly) return;
												field.onChange(val);
												if (val > 0)
													setValue('all_ports_functional', false, {
														shouldValidate: true,
													});
											}}
											max={20}
										/>
									</div>
								)}
							/>
							{errors.defective_ports_critical_count && (
								<p className='mt-1 text-xs text-red-500'>
									{errors.defective_ports_critical_count.message}
								</p>
							)}
							<p className='mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400'>
								{MONITOR_HINTS.defective_ports_critical_count}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default MonitorPortsSection;
