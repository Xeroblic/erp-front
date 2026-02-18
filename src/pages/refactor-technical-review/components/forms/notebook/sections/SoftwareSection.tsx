import { Controller } from 'react-hook-form';
import type { FormSectionProps } from '../../shared/types';
import type { NotebookFormData } from '../../../validation/notebook.schema';
import { getNotebookLabel } from '../../../translations/notebook.labels';
import { NOTEBOOK_HINTS } from '../../../constants/notebook/notebook.hints';
// import { SelectionCard } from '../../../ui/SelectionCard'; // Removed
// import { OPERATING_SYSTEM_OPTIONS } from '../../../constants/notebook/notebook.options'; // Removed
import { SoSelector } from '../../../ui/selectors/SoSelector';

const SoftwareSection: React.FC<FormSectionProps<NotebookFormData>> = ({
	control,
	readOnly,
	watch,
}) => {
	const os = watch('operating_system');

	return (
		<div className='space-y-6'>
			<div className='mx-auto max-w-2xl rounded-xl border border-blue-200 bg-blue-500/10 p-6 transition-colors duration-200 hover:bg-blue-500/20 dark:border-blue-800 dark:bg-blue-900/10 dark:hover:bg-blue-900/20'>
				<label className='mb-6 block text-center text-sm font-bold text-blue-800 dark:text-blue-200'>
					{getNotebookLabel('operating_system')}
				</label>

				<Controller
					name='operating_system'
					control={control}
					render={({ field }) => (
						<SoSelector
							value={field.value || ''}
							onChange={field.onChange}
							readOnly={readOnly}
						/>
					)}
				/>

				<p className='mt-4 text-center text-xs text-zinc-500'>
					{NOTEBOOK_HINTS.operating_system}
				</p>
			</div>
		</div>
	);
};

export default SoftwareSection;
