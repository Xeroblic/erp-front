import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { SectionBaseProps } from '../types';

interface TextareaFieldProps {
	label: string;
	name: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
	rows?: number;
	helpText?: string;
}

const TextareaField: React.FC<TextareaFieldProps> = ({
	label,
	name,
	placeholder,
	value,
	onChange,
	rows = 3,
	helpText,
}) => {
	return (
		<div className='space-y-2'>
			<label htmlFor={name} className='text-sm font-semibold text-zinc-900 dark:text-white'>
				{label}
			</label>
			<textarea
				id={name}
				name={name}
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				rows={rows}
				className='w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20'
			/>
			{helpText && <p className='text-xs text-zinc-500 dark:text-zinc-400'>{helpText}</p>}
		</div>
	);
};

const NotesSection: React.FC<SectionBaseProps> = ({
	attributes,
	updateAttribute,
	isFieldVisible,
}) => {
	if (!isFieldVisible('notes')) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-lg'>
					<span className='flex items-center gap-2'>
						<svg
							className='h-5 w-5 text-blue-600 dark:text-blue-400'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
							/>
						</svg>
						Notas del estado
					</span>
				</CardTitle>
			</CardHeader>

			<CardBody>
				<div className='space-y-6'>
					<TextareaField
						label='Estado funcional'
						name='notes_functional'
						placeholder='Ej: Todos los componentes funcionan correctamente, sin problemas detectados'
						value={attributes.notes?.functional || ''}
						onChange={(value) => updateAttribute('notes.functional', value)}
						rows={3}
						helpText='Describe el funcionamiento general del equipo y sus componentes'
					/>

					<TextareaField
						label='Estado cosmético'
						name='notes_cosmetic'
						placeholder='Ej: Ligeras marcas de uso en la carcasa, pantalla en perfecto estado'
						value={attributes.notes?.cosmetic || ''}
						onChange={(value) => updateAttribute('notes.cosmetic', value)}
						rows={3}
						helpText='Detalla el aspecto físico, rayones, desgaste, etc.'
					/>

					<TextareaField
						label='Defectos conocidos'
						name='notes_defects'
						placeholder='Ej: Batería con 70% de capacidad original, lector de CD no funciona'
						value={attributes.notes?.defects || ''}
						onChange={(value) => updateAttribute('notes.defects', value)}
						rows={3}
						helpText='Lista cualquier problema o limitación conocida (opcional)'
					/>
				</div>

				{/* Resumen visual si hay notas */}
				{(attributes.notes?.functional ||
					attributes.notes?.cosmetic ||
					attributes.notes?.defects) && (
					<div className='mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30'>
						<div className='flex items-start gap-3'>
							<svg
								className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
								/>
							</svg>
							<div className='flex-1 space-y-1'>
								<p className='text-sm font-medium text-blue-900 dark:text-blue-100'>
									Información registrada
								</p>
								<ul className='space-y-1 text-xs text-blue-700 dark:text-blue-300'>
									{attributes.notes?.functional && (
										<li className='flex items-center gap-2'>
											<span className='h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400' />
											Estado funcional documentado
										</li>
									)}
									{attributes.notes?.cosmetic && (
										<li className='flex items-center gap-2'>
											<span className='h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400' />
											Estado cosmético documentado
										</li>
									)}
									{attributes.notes?.defects && (
										<li className='flex items-center gap-2'>
											<span className='h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400' />
											Defectos conocidos registrados
										</li>
									)}
								</ul>
							</div>
						</div>
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default NotesSection;
