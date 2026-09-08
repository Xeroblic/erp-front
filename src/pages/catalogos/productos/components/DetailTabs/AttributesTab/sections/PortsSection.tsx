import React from 'react';
import Input from '@/components/form/Input';
import Checkbox from '@/components/form/Checkbox';
import { PortTypeCounters } from '@/pages/refactor-technical-review/components/ui/PortTypeCounters';
import {
	PORT_TYPE_OPTIONS,
	sumPortTypeCounts,
	type PortTypeCounts,
} from '@/pages/refactor-technical-review/components/validation/constants/ports.rules';
import type { ReviewSectionProps } from '../types';

const portField = (
	label: string,
	name: string,
	value: number | undefined,
	onChange: (v: number) => void,
) => (
	// El rótulo se ata al input: sin `htmlFor`/`id` el contador queda sin nombre accesible
	// y un lector de pantalla sólo anuncia «campo numérico».
	<div className='space-y-1' key={name}>
		<label
			className='text-sm font-medium text-neutral-700 dark:text-neutral-300'
			htmlFor={name}>
			{label}
		</label>
		<Input
			id={name}
			name={name}
			type='number'
			placeholder='0'
			value={value ?? ''}
			onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
		/>
	</div>
);

/** `undefined` = no se midió; `{}` = se midió y no hay ninguno. */
const isMeasured = (counts: PortTypeCounts | undefined): counts is PortTypeCounts =>
	counts !== undefined && counts !== null;

const PortsSection: React.FC<ReviewSectionProps> = ({ data, updateField, productKind }) => {
	const showDvi = productKind === 'monitor';
	const showUsbHub = productKind === 'monitor';

	// El total y el desglose no pueden contradecirse: mientras el desglose no exista manda
	// el total guardado —una revisión importada de antes de ZF-98 sólo tiene eso—, y en
	// cuanto el desglose existe el total pasa a derivarse de él.
	const hasDefectiveBreakdown = isMeasured(data.defective_port_types);
	const defectiveTotal = hasDefectiveBreakdown
		? sumPortTypeCounts(data.defective_port_types)
		: (data.defective_ports_count ?? 0);
	const looseTotal = sumPortTypeCounts(data.loose_port_types);

	const changeBreakdown = (field: string, totalField: string) => (next: PortTypeCounts) => {
		updateField(field, next);
		updateField(totalField, sumPortTypeCounts(next));
	};

	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
				{portField('VGA', 'review_vga_ports', data.vga_ports, (v) =>
					updateField('vga_ports', v),
				)}
				{portField('HDMI', 'review_hdmi_ports', data.hdmi_ports, (v) =>
					updateField('hdmi_ports', v),
				)}
				{portField('DisplayPort', 'review_displayport_ports', data.displayport_ports, (v) =>
					updateField('displayport_ports', v),
				)}
				{showDvi &&
					portField('DVI', 'review_dvi_ports', data.dvi_ports, (v) =>
						updateField('dvi_ports', v),
					)}
				{portField('USB-C', 'review_usb_c_ports', data.usb_c_ports, (v) =>
					updateField('usb_c_ports', v),
				)}
				{portField('USB-A', 'review_usb_a_ports', data.usb_a_ports, (v) =>
					updateField('usb_a_ports', v),
				)}
				{portField('SD Reader', 'review_sd_readers', data.sd_readers, (v) =>
					updateField('sd_readers', v),
				)}
				{portField('RJ45', 'review_rj45_ports', data.rj45_ports, (v) =>
					updateField('rj45_ports', v),
				)}
			</div>

			{showUsbHub && (
				<div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
					<div className='flex items-end pb-2'>
						<Checkbox
							id='review_has_usb_hub'
							name='review_has_usb_hub'
							checked={data.has_usb_hub ?? false}
							onChange={() => updateField('has_usb_hub', !data.has_usb_hub)}
							label='Tiene USB Hub'
						/>
					</div>
					{data.has_usb_hub &&
						portField(
							'Puertos USB Hub',
							'review_usb_hub_ports',
							data.usb_hub_ports,
							(v) => updateField('usb_hub_ports', v),
						)}
				</div>
			)}

			<div className='border-t border-neutral-200 pt-4 dark:border-neutral-700'>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					<div className='flex items-end pb-2'>
						<Checkbox
							id='review_all_ports_functional'
							name='review_all_ports_functional'
							checked={data.all_ports_functional ?? true}
							onChange={() =>
								updateField('all_ports_functional', !data.all_ports_functional)
							}
							label='Todos los puertos funcionales'
						/>
					</div>

					{!data.all_ports_functional &&
						!hasDefectiveBreakdown &&
						portField(
							'Puertos defectuosos',
							'review_defective_ports_count',
							data.defective_ports_count,
							(v) => updateField('defective_ports_count', v),
						)}
				</div>

				{!data.all_ports_functional && (
					<div className='mt-4 space-y-3'>
						<PortTypeCounters
							label='Qué puertos están defectuosos'
							options={PORT_TYPE_OPTIONS}
							value={data.defective_port_types ?? {}}
							onChange={changeBreakdown(
								'defective_port_types',
								'defective_ports_count',
							)}
						/>
						<p className='text-sm font-semibold text-neutral-700 dark:text-neutral-300'>
							Puertos defectuosos: {defectiveTotal}
						</p>
					</div>
				)}
			</div>

			<div className='border-t border-neutral-200 pt-4 dark:border-neutral-700'>
				<div className='space-y-3'>
					<PortTypeCounters
						label='Qué puertos están sueltos'
						options={PORT_TYPE_OPTIONS}
						value={data.loose_port_types ?? {}}
						onChange={changeBreakdown('loose_port_types', 'loose_ports_count')}
					/>
					<p className='text-sm text-neutral-500 dark:text-neutral-400'>
						Un puerto suelto se mueve pero funciona; uno defectuoso no funciona.
					</p>
					<p className='text-sm font-semibold text-neutral-700 dark:text-neutral-300'>
						Puertos sueltos: {looseTotal}
					</p>
				</div>
			</div>
		</div>
	);
};

export default PortsSection;
