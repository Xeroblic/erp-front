import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Checkbox from '@/components/form/Checkbox';
import { CHARGER_STATUSES_NOTEBOOK, CHARGER_STATUSES_DESKTOP } from '../constants/review-options';
import type { ReviewSectionProps } from '../types';

const AccessoriesSection: React.FC<ReviewSectionProps> = ({ data, updateField, productKind }) => {
	const isNotebook = productKind === 'notebook';
	const isMonitor = productKind === 'monitor';
	const isDocking = productKind === 'docking';
	const isAio = productKind === 'aio';
	const usesPowerAdapter = isAio || isDocking;
	const chargerOpts = isNotebook ? CHARGER_STATUSES_NOTEBOOK : CHARGER_STATUSES_DESKTOP;

	return (
		<div className='space-y-4'>
			{/* Charger / Power adapter */}
			{!isMonitor && (
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{usesPowerAdapter ? (
						<div className='flex items-end pb-2'>
							<Checkbox
								id='review_includes_power_adapter'
								name='review_includes_power_adapter'
								checked={data.includes_power_adapter ?? false}
								onChange={() =>
									updateField(
										'includes_power_adapter',
										!data.includes_power_adapter,
									)
								}
								label='Incluye adaptador de corriente'
							/>
						</div>
					) : (
						<div className='flex items-end pb-2'>
							<Checkbox
								id='review_includes_charger'
								name='review_includes_charger'
								checked={data.includes_charger ?? false}
								onChange={() =>
									updateField('includes_charger', !data.includes_charger)
								}
								label='Incluye cargador'
							/>
						</div>
					)}

					{(data.includes_charger || data.includes_power_adapter) && (
						<>
							{isNotebook && (
								<div className='space-y-1'>
									<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
										Watts del cargador
									</label>
									<Input
										name='review_charger_watts'
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
									Estado del cargador
								</label>
								<Select
									name='review_charger_status'
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

			{/* Monitor-specific accessories */}
			{isMonitor && (
				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					<Checkbox
						id='review_includes_power_cable'
						name='review_includes_power_cable'
						checked={data.includes_power_cable ?? false}
						onChange={() =>
							updateField('includes_power_cable', !data.includes_power_cable)
						}
						label='Incluye cable de poder'
					/>
					<Checkbox
						id='review_includes_video_cable'
						name='review_includes_video_cable'
						checked={data.includes_video_cable ?? false}
						onChange={() =>
							updateField('includes_video_cable', !data.includes_video_cable)
						}
						label='Incluye cable de video'
					/>
					<Checkbox
						id='review_includes_stand'
						name='review_includes_stand'
						checked={data.includes_stand ?? false}
						onChange={() => updateField('includes_stand', !data.includes_stand)}
						label='Incluye base/soporte'
					/>
				</div>
			)}
		</div>
	);
};

export default AccessoriesSection;
