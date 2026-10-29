import React from 'react';
import Icon from '@/components/icon/Icon';
import { FormSectionProps } from '../../shared/types';
import { AioFormData } from '../../../validation/aio.schema';
import { StepperInput } from '../../../ui/StepperInput';
import { AIO_HINTS } from '../../../constants/aio/aio.hints';
import { getAioLabel } from '../../../translations/aio.labels';
import { PortConditionFields } from '../../shared/PortConditionFields';
import {
	MAX_PORT_COUNT,
	PORT_COUNTER_FIELDS,
	sumPortTypeCounts,
} from '../../../validation/constants/ports.rules';
import { PORT_COUNTER_VISUALS } from '../../../constants/ports.visuals';

export const AioPortsSection: React.FC<FormSectionProps<AioFormData>> = ({
	errors,
	readOnly,
	values,
	setFieldValue,
	schemaFields,
}) => {
	const getPortCount = (field: string): number => {
		const value = values[field as keyof AioFormData];
		return typeof value === 'number' ? value : 0;
	};
	const setPortCount = (field: string, value: number) =>
		setFieldValue(field as keyof AioFormData, value as AioFormData[keyof AioFormData]);

	// La respuesta y el contador ya no pueden contradecirse: responder «no hay puertos
	// defectuosos» limpia el contador, y responder «sí» lo deja como mínimo en 1. El
	// efecto que los sincronizaba a posteriori dejó de hacer falta.
	const allFunctional = values.all_ports_functional;
	const loosePortTypes = values.loose_port_types;
	const defectivePortTypes = values.defective_port_types;
	// El total persistido: es el único que existe mientras el desglose no se haya medido.
	const defectivePortsCount = values.defective_ports_count;

	return (
		<div className='space-y-8'>
			<div className='rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50'>
				<h4 className='mb-4 text-sm font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400'>
					Cantidad de Puertos
				</h4>

				<div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
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
									{getAioLabel(key)}
								</label>
								<div className='w-full'>
									<StepperInput
										label={getAioLabel(key)}
										value={getPortCount(key)}
										onChange={(val) => !readOnly && setPortCount(key, val)}
										max={MAX_PORT_COUNT}
									/>
								</div>
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
				defectivePortsCount={defectivePortsCount}
				onAllPortsFunctionalChange={(value) =>
					setFieldValue('all_ports_functional', value, { touch: true })
				}
				onDefectivePortTypesChange={(value) => {
					setFieldValue('defective_port_types', value);
					// El backend sigue esperando el total de defectuosos como campo propio
					// (a diferencia del de sueltos, que deriva del desglose). Se calcula acá
					// para que no pueda contradecir al detalle que el técnico acaba de marcar.
					setFieldValue('defective_ports_count', sumPortTypeCounts(value), {
						touch: true,
					});
				}}
				onLoosePortTypesChange={(value) => setFieldValue('loose_port_types', value)}
				defectiveWarningFallback={AIO_HINTS.defective_ports_count}
				allPortsFunctionalError={errors.all_ports_functional}
				defectiveCountError={errors.defective_ports_count}
			/>
		</div>
	);
};

export default AioPortsSection;
