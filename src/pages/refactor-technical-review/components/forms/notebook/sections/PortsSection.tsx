import React from 'react';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { NOTEBOOK_WARNINGS } from '../../../constants/notebook/notebook.hints';
import { StepperInput } from '../../../ui/StepperInput';
import { PortConditionFields } from '../../shared/PortConditionFields';
import {
	MAX_PORT_COUNT,
	PORT_COUNTER_FIELDS,
	sumPortTypeCounts,
} from '../../../validation/constants/ports.rules';

const PortsSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	readOnly,
	watch,
	setValue,
	errors,
	schemaFields,
}) => {
	const allPortsFunctional = watch('all_ports_functional');
	const loosePortTypes = watch('loose_port_types');
	const defectivePortTypes = watch('defective_port_types');

	const getNumericValue = (field: keyof NotebookFormData): number => {
		const val = watch(field);
		return typeof val === 'number' ? val : 0;
	};

	return (
		<div className='space-y-6'>
			<div className='flex w-full flex-col items-start gap-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-6 lg:flex-row'>
				<div className='w-full flex-[2]'>
					<div className='grid grid-cols-2 gap-6 md:grid-cols-3'>
						{PORT_COUNTER_FIELDS.map((port) => {
							const name = port.column as keyof NotebookFormData;

							return (
								<div
									key={port.column}
									className='flex flex-col items-center gap-3 p-2'>
									<label className='text-[10px] font-bold uppercase tracking-widest text-zinc-500'>
										{port.short}
									</label>
									<div className='w-full max-w-[140px]'>
										<StepperInput
											label={port.short}
											value={getNumericValue(name)}
											onChange={(val) => !readOnly && setValue(name, val)}
											max={MAX_PORT_COUNT}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<PortConditionFields
				schemaFields={schemaFields}
				readOnly={readOnly}
				allPortsFunctional={allPortsFunctional}
				defectivePortTypes={defectivePortTypes}
				loosePortTypes={loosePortTypes}
				onAllPortsFunctionalChange={(value) => setValue('all_ports_functional', value)}
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
				defectiveWarningFallback={NOTEBOOK_WARNINGS.defective_ports_count}
				allPortsFunctionalError={errors.all_ports_functional?.message}
				defectiveCountError={errors.defective_ports_count?.message}
			/>
		</div>
	);
};

export default PortsSection;
