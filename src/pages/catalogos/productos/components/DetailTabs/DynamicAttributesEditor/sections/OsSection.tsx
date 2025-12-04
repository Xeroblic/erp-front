import React from 'react';
import Select from '@/components/form/Select';
import {
	LICENSE_TYPES,
	OS_NAMES,
	OS_VERSIONS,
} from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { SectionBaseProps } from '../types';

const OsSection: React.FC<SectionBaseProps> = ({ attributes, updateAttribute, isFieldVisible }) => {
	if (!isFieldVisible('os')) {
		return null;
	}

	const isWindows = attributes.os?.name === 'Windows';

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Sistema operativo</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<div className='space-y-1'>
					<label className='text-sm font-medium'>Sistema</label>
					<Select
						name='os_name'
						value={attributes.os?.name || ''}
						onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
							updateAttribute('os.name', event.target.value)
						}>
						<option value=''>Seleccionar sistema</option>
						{OS_NAMES.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</div>

				{isWindows && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Versión</label>
						<Select
							name='os_version'
							value={attributes.os?.version || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('os.version', event.target.value)
							}>
							<option value=''>Seleccionar versión</option>
							{OS_VERSIONS.Windows.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
				)}

				{isFieldVisible('os.license.type') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Tipo de licencia</label>
						<Select
							name='os_license_type'
							value={attributes.os?.license?.type || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('os.license.type', event.target.value)
							}>
							<option value=''>Seleccionar licencia</option>
							{LICENSE_TYPES.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
				)}

				{isFieldVisible('os.license.activated') && (
					<div className='space-y-1'>
						<label className='flex items-center gap-2'>
							<input
								type='checkbox'
								checked={attributes.os?.license?.activated || false}
								onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
									updateAttribute('os.license.activated', event.target.checked)
								}
								className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
							/>
							<span className='text-sm font-medium'>Licencia activada</span>
						</label>
					</div>
				)}

				<div className='space-y-1'>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={attributes.os?.can_upgrade_edition || false}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute('os.can_upgrade_edition', event.target.checked)
							}
							className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
						/>
						<span className='text-sm font-medium'>Puede actualizar edición</span>
					</label>
				</div>
			</div>
		</div>
	);
};

export default OsSection;
