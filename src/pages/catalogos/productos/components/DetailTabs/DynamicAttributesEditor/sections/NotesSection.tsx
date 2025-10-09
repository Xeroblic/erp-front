import React from 'react';
import type { SectionBaseProps } from '../types';

const NotesSection: React.FC<SectionBaseProps> = ({
	attributes,
	updateAttribute,
	isFieldVisible,
}) => {
	if (!isFieldVisible('notes')) {
		return null;
	}

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Notas del estado</h4>
			<div className='grid grid-cols-1 gap-4'>
				<div className='space-y-1'>
					<label className='text-sm font-medium'>Estado funcional</label>
					<textarea
						name='notes_functional'
						placeholder='Descripción del estado funcional del equipo'
						value={attributes.notes?.functional || ''}
						onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
							updateAttribute('notes.functional', event.target.value)
						}
						className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						rows={3}
					/>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Estado cosmético</label>
					<textarea
						name='notes_cosmetic'
						placeholder='Descripción del estado cosmético del equipo'
						value={attributes.notes?.cosmetic || ''}
						onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
							updateAttribute('notes.cosmetic', event.target.value)
						}
						className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						rows={3}
					/>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Defectos conocidos</label>
					<textarea
						name='notes_defects'
						placeholder='Descripción de defectos conocidos (opcional)'
						value={attributes.notes?.defects || ''}
						onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
							updateAttribute('notes.defects', event.target.value)
						}
						className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						rows={3}
					/>
				</div>
			</div>
		</div>
	);
};

export default NotesSection;
