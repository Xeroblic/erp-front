import React, { useMemo } from 'react';
import { LuLaptop, LuServer } from 'react-icons/lu';
import type { FormSectionProps } from '../../shared/types';
import type { DesktopFormData } from '../../../validation/desktop.schema';
import { getDesktopLabel } from '../../../translations/desktop.labels';
import { DESKTOP_HINTS } from '../../../constants/desktop/desktop.hints';
// Fix: Named import for SoSelector
import { SoSelector } from '../../../ui/selectors/SoSelector';

const DesktopSoftwareSection: React.FC<FormSectionProps<DesktopFormData>> = ({
	setFieldValue,
	readOnly,
	values,
}) => {
	const currentOS = values.operating_system;

	// Optional: derived state for UI feedback
	const isWindows = currentOS?.toLowerCase().includes('windows');
	// const isLinux = currentOS?.toLowerCase().includes('linux'); // Unused
	const isMac = currentOS?.toLowerCase().includes('macos');

	const headerIcon = useMemo(() => {
		if (isWindows) return <LuServer className='h-5 w-5 text-blue-500' />; // Using Server icon for Desktop context metaphor
		if (isMac) return <LuLaptop className='h-5 w-5 text-zinc-500' />;
		return <LuServer className='h-5 w-5 text-zinc-400' />;
	}, [isWindows, isMac]);

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50'>
				<div className='flex items-center gap-3'>
					<div className='rounded-full bg-white p-2 shadow-xs dark:bg-zinc-800'>
						{headerIcon}
					</div>
					<div className='flex flex-col'>
						<span className='text-sm font-bold text-zinc-700 dark:text-zinc-200'>
							{getDesktopLabel('operating_system')}
						</span>
						<span className='text-xs text-zinc-500'>
							{DESKTOP_HINTS.operating_system}
						</span>
					</div>
				</div>

				<div
					className={`rounded-full border px-4 py-1 text-xs font-bold transition-all duration-500 ${
						currentOS
							? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
							: 'border-zinc-200 bg-zinc-100 text-zinc-400 opacity-50 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-500'
					}`}>
					{currentOS ? `Seleccionado: ${currentOS}` : 'Pendiente de selección'}
				</div>
			</div>

			<SoSelector
				value={values.operating_system || ''}
				onChange={(val: string) => setFieldValue('operating_system', val)}
				readOnly={readOnly}
			/>
		</div>
	);
};

export default DesktopSoftwareSection;
