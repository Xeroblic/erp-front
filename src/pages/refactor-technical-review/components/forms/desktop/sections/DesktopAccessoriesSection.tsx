import React, { useId } from 'react';
import {
	ANTENNA_CONDITION_OPTIONS,
	CHARGER_STATUS_OPTIONS,
} from '@/pages/refactor-technical-review/components/constants/desktop/desktop.options';
import type { FormSectionProps } from '../../shared/types';
import type { DesktopFormData } from '../../../validation/desktop.schema';
import { getDesktopLabel } from '../../../translations/desktop.labels';
import { DESKTOP_HINTS } from '../../../constants/desktop/desktop.hints';
import { SelectionCard } from '../../../ui/SelectionCard';
import { YesNoSelector } from '../../../ui/YesNoSelector';

const DesktopAccessoriesSection: React.FC<FormSectionProps<DesktopFormData>> = ({
	errors,
	readOnly,
	values,
	setFieldValue,
}) => {
	const includesCharger = values.includes_charger;
	const chargerStatus = values.charger_status;
	const includesAntenna = values.includes_antenna;
	const antennaCondition = values.antenna_condition;
	const antennaLabelId = useId();
	const antennaErrorId = useId();

	return (
		<div className='space-y-6'>
			{/* Includes Charger/Cable */}
			<div className='flex flex-col gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-4 transition-colors hover:bg-yellow-100/50 dark:border-yellow-900/30 dark:bg-yellow-900/10'>
				<label className='mb-2 block text-sm font-bold text-yellow-800 dark:text-yellow-200'>
					{getDesktopLabel('includes_charger')}
				</label>
				<YesNoSelector
					label='¿Incluye Cable de Poder / Fuente?'
					value={includesCharger}
					onChange={(val) => {
						if (readOnly) return;
						setFieldValue('includes_charger', val);
						if (val === false) {
							setFieldValue('charger_status', 'not_included');
						} else {
							setFieldValue('charger_status', null); // Reset to force selection if changing back to true
						}
					}}
				/>
				<p className='mt-1 text-xs text-zinc-500'>{DESKTOP_HINTS.includes_charger}</p>
			</div>

			{/* Charger Status - conditional display */}
			{includesCharger === true && (
				<div className='animate-in fade-in slide-in-from-top-2 rounded-xl border border-orange-200 bg-orange-50 p-4 transition-colors hover:bg-orange-100/50 dark:border-orange-900/30 dark:bg-orange-900/10'>
					<label className='mb-3 block text-sm font-bold text-orange-800 dark:text-orange-200'>
						{getDesktopLabel('charger_status')} <span className='text-red-500'>*</span>
					</label>
					<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
						{CHARGER_STATUS_OPTIONS.filter((opt) => opt.value !== 'not_included').map(
							(opt) => (
								<SelectionCard
									key={opt.value}
									label={opt.label}
									value={opt.value}
									isSelected={chargerStatus === opt.value}
									onClick={() =>
										!readOnly && setFieldValue('charger_status', opt.value)
									}
								/>
							),
						)}
					</div>
					{errors.charger_status && (
						<p className='mt-2 text-xs text-red-500'>{errors.charger_status}</p>
					)}
					<p className='mt-2 text-xs text-zinc-500'>{DESKTOP_HINTS.charger_status}</p>
				</div>
			)}
			<div className='rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/30 dark:bg-yellow-900/10'>
				<YesNoSelector
					label={getDesktopLabel('includes_antenna')}
					value={includesAntenna}
					disabled={readOnly}
					onChange={(value) => {
						if (readOnly || value === includesAntenna) return;
						setFieldValue('includes_antenna', value);
						setFieldValue('antenna_condition', null, { touch: true });
					}}
				/>
				<p className='mt-2 text-xs text-zinc-500'>
					Registra cómo llegó el equipo. No influye en el grado.
				</p>
			</div>
			{includesAntenna === true && (
				<div
					role='group'
					aria-labelledby={antennaLabelId}
					aria-describedby={errors.antenna_condition ? antennaErrorId : undefined}
					className='rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/30 dark:bg-orange-900/10'>
					<p id={antennaLabelId} className='mb-3 text-sm font-bold'>
						{getDesktopLabel('antenna_condition')}{' '}
						<span className='text-red-500'>*</span>
					</p>
					<div className='grid grid-cols-2 gap-2 md:grid-cols-3'>
						{ANTENNA_CONDITION_OPTIONS.map((option) => (
							<SelectionCard
								key={option.value}
								label={option.label}
								value={option.value}
								isSelected={antennaCondition === option.value}
								disabled={readOnly}
								onClick={() =>
									!readOnly &&
									setFieldValue('antenna_condition', option.value, {
										touch: true,
									})
								}
							/>
						))}
					</div>
					{errors.antenna_condition && (
						<p id={antennaErrorId} role='alert' className='mt-2 text-xs text-red-500'>
							{errors.antenna_condition}
						</p>
					)}
				</div>
			)}
		</div>
	);
};

export default DesktopAccessoriesSection;
