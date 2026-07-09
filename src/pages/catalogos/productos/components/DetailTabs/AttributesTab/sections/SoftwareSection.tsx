import React from 'react';
import Input from '@/components/form/Input';
import Checkbox from '@/components/form/Checkbox';
import type { ReviewSectionProps } from '../types';

const SoftwareSection: React.FC<ReviewSectionProps> = ({ data, updateField, productKind }) => {
	const showBiometric = productKind === 'notebook';
	const showCdDrive = productKind === 'desktop_pc' || productKind === 'aio';

	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<div className='space-y-1'>
					<label className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
						Sistema operativo
					</label>
					<Input
						name='review_operating_system'
						placeholder='Ej: Windows 10 Pro'
						value={data.operating_system ?? ''}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							updateField('operating_system', e.target.value)
						}
					/>
				</div>

				<div className='flex flex-col justify-end gap-3 pb-1'>
					<Checkbox
						id='review_has_wifi'
						name='review_has_wifi'
						checked={data.has_wifi ?? false}
						onChange={() => updateField('has_wifi', !data.has_wifi)}
						label='WiFi'
					/>
					<Checkbox
						id='review_has_bluetooth'
						name='review_has_bluetooth'
						checked={data.has_bluetooth ?? false}
						onChange={() => updateField('has_bluetooth', !data.has_bluetooth)}
						label='Bluetooth'
					/>
				</div>

				<div className='flex flex-col justify-end gap-3 pb-1'>
					{showBiometric && (
						<Checkbox
							id='review_has_biometric'
							name='review_has_biometric'
							checked={data.has_biometric ?? false}
							onChange={() => updateField('has_biometric', !data.has_biometric)}
							label='Biométrico'
						/>
					)}
					{showCdDrive && (
						<Checkbox
							id='review_has_cd_drive'
							name='review_has_cd_drive'
							checked={data.has_cd_drive ?? false}
							onChange={() => updateField('has_cd_drive', !data.has_cd_drive)}
							label='Unidad CD/DVD'
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default SoftwareSection;
