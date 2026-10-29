import React from 'react';
import Icon from '@/components/icon/Icon';
import Radio from '@/components/form/Radio';
import type { TIcons } from '@/types/icons.type';
import type { TStockReceiptFormMode } from '../../types';

interface IOriginOption {
	value: TStockReceiptFormMode;
	icon: TIcons;
	title: string;
	description: string;
	isRecommended?: boolean;
}

const ORIGIN_OPTIONS: IOriginOption[] = [
	{
		value: 'with_document',
		icon: 'HeroDocumentText',
		title: 'Con documento de compra',
		description:
			'Llegó con factura o guía ya confirmada. Las líneas pendientes y sus costos se cargan solos.',
		isRecommended: true,
	},
	{
		value: 'manual',
		icon: 'HeroPencilSquare',
		title: 'Sin documento',
		description:
			'Devolución, ajuste o mercadería cuya factura aún no llega. Indicas productos, motivo y costo.',
	},
];

interface IReceiptOriginSelectorProps {
	value: TStockReceiptFormMode;
	onChange: (mode: TStockReceiptFormMode) => void;
	disabled?: boolean;
}

/**
 * Primera decisión del alta: de dónde viene la mercadería. Radios nativos
 * (teclado y lector de pantalla gratis) con apariencia de tarjeta.
 */
const ReceiptOriginSelector: React.FC<IReceiptOriginSelectorProps> = ({
	value,
	onChange,
	disabled = false,
}) => (
	<fieldset className='m-0 min-w-0 border-0 p-0'>
		<legend className='mb-2 text-sm font-semibold text-zinc-900 dark:text-white'>
			¿Cómo llegó la mercadería?
		</legend>
		<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
			{ORIGIN_OPTIONS.map((option) => (
				<Radio
					key={option.value}
					id={`recepcion-origin-${option.value}`}
					name='mode'
					value={option.value}
					selectedValue={value}
					disabled={disabled}
					className='w-full [&>label]:w-full'
					onChange={() => onChange(option.value)}>
					<div className='flex h-full gap-3 bg-white p-3 dark:bg-zinc-900'>
						<Icon
							icon={option.icon}
							className='mt-0.5 h-6 w-6 shrink-0 text-blue-600 dark:text-blue-400'
							aria-hidden='true'
						/>
						<div className='space-y-1'>
							<span className='flex flex-wrap items-center gap-2 font-semibold text-zinc-900 dark:text-white'>
								{option.title}
								{option.isRecommended && (
									<span className='rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 ring-inset dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-500/30'>
										Lo habitual
									</span>
								)}
							</span>
							<span className='block text-sm text-zinc-600 dark:text-zinc-400'>
								{option.description}
							</span>
						</div>
					</div>
				</Radio>
			))}
		</div>
	</fieldset>
);

export default ReceiptOriginSelector;
