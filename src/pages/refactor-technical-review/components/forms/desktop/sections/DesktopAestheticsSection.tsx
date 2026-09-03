import React from 'react';
import Icon from '@/components/icon/Icon';
import type { FormSectionProps } from '../../shared/types';
import type { DesktopFormData } from '../../../validation/desktop.schema';
import { getDesktopLabel } from '../../../translations/desktop.labels';
import { DESKTOP_HINTS, DESKTOP_WARNINGS } from '../../../constants/desktop/desktop.hints';
import { SelectionCard } from '../../../ui/SelectionCard';
import {
	GENERAL_CONDITION_OPTIONS,
	COVER_CONDITION_OPTIONS,
} from '../../../constants/desktop/desktop.options';
import { YesNoSelector } from '../../../ui/YesNoSelector';

const DesktopAestheticsSection: React.FC<FormSectionProps<DesktopFormData>> = ({
	errors,
	readOnly,
	watch,
	setValue,
	schemaFields,
}) => {
	const generalCondition = watch('general_condition');
	const coverCondition = watch('cover_condition');
	const powersOnField = schemaFields?.powers_on;

	return (
		<div className='space-y-6'>
			{/* General Condition */}
			<div className='rounded-xl border border-teal-200 bg-teal-50 p-6 transition-colors hover:bg-teal-100/50 dark:border-teal-900/30 dark:bg-teal-900/10'>
				<label className='mb-4 block text-center text-sm font-bold text-teal-800 dark:text-teal-200'>
					{getDesktopLabel('general_condition')} <span className='text-red-500'>*</span>
				</label>
				<div className='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5'>
					{GENERAL_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={generalCondition === opt.value}
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
					{DESKTOP_HINTS.general_condition}
				</p>
			</div>

			{/* Cover Condition */}
			<div className='rounded-xl border border-orange-200 bg-orange-50 p-6 transition-colors hover:bg-orange-100/50 dark:border-orange-900/30 dark:bg-orange-900/10'>
				<label className='mb-4 block text-center text-sm font-bold text-orange-800 dark:text-orange-200'>
					{getDesktopLabel('cover_condition')} <span className='text-red-500'>*</span>
				</label>
				<div className='grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5'>
					{COVER_CONDITION_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={coverCondition === opt.value}
							onClick={() => !readOnly && setValue('cover_condition', opt.value)}
						/>
					))}
				</div>
				{errors.cover_condition && (
					<p className='mt-2 text-center text-xs text-red-500'>
						{errors.cover_condition.message}
					</p>
				)}
				<p className='mt-2 text-center text-xs text-zinc-500'>
					{DESKTOP_HINTS.cover_condition}
				</p>

				{/* Broken Warning */}
				{coverCondition === 'broken' && (
					<div className='mx-auto mt-4 flex max-w-md items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-100 p-2 text-xs text-red-800'>
						<Icon icon='HeroExclamationTriangle' className='h-4 w-4' />
						<span>{DESKTOP_WARNINGS.cover_condition}</span>
					</div>
				)}
			</div>

			{/* `powers_on` es booleano: no depende de `allowed_values`, así que se muestra
			    siempre y sólo su rotulado viene del schema remoto. Ocultarlo cuando el
			    schema no carga dejaba al técnico sin forma de responder un campo que
			    `complete-review` puede exigir. */}
			<div className='rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900/30 dark:bg-blue-900/10'>
				<YesNoSelector
					label={powersOnField?.label ?? '¿El equipo enciende?'}
					value={watch('powers_on')}
					onChange={(value) => !readOnly && setValue('powers_on', value)}
				/>
				{powersOnField?.hint && (
					<p className='mt-2 text-center text-xs text-zinc-500'>{powersOnField.hint}</p>
				)}
				{powersOnField?.warning && (
					<p className='mt-2 text-center text-xs text-blue-800'>
						{powersOnField.warning}
					</p>
				)}
			</div>
		</div>
	);
};

export default DesktopAestheticsSection;
