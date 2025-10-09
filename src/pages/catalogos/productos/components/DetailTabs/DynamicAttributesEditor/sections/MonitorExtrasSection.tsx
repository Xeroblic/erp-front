import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import { MONITOR_CONNECTORS } from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { SectionBaseProps } from '../types';

const MonitorExtrasSection: React.FC<SectionBaseProps> = ({
	attributes,
	updateAttribute,
	currentProductKind,
	isFieldVisible,
}) => {
	if (currentProductKind !== 'monitor') {
		return null;
	}

	const selectedInputs = attributes.connectivity?.signal_inputs || [];

	const handleSignalInputChange = (value: string, checked: boolean) => {
		if (checked) {
			updateAttribute('connectivity.signal_inputs', [...selectedInputs, value]);
			return;
		}

		updateAttribute(
			'connectivity.signal_inputs',
			selectedInputs.filter((input) => input !== value),
		);
	};

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>
				Características específicas del monitor
			</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				<div className='space-y-1'>
					<label className='text-sm font-medium'>Conectores disponibles</label>
					<div className='space-y-2'>
						{MONITOR_CONNECTORS.map((connector) => (
							<label key={connector.value} className='flex items-center gap-2'>
								<input
									type='checkbox'
									checked={selectedInputs.includes(connector.value)}
									onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
										handleSignalInputChange(connector.value, event.target.checked)
									}
									className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
								/>
								<span className='text-sm'>{connector.label}</span>
							</label>
						))}
					</div>
				</div>

				{isFieldVisible('display.response_time_ms') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Tiempo de respuesta (ms)</label>
						<Input
							name='display_response_time_ms'
							type='number'
							placeholder='Ej: 1'
							value={attributes.display?.response_time_ms || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute(
									'display.response_time_ms',
									Number(event.target.value),
								)
							}
						/>
					</div>
				)}

				{isFieldVisible('display.brightness_nits') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Brillo (nits)</label>
						<Input
							name='display_brightness_nits'
							type='number'
							placeholder='Ej: 300'
							value={attributes.display?.brightness_nits || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute(
									'display.brightness_nits',
									Number(event.target.value),
								)
							}
						/>
					</div>
				)}

				{isFieldVisible('display.aspect_ratio') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Relación de aspecto</label>
						<Select
							name='display_aspect_ratio'
							value={attributes.display?.aspect_ratio || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('display.aspect_ratio', event.target.value)
							}>
							<option value=''>Seleccionar aspecto</option>
							<option value='16:9'>16:9</option>
							<option value='16:10'>16:10</option>
							<option value='21:9'>21:9</option>
							<option value='32:9'>32:9</option>
							<option value='4:3'>4:3</option>
							<option value='5:4'>5:4</option>
						</Select>
					</div>
				)}
			</div>
		</div>
	);
};

export default MonitorExtrasSection;
