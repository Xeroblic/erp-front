import React from 'react';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import {
	BLUETOOTH_VERSIONS,
	ETHERNET_SPEEDS,
	WIFI_STANDARDS,
} from '@/pages/catalogos/productos/constants/product-attributes.constants';
import type { SectionBaseProps } from '../types';

const ConnectivitySection: React.FC<SectionBaseProps> = ({
	attributes,
	updateAttribute,
	isFieldVisible,
	currentProductKind,
}) => {
	if (!isFieldVisible('connectivity')) {
		return null;
	}

	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Conectividad</h4>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
				{isFieldVisible('connectivity.wifi') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Wi-Fi</label>
						<Select
							name='connectivity_wifi'
							value={attributes.connectivity?.wifi || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('connectivity.wifi', event.target.value)
							}>
							<option value=''>Seleccionar Wi-Fi</option>
							{WIFI_STANDARDS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
				)}

				{isFieldVisible('connectivity.bluetooth') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Bluetooth</label>
						<Select
							name='connectivity_bluetooth'
							value={attributes.connectivity?.bluetooth || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('connectivity.bluetooth', event.target.value)
							}>
							<option value=''>Seleccionar Bluetooth</option>
							{BLUETOOTH_VERSIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
				)}

				{isFieldVisible('connectivity.ethernet') && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Ethernet</label>
						<Select
							name='connectivity_ethernet'
							value={attributes.connectivity?.ethernet || ''}
							onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
								updateAttribute('connectivity.ethernet', event.target.value)
							}>
							<option value=''>Seleccionar Ethernet</option>
							{ETHERNET_SPEEDS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
				)}

				{currentProductKind === 'monitor' && (
					<div className='space-y-1'>
						<label className='text-sm font-medium'>Entrada de corriente</label>
						<Input
							name='connectivity_power_input'
							placeholder='Ej: 100-240V AC'
							value={attributes.connectivity?.power_input || ''}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
								updateAttribute('connectivity.power_input', event.target.value)
							}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default ConnectivitySection;
