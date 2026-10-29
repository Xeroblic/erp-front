import React from 'react';
import type { SectionBaseProps } from '../types';

const AudioSection: React.FC<SectionBaseProps> = ({
	attributes,
	updateAttribute,
	isFieldVisible,
}) => {
	if (!isFieldVisible('audio')) {
		return null;
	}

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Audio</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
				<div className='space-y-1'>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={attributes.audio?.speakers || false}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute('audio.speakers', event.target.checked)
							}
							className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
						/>
						<span className='text-sm font-medium'>Altavoces integrados</span>
					</label>
				</div>

				<div className='space-y-1'>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={attributes.audio?.microphone || false}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute('audio.microphone', event.target.checked)
							}
							className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
						/>
						<span className='text-sm font-medium'>Micrófono integrado</span>
					</label>
				</div>
			</div>
		</div>
	);
};

export default AudioSection;
