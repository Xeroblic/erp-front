import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import {
	DISPLAY_PANELS,
	DISPLAY_REFRESH_RATES,
	DISPLAY_RESOLUTIONS,
	DISPLAY_SIZES,
} from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { SectionBaseProps } from '../types';

const DisplaySection: React.FC<SectionBaseProps> = ({
	attributes,
	updateAttribute,
	isFieldVisible,
	currentProductKind,
}) => {
	if (!isFieldVisible('display')) {
		return null;
	}

	const isPortable = currentProductKind === 'notebook' || currentProductKind === 'aio';
	const isMonitor = currentProductKind === 'monitor';

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Pantalla</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<div className='space-y-1'>
					<label className='text-sm font-medium'>Tamaño (pulgadas)</label>
					<Select
						name='display_size'
						value={attributes.display?.size_inches || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('display.size_inches', Number(event.target.value))
						}>
						<option value=''>Seleccionar tamaño</option>
						{DISPLAY_SIZES.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Resolución</label>
					<Select
						name='display_resolution'
						value={attributes.display?.resolution || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('display.resolution', event.target.value)
						}>
						<option value=''>Seleccionar resolución</option>
						{DISPLAY_RESOLUTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				<div className='space-y-1'>
					<label className='text-sm font-medium'>Panel</label>
					<Select
						name='display_panel'
						value={attributes.display?.panel || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('display.panel', event.target.value)
						}>
						<option value=''>Seleccionar panel</option>
						{DISPLAY_PANELS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				{isFieldVisible('display.refresh_hz') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Frecuencia de refresco</label>
						<Select
							name='display_refresh'
							value={attributes.display?.refresh_hz || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('display.refresh_hz', Number(event.target.value))
							}>
							<option value=''>Seleccionar frecuencia</option>
							{DISPLAY_REFRESH_RATES.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
				)}

				{isPortable && (
					<div className='space-y-1'>
						<label className='flex items-center gap-2'>
							<input
								type='checkbox'
								checked={attributes.display?.touch || false}
								onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
									updateAttribute('display.touch', event.target.checked)
								}
								className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
							/>
							<span className='text-sm font-medium'>Pantalla táctil</span>
						</label>
					</div>
				)}

				{isMonitor && (
					<>
						<div className='space-y-1'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={attributes.display?.adjustable_stand || false}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
										updateAttribute(
											'display.adjustable_stand',
											event.target.checked,
										)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm font-medium'>Soporte ajustable</span>
							</label>
						</div>

						<div className='space-y-1'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={attributes.display?.pivot || false}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
										updateAttribute('display.pivot', event.target.checked)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm font-medium'>Rotación (Pivot)</span>
							</label>
						</div>

						<div className='space-y-1'>
							<label className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={attributes.display?.integrated_speakers || false}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
										updateAttribute(
											'display.integrated_speakers',
											event.target.checked,
										)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm font-medium'>Altavoces integrados</span>
							</label>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default DisplaySection;
