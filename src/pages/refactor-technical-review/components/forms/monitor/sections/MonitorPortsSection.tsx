import React from 'react';
import { Controller } from 'react-hook-form';
import Icon from '@/components/icon/Icon';
import { FormSectionProps } from '../../shared/types';
import { MonitorFormData } from '../../../validation/monitor.schema';
import { StepperInput } from '../../../ui/StepperInput';
import { MONITOR_HINTS } from '../../../constants/monitor/monitor.hints';
import { getMonitorLabel } from '../../../translations/monitor.labels';
import { PortConditionFields } from '../../shared/PortConditionFields';
import {
	MAX_PORT_COUNT,
	PORT_COUNTER_FIELDS,
	sumPortTypeCounts,
} from '../../../validation/constants/ports.rules';
import { PORT_COUNTER_VISUALS } from '../../../constants/ports.visuals';

export const MonitorPortsSection: React.FC<FormSectionProps<MonitorFormData>> = ({
	control,
	errors,
	readOnly,
	watch,
	setValue,
	schemaFields,
}) => {
	// La respuesta y el contador ya no pueden contradecirse: responder «no hay puertos
	// defectuosos» limpia el contador, y responder «sí» lo deja como mínimo en 1. El
	// efecto que los sincronizaba a posteriori dejó de hacer falta.
	const loosePortTypes = watch('loose_port_types');
	const defectivePortTypes = watch('defective_port_types');
	const allFunctional = watch('all_ports_functional');

	return (
		<div className='space-y-8'>
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50'>
				<h4 className='mb-4 text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400'>
					Cantidad de Puertos
				</h4>

				<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5'>
					{PORT_COUNTER_FIELDS.map((port) => {
						const { icon, color } = PORT_COUNTER_VISUALS[port.type];
						const key = port.column;

						return (
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
												label={getMonitorLabel(key)}
												value={
													typeof field.value === 'number'
														? field.value
														: 0
												}
												onChange={(val) => !readOnly && field.onChange(val)}
												max={MAX_PORT_COUNT}
											/>
										</div>
									)}
								/>
							</div>
						);
					})}
				</div>
			</div>

			<PortConditionFields
				schemaFields={schemaFields}
				readOnly={readOnly}
				allPortsFunctional={allFunctional}
				defectivePortTypes={defectivePortTypes}
				loosePortTypes={loosePortTypes}
				onAllPortsFunctionalChange={(value) =>
					setValue('all_ports_functional', value, { shouldValidate: true })
				}
				onDefectivePortTypesChange={(value) => {
					setValue('defective_port_types', value);
					// El backend sigue esperando el total de defectuosos como campo propio
					// (a diferencia del de sueltos, que deriva del desglose). Se calcula acá
					// para que no pueda contradecir al detalle que el técnico acaba de marcar.
					setValue('defective_ports_count', sumPortTypeCounts(value), {
						shouldValidate: true,
					});
				}}
				onLoosePortTypesChange={(value) => setValue('loose_port_types', value)}
				defectiveWarningFallback={MONITOR_HINTS.defective_ports_count}
				allPortsFunctionalError={errors.all_ports_functional?.message}
				defectiveCountError={errors.defective_ports_count?.message}
				defectiveExtras={
					// Los puertos críticos son un contador aparte del monitor: viven dentro
					// del mismo contenedor porque sólo tienen sentido si hay defectuosos.
					<div className='rounded-lg border border-amber-200 bg-amber-100/60 p-3 dark:border-amber-700 dark:bg-amber-900/30'>
						<label className='mb-2 flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-100'>
							<Icon icon='HeroBellAlert' className='h-4 w-4' />
							{getMonitorLabel('defective_ports_critical_count')}
						</label>
						<Controller
							name='defective_ports_critical_count'
							control={control}
							render={({ field }) => (
								<div className='w-[140px]'>
									<StepperInput
										value={typeof field.value === 'number' ? field.value : 0}
										onChange={(value) => !readOnly && field.onChange(value)}
										max={MAX_PORT_COUNT}
									/>
								</div>
							)}
						/>
						{errors.defective_ports_critical_count && (
							<p className='mt-1 text-xs text-red-500'>
								{errors.defective_ports_critical_count.message}
							</p>
						)}
						<p className='mt-2 text-xs text-amber-800 dark:text-amber-200'>
							{MONITOR_HINTS.defective_ports_critical_count}
						</p>
					</div>
				}
			/>
		</div>
	);
};

export default MonitorPortsSection;
