import React from 'react';
import type { FormSectionProps } from '../../shared/types';
import type { DesktopFormData } from '../../../validation/desktop.schema';
import { getDesktopLabel } from '../../../translations/desktop.labels';
import { DESKTOP_HINTS } from '../../../constants/desktop/desktop.hints';
import { SelectionCard } from '../../../ui/SelectionCard';
import { YesNoSelector } from '../../../ui/YesNoSelector';
import { CHARGER_STATUS_OPTIONS } from '../../../constants/desktop/desktop.options';

const DesktopAccessoriesSection: React.FC<FormSectionProps<DesktopFormData>> = ({
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	const includesCharger = watch('includes_charger');
	const chargerStatus = watch('charger_status');

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
						setValue('includes_charger', val);
						if (val === false) {
							setValue('charger_status', 'not_included');
						} else {
							setValue('charger_status', null); // Reset to force selection if changing back to true
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
										!readOnly && setValue('charger_status', opt.value)
									}
								/>
							),
						)}
					</div>
					{errors.charger_status && (
						<p className='mt-2 text-xs text-red-500'>{errors.charger_status.message}</p>
					)}
					<p className='mt-2 text-xs text-zinc-500'>{DESKTOP_HINTS.charger_status}</p>
				</div>
			)}
		</div>
	);
};

export default DesktopAccessoriesSection;
