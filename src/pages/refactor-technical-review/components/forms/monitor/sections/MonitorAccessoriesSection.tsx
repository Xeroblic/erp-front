import React from 'react';
import { Controller } from 'react-hook-form';
import { FormSectionProps } from '../../shared/types';
import { MonitorFormData } from '../../../validation/monitor.schema';
import Checkbox from '@/components/form/Checkbox';
import { getMonitorLabel } from '../../../translations/monitor.labels';
import Icon from '@/components/icon/Icon';

const MonitorAccessoriesSection: React.FC<FormSectionProps<MonitorFormData>> = ({
	control,
	readOnly,
}) => {
	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
				<div className='rounded-xl border border-blue-200 bg-blue-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-blue-500/20 dark:border-blue-800/50 dark:bg-blue-900/10 dark:hover:bg-blue-900/20'>
					<div className='flex items-center justify-between'>
						<h3 className='flex items-center gap-2 text-sm font-bold text-blue-900 dark:text-blue-100'>
							<Icon icon='HeroBolt' className='h-5 w-5' />
							{getMonitorLabel('includes_power_cable')}
						</h3>
						<Controller
							name='includes_power_cable'
							control={control}
							render={({ field }) => (
								<Checkbox
									variant='switch'
									color='blue'
									checked={Boolean(field.value)}
									onChange={() => !readOnly && field.onChange(!field.value)}
									disabled={readOnly}
								/>
							)}
						/>
					</div>
					<p className='mt-2 text-xs text-blue-700/80 dark:text-blue-300/80'>
						Marcar si incluye cable de alimentación.
					</p>
				</div>

				<div className='rounded-xl border border-teal-200 bg-teal-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-teal-500/20 dark:border-teal-800/50 dark:bg-teal-900/10 dark:hover:bg-teal-900/20'>
					<div className='flex items-center justify-between'>
						<h3 className='flex items-center gap-2 text-sm font-bold text-teal-900 dark:text-teal-100'>
							<Icon icon='HeroVideoCamera' className='h-5 w-5' />
							{getMonitorLabel('includes_video_cable')}
						</h3>
						<Controller
							name='includes_video_cable'
							control={control}
							render={({ field }) => (
								<Checkbox
									variant='switch'
									color='teal'
									checked={Boolean(field.value)}
									onChange={() => !readOnly && field.onChange(!field.value)}
									disabled={readOnly}
								/>
							)}
						/>
					</div>
					<p className='mt-2 text-xs text-teal-700/80 dark:text-teal-300/80'>
						Marcar si incluye cable VGA/HDMI/DP.
					</p>
				</div>

				<div className='rounded-xl border border-amber-200 bg-amber-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-amber-500/20 dark:border-amber-800/50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20'>
					<div className='flex items-center justify-between'>
						<h3 className='flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-100'>
							<Icon icon='HeroBarsArrowUp' className='h-5 w-5' />
							{getMonitorLabel('includes_stand')}
						</h3>
						<Controller
							name='includes_stand'
							control={control}
							render={({ field }) => (
								<Checkbox
									variant='switch'
									color='amber'
									checked={Boolean(field.value)}
									onChange={() => !readOnly && field.onChange(!field.value)}
									disabled={readOnly}
								/>
							)}
						/>
					</div>
					<p className='mt-2 text-xs text-amber-700/80 dark:text-amber-300/80'>
						Marcar si tiene soporte armable/fijo.
					</p>
				</div>

				<div className='rounded-xl border border-purple-200 bg-purple-500/10 p-6 transition-colors duration-200 hover:cursor-pointer hover:bg-purple-500/20 dark:border-purple-800/50 dark:bg-purple-900/10 dark:hover:bg-purple-900/20'>
					<div className='flex items-center justify-between'>
						<h3 className='flex items-center gap-2 text-sm font-bold text-purple-900 dark:text-purple-100'>
							<Icon icon='HeroUsbCable' className='h-5 w-5' />
							{getMonitorLabel('has_usb_hub')}
						</h3>
						<Controller
							name='has_usb_hub'
							control={control}
							render={({ field }) => (
								<Checkbox
									variant='switch'
									color='purple'
									checked={Boolean(field.value)}
									onChange={() => !readOnly && field.onChange(!field.value)}
									disabled={readOnly}
								/>
							)}
						/>
					</div>
					<p className='mt-2 text-xs text-purple-700/80 dark:text-purple-300/80'>
						Marcar si tiene entradas USB Hub activas integradas.
					</p>
				</div>
			</div>
		</div>
	);
};

export default MonitorAccessoriesSection;
