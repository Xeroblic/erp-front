import React from 'react';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { getNotebookLabel } from '../../../translations/notebook.labels';
import { NOTEBOOK_HINTS } from '../../../constants/notebook/notebook.hints';
import { SelectionCard } from '../../../ui/SelectionCard';
import { YesNoSelector } from '../../../ui/YesNoSelector';
import { GENERAL_CONDITION_OPTIONS } from '../../../constants/notebook/notebook.options';

const AestheticsSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	errors,
	readOnly,
	watch,
	setValue,
	schemaFields,
}) => {
	// ZF-102. `powers_on` es booleano: no depende de `allowed_values`, así que —como en
	// desktop— se muestra siempre y del schema remoto sólo sale su rotulado. El selector
	// de tres estados distingue «no respondido» de «no enciende»: `false` es una respuesta
	// completa que lleva el equipo a grado M.
	const powersOnField = schemaFields?.powers_on;

	return (
		<div className='space-y-6 hover:cursor-pointer'>
			{/* General Condition */}
			<div className='rounded-xl border border-green-200 bg-green-500/20 p-4 transition-colors duration-200 hover:cursor-pointer hover:bg-green-500/30 dark:border-green-800 dark:bg-green-900/10 dark:hover:bg-green-900/30'>
				<label className='mb-3 block text-center text-sm font-bold text-green-800 dark:text-green-200'>
					{getNotebookLabel('general_condition')} <span className='text-red-500'>*</span>
				</label>
				<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
					{GENERAL_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={watch('general_condition') === opt.value}
							onClick={() => !readOnly && setValue('general_condition', opt.value)}
						/>
					))}
				</div>
				{errors.general_condition && (
					<p className='mt-2 text-center text-xs text-red-500'>
						{errors.general_condition.message}
					</p>
				)}
				<p className='mt-2 text-center text-xs text-zinc-500'>
					{NOTEBOOK_HINTS.general_condition}
				</p>
			</div>

			{/* Powers On (ZF-102) */}
			<div className='rounded-xl border border-blue-200 bg-blue-500/10 p-4 dark:border-blue-800 dark:bg-blue-900/10'>
				<YesNoSelector
					label={powersOnField?.label ?? '¿El equipo enciende?'}
					required={powersOnField?.required ?? true}
					disabled={readOnly}
					value={watch('powers_on')}
					onChange={(val) => !readOnly && setValue('powers_on', val)}
				/>
				{errors.powers_on && (
					<p className='mt-2 text-center text-xs text-red-500'>
						{errors.powers_on.message}
					</p>
				)}
				{powersOnField?.hint && (
					<p className='mt-2 text-center text-xs text-zinc-500'>{powersOnField.hint}</p>
				)}
				{powersOnField?.warning && (
					<p className='mt-2 text-center text-xs text-blue-800 dark:text-blue-300'>
						{powersOnField.warning}
					</p>
				)}
			</div>

			{/* Connectivity Booleans */}
			<div className='grid grid-cols-1 gap-4 hover:cursor-pointer md:grid-cols-3'>
				<YesNoSelector
					label='¿Tiene WiFi?'
					value={watch('has_wifi')}
					onChange={(val) => !readOnly && setValue('has_wifi', val)}
				/>
				<YesNoSelector
					label='¿Tiene Bluetooth?'
					value={watch('has_bluetooth')}
					onChange={(val) => !readOnly && setValue('has_bluetooth', val)}
				/>
				<YesNoSelector
					label='¿Tiene Biométrico?'
					value={watch('has_biometric')}
					onChange={(val) => !readOnly && setValue('has_biometric', val)}
				/>
			</div>
		</div>
	);
};

export default AestheticsSection;
