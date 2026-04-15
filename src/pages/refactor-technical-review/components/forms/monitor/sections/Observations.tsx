


import Icon from '@/components/icon/Icon'
import React from 'react'
import { getMonitorLabel } from '../../../translations/monitor.labels'
import { Controller } from 'react-hook-form'
import Textarea from '@/components/form/Textarea'
import { MONITOR_HINTS, MONITOR_PLACEHOLDERS } from '../../../constants/monitor/monitor.hints'
import { FormSectionProps } from '../../shared/types'
import { MonitorFormData } from '../../../validation/monitor.schema'

const Observations : React.FC<FormSectionProps<MonitorFormData>> = ({
    control,
    errors,
    readOnly,
}) => {
  return (
    
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-colors duration-200 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700'>
				<label className='mb-3 flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300'>
					<Icon icon='HeroDocumentText' className='h-5 w-5' />
					{getMonitorLabel('observations')}
				</label>
				<p className='mb-4 text-xs text-zinc-500'>{MONITOR_HINTS.observations}</p>
				<Controller
					name='observations'
					control={control}
					render={({ field }) => (
						<Textarea
							{...field}
							value={field.value ?? ''}
							placeholder={MONITOR_PLACEHOLDERS.observations}
							disabled={readOnly}
							rows={4}
							className={`w-full ${errors.observations ? 'border-red-500' : ''}`}
						/>
					)}
				/>
				{errors.observations && (
					<p className='mt-2 text-xs font-semibold text-red-500'>
						{errors.observations.message}
					</p>
				)}
			</div>
  )
}

export default Observations
