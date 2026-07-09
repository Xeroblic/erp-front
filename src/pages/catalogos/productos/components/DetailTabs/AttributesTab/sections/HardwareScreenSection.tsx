import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import {
	STORAGE_TECHNOLOGIES,
	SCREEN_CONDITIONS_NOTEBOOK,
	SCREEN_CONDITIONS_AIO,
	SCREEN_CONDITIONS_MONITOR,
	STAND_CONDITIONS,
	STAND_CONDITIONS_MONITOR,
	FRAME_CONDITIONS,
} from '../constants/review-options';
import type { ReviewSectionProps } from '../types';

const HardwareScreenSection: React.FC<ReviewSectionProps> = ({
	data,
	updateField,
	productKind,
}) => {
	const isMonitor = productKind === 'monitor';
	const showHardware = !isMonitor;
	const showScreen = productKind === 'notebook' || productKind === 'aio' || isMonitor;

	const screenOptions = isMonitor
		? SCREEN_CONDITIONS_MONITOR
		: productKind === 'aio'
			? SCREEN_CONDITIONS_AIO
			: SCREEN_CONDITIONS_NOTEBOOK;

	const showStand = productKind === 'aio' || isMonitor;
	const standOpts = isMonitor ? STAND_CONDITIONS_MONITOR : STAND_CONDITIONS;
	const showFrame = isMonitor;

	return (
		<div className='space-y-6'>
			{/* Hardware */}
			{showHardware && (
				<div>
					<h5 className='mb-3 flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200'>
						<span className='inline-block h-1.5 w-1.5 rounded-full bg-blue-500' />
						Procesador & Memoria
					</h5>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Procesador
							</label>
							<Input
								name='review_processor'
								placeholder='Ej: Intel Core i5-8350U'
								value={data.processor ?? ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									updateField('processor', e.target.value)
								}
							/>
						</div>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								RAM
							</label>
							<Input
								name='review_ram_size'
								placeholder='Ej: 8GB'
								value={data.ram_size ?? ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									updateField('ram_size', e.target.value)
								}
							/>
						</div>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								RAM Slots
							</label>
							<Input
								name='review_ram_slots'
								placeholder='Ej: 2'
								value={data.ram_slots ?? ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									updateField('ram_slots', e.target.value)
								}
							/>
						</div>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Tipo RAM
							</label>
							<Input
								name='review_ram_type'
								placeholder='Ej: DDR4'
								value={data.ram_type ?? ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									updateField('ram_type', e.target.value)
								}
							/>
						</div>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Almacenamiento
							</label>
							<Input
								name='review_storage_size'
								placeholder='Ej: 256GB'
								value={data.storage_size ?? ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									updateField('storage_size', e.target.value)
								}
							/>
						</div>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Tecnología
							</label>
							<Select
								name='review_storage_technology'
								value={data.storage_technology ?? ''}
								onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
									updateField('storage_technology', e.target.value)
								}>
								<option value=''>Seleccionar</option>
								{STORAGE_TECHNOLOGIES.map((o) => (
									<option key={o.value} value={o.value}>
										{o.label}
									</option>
								))}
							</Select>
						</div>
					</div>
				</div>
			)}

			{/* Screen */}
			{showScreen && (
				<div>
					<h5 className='mb-3 flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200'>
						<span className='inline-block h-1.5 w-1.5 rounded-full bg-violet-500' />
						Pantalla
					</h5>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Pulgadas
							</label>
							<Input
								name='review_screen_inches'
								placeholder='Ej: 14, 15.6'
								value={data.screen_inches ?? ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									updateField('screen_inches', e.target.value)
								}
							/>
						</div>
						{isMonitor && (
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
								Condición
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
								label='Táctil'
							/>
						</div>
						{data.screen_condition === 'dead_pixels' && (
							<div className='space-y-1'>
								<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
									Píxeles muertos
								</label>
								<Input
									name='review_dead_pixels'
									type='number'
									placeholder='Ej: 2'
									value={data.dead_pixels_count ?? ''}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										updateField('dead_pixels_count', Number(e.target.value))
									}
								/>
							</div>
						)}
						{data.screen_condition === 'spots' && (
							<div className='space-y-1'>
								<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
									Manchas
								</label>
								<Input
									name='review_spots'
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
						<div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
							{showStand && (
								<div className='space-y-1'>
									<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
										Base/Soporte
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
										Marco
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
			)}
		</div>
	);
};

export default HardwareScreenSection;
