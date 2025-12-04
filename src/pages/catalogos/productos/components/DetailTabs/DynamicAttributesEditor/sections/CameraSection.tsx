import React from 'react';
import Select from '@/components/form/Select';
import { CAMERA_RESOLUTIONS } from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { SectionBaseProps } from '../types';

const CameraSection: React.FC<SectionBaseProps> = ({
	attributes,
	updateAttribute,
	isFieldVisible,
}) => {
	if (!isFieldVisible('camera')) {
		return null;
	}

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Cámara</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
				<div className='space-y-1'>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={attributes.camera?.present || false}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute('camera.present', event.target.checked)
							}
							className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
						/>
						<span className='text-sm font-medium'>Cámara presente</span>
					</label>
				</div>

				{attributes.camera?.present && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Resolución (MP)</label>
						<Select
							name='camera_resolution_mp'
							value={attributes.camera?.resolution_mp || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('camera.resolution_mp', Number(event.target.value))
							}>
							<option value=''>Seleccionar resolución</option>
							{CAMERA_RESOLUTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
				)}
			</div>
		</div>
	);
};

export default CameraSection;
