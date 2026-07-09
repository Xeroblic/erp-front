import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import { CHARGER_STATUSES_NOTEBOOK, CHARGER_STATUSES_DESKTOP } from '../constants/review-options';
import type { ReviewSectionProps } from '../types';

const ExtrasSection: React.FC<ReviewSectionProps> = ({ data, updateField, productKind }) => {
	const isNotebook = productKind === 'notebook';
	const isMonitor = productKind === 'monitor';
	const isDocking = productKind === 'docking';
	const isAio = productKind === 'aio';
	const usesPowerAdapter = isAio || isDocking;
	const showSoftware = !isMonitor;
	const showCdDrive = productKind === 'desktop_pc' || isAio;
	const chargerOpts = isNotebook ? CHARGER_STATUSES_NOTEBOOK : CHARGER_STATUSES_DESKTOP;

	return (
		<div className='space-y-6'>
			{/* Accesorios */}
			<div>
				<h5 className='mb-3 flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200'>
					<span className='inline-block h-1.5 w-1.5 rounded-full bg-violet-500' />
					Accesorios
				</h5>

				{isMonitor ? (
					<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
						<Checkbox
							id='review_power_cable'
							name='review_power_cable'
							checked={data.includes_power_cable ?? false}
							onChange={() =>
								updateField('includes_power_cable', !data.includes_power_cable)
							}
							label='Cable de poder'
						/>
						<Checkbox
							id='review_video_cable'
							name='review_video_cable'
							checked={data.includes_video_cable ?? false}
							onChange={() =>
								updateField('includes_video_cable', !data.includes_video_cable)
							}
							label='Cable de video'
						/>
						<Checkbox
							id='review_inc_stand'
							name='review_inc_stand'
							checked={data.includes_stand ?? false}
							onChange={() => updateField('includes_stand', !data.includes_stand)}
							label='Base/soporte'
						/>
					</div>
				) : (
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{usesPowerAdapter ? (
							<Checkbox
								id='review_power_adapter'
								name='review_power_adapter'
								checked={data.includes_power_adapter ?? false}
								onChange={() =>
									updateField(
										'includes_power_adapter',
										!data.includes_power_adapter,
									)
								}
								label='Adaptador de corriente'
							/>
						) : (
							<Checkbox
								id='review_charger'
								name='review_charger'
								checked={data.includes_charger ?? false}
								onChange={() =>
									updateField('includes_charger', !data.includes_charger)
								}
								label='Incluye cargador'
							/>
						)}
						{(data.includes_charger || data.includes_power_adapter) && (
							<>
								{isNotebook && (
									<div className='space-y-1'>
										<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
											Watts
										</label>
										<Input
											name='review_charger_w'
											placeholder='Ej: 65W'
											value={data.charger_watts ?? ''}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												updateField('charger_watts', e.target.value)
											}
										/>
									</div>
								)}
								<div className='space-y-1'>
									<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
										Estado cargador
									</label>
									<Select
										name='review_charger_st'
										value={data.charger_status ?? ''}
										onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
											updateField('charger_status', e.target.value)
										}>
										<option value=''>Seleccionar</option>
										{chargerOpts.map((o) => (
											<option key={o.value} value={o.value}>
												{o.label}
											</option>
										))}
									</Select>
								</div>
							</>
						)}
					</div>
				)}
			</div>

			{/* Software / Conectividad */}
			{showSoftware && (
				<div>
					<h5 className='mb-3 flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200'>
						<span className='inline-block h-1.5 w-1.5 rounded-full bg-sky-500' />
						Software & Conectividad
					</h5>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
								Sistema operativo
							</label>
							<Input
								name='review_os'
								placeholder='Ej: Windows 10 Pro'
								value={data.operating_system ?? ''}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									updateField('operating_system', e.target.value)
								}
							/>
						</div>
						<div className='flex flex-col justify-end gap-2 pb-1'>
							<Checkbox
								id='review_wifi'
								name='review_wifi'
								checked={data.has_wifi ?? false}
								onChange={() => updateField('has_wifi', !data.has_wifi)}
								label='WiFi'
							/>
							<Checkbox
								id='review_bt'
								name='review_bt'
								checked={data.has_bluetooth ?? false}
								onChange={() => updateField('has_bluetooth', !data.has_bluetooth)}
								label='Bluetooth'
							/>
						</div>
						<div className='flex flex-col justify-end gap-2 pb-1'>
							{isNotebook && (
								<Checkbox
									id='review_bio'
									name='review_bio'
									checked={data.has_biometric ?? false}
									onChange={() =>
										updateField('has_biometric', !data.has_biometric)
									}
									label='Biométrico'
								/>
							)}
							{showCdDrive && (
								<Checkbox
									id='review_cd'
									name='review_cd'
									checked={data.has_cd_drive ?? false}
									onChange={() => updateField('has_cd_drive', !data.has_cd_drive)}
									label='Unidad CD/DVD'
								/>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Observaciones */}
			<div>
				<h5 className='mb-3 flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-200'>
					<span className='inline-block h-1.5 w-1.5 rounded-full bg-neutral-400' />
					Observaciones
				</h5>
				<textarea
					name='review_observations'
					rows={3}
					className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-blue-400'
					placeholder='Notas adicionales…'
					value={data.observations ?? ''}
					onChange={(e) => updateField('observations', e.target.value)}
				/>
			</div>
		</div>
	);
};

export default ExtrasSection;
