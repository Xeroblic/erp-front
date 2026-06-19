import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import {
	SCREEN_CONDITIONS_NOTEBOOK,
	SCREEN_CONDITIONS_AIO,
	SCREEN_CONDITIONS_MONITOR,
	STAND_CONDITIONS,
	STAND_CONDITIONS_MONITOR,
	FRAME_CONDITIONS,
} from '../constants/review-options';
import type { ReviewSectionProps } from '../types';

const ScreenSection: React.FC<ReviewSectionProps> = ({ data, updateField, productKind }) => {
	const screenOptions =
		productKind === 'monitor'
			? SCREEN_CONDITIONS_MONITOR
			: productKind === 'aio'
				? SCREEN_CONDITIONS_AIO
				: SCREEN_CONDITIONS_NOTEBOOK;

	const showStand = productKind === 'aio' || productKind === 'monitor';
	const standOpts = productKind === 'monitor' ? STAND_CONDITIONS_MONITOR : STAND_CONDITIONS;
	const showFrame = productKind === 'monitor';
	const showDeadPixels = data.screen_condition === 'dead_pixels';
	const showSpots = data.screen_condition === 'spots';
	const showResolution = productKind === 'monitor';

	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<div className='space-y-1'>
					<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
						Pulgadas de pantalla
					</label>
					<Input
						name='review_screen_inches'
						placeholder='Ej: 14, 15.6, 27'
						value={data.screen_inches ?? ''}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							updateField('screen_inches', e.target.value)
						}
					/>
				</div>

				{showResolution && (
					<div className='space-y-1'>
						<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
							Resolución
						</label>
						<Input
							name='review_screen_resolution'
							placeholder='Ej: 1920x1080'
							value={data.screen_resolution ?? ''}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								updateField('screen_resolution', e.target.value)
							}
						/>
					</div>
				)}

				<div className='space-y-1'>
					<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
						Condición de pantalla
					</label>
					<Select
						name='review_screen_condition'
						value={data.screen_condition ?? ''}
						onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
							updateField('screen_condition', e.target.value)
						}>
						<option value=''>Seleccionar</option>
						{screenOptions.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</Select>
				</div>

				<div className='flex items-end pb-2'>
					<Checkbox
						id='review_is_touchscreen'
						name='review_is_touchscreen'
						checked={data.is_touchscreen ?? false}
						onChange={() => updateField('is_touchscreen', !data.is_touchscreen)}
						label='Pantalla táctil'
					/>
				</div>

				{showDeadPixels && (
					<div className='space-y-1'>
						<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
							Cantidad de píxeles muertos
						</label>
						<Input
							name='review_dead_pixels_count'
							type='number'
							placeholder='Ej: 2'
							value={data.dead_pixels_count ?? ''}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								updateField('dead_pixels_count', Number(e.target.value))
							}
						/>
					</div>
				)}

				{showSpots && (
					<div className='space-y-1'>
						<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
							Cantidad de manchas
						</label>
						<Input
							name='review_spots_count'
							type='number'
							placeholder='Ej: 1'
							value={data.spots_count ?? ''}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								updateField('spots_count', Number(e.target.value))
							}
						/>
					</div>
				)}
			</div>

			{(showStand || showFrame) && (
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					{showStand && (
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Condición de base/soporte
							</label>
							<Select
								name='review_stand_condition'
								value={data.stand_condition ?? ''}
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
									updateField('stand_condition', e.target.value)
								}>
								<option value=''>Seleccionar</option>
								{standOpts.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</Select>
						</div>
					)}

					{showFrame && (
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Condición del marco
							</label>
							<Select
								name='review_frame_condition'
								value={data.frame_condition ?? ''}
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
									updateField('frame_condition', e.target.value)
								}>
								<option value=''>Seleccionar</option>
								{FRAME_CONDITIONS.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</Select>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default ScreenSection;
