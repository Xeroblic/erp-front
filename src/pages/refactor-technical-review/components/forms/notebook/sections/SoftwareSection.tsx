import React from 'react';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { getNotebookLabel } from '../../../translations/notebook.labels';
import { NOTEBOOK_HINTS } from '../../../constants/notebook/notebook.hints';
import { SelectionCard } from '@/pages/technical-reviews/shared/components/SelectionCard';
import { OPERATING_SYSTEM_OPTIONS } from '../../../constants/notebook/notebook.options';

const SoftwareSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	errors,
	readOnly,
	watch,
	setValue,
}) => {
	const os = watch('operating_system');

	return (
		<div className='space-y-6'>
			<div className='mx-auto max-w-lg rounded-xl border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-800 dark:bg-blue-900/10'>
				<label className='mb-4 block text-center text-sm font-bold text-blue-800 dark:text-blue-200'>
					{getNotebookLabel('operating_system')}
				</label>

				<div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
					{OPERATING_SYSTEM_OPTIONS.map((opt) => (
						<SelectionCard
							key={opt.value}
							label={opt.label}
							value={opt.value}
							isSelected={os === opt.value}
							onClick={() => !readOnly && setValue('operating_system', opt.value)}
						/>
					))}
				</div>

				<p className='mt-3 text-center text-xs text-zinc-500'>
					{NOTEBOOK_HINTS.operating_system}
				</p>
			</div>
		</div>
	);
};

export default SoftwareSection;
