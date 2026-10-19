import React, { useMemo } from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import type {
	ISaleFulfillmentOptionItem,
	ISaleItem,
	ISaleStockShortageItem,
} from '@/interface/sales.interface';
import type { ISaleLocationAllocation } from '../../hooks/useSaleLocationAllocation';
import SaleLocationAllocationItem from './SaleLocationAllocationItem';

interface ISaleLocationAllocationPanelProps {
	allocation: ISaleLocationAllocation;
	/** Ítems de la venta, para nombrar cada línea como en el resto del detalle. */
	saleItems: ISaleItem[];
	disabled: boolean;
	rowErrors: Record<number, string[]>;
	shortagesByItem: ReadonlyMap<number, ISaleStockShortageItem>;
}

const describeOption = (option: ISaleFulfillmentOptionItem, item: ISaleItem | undefined) => {
	const sku = item?.sku || item?.product?.sku || option.product.sku;
	const name = item?.product?.name || item?.name || option.product.name;
	return sku ? `${sku} — ${name}` : name;
};

/** Etapa 2 del cierre: de qué ubicación sale cada ítem sin serie. */
const SaleLocationAllocationPanel: React.FC<ISaleLocationAllocationPanelProps> = ({
	allocation,
	saleItems,
	disabled,
	rowErrors,
	shortagesByItem,
}) => {
	const { status, loadError, options, formik, reselectNotes, hasBlocked, reload } = allocation;
	const itemsById = useMemo(() => new Map(saleItems.map((it) => [it.id, it])), [saleItems]);
	const isLoading = status === 'loading';

	if (status === 'error') {
		return (
			<Alert
				color='red'
				colorIntensity='500'
				variant='outline'
				icon='HeroExclamationTriangle'
				className='text-sm'
				role='alert'>
				<div className='flex flex-wrap items-center justify-between gap-2'>
					<span>{loadError}</span>
					<Button
						type='button'
						variant='outline'
						color='red'
						size='sm'
						icon='HeroArrowPath'
						onClick={() => {
							void reload();
						}}>
						Reintentar
					</Button>
				</div>
			</Alert>
		);
	}

	if (options.length === 0) {
		return isLoading ? (
			<p
				role='status'
				className='flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400'>
				<Icon icon='DuoLoading' className='h-4 w-4 animate-spin' />
				Cargando las ubicaciones de salida…
			</p>
		) : null;
	}

	return (
		<section aria-labelledby='sale-location-allocation-title' className='space-y-3'>
			<div className='space-y-1'>
				<h3
					id='sale-location-allocation-title'
					className='flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
					<Icon icon='HeroMapPin' className='h-4 w-4' />
					Ubicación de salida
					{isLoading && (
						<span
							role='status'
							className='flex items-center gap-1 text-xs font-normal text-zinc-500 dark:text-zinc-400'>
							<Icon icon='DuoLoading' className='h-3 w-3 animate-spin' />
							Actualizando…
						</span>
					)}
				</h3>
				<p className='text-xs text-zinc-600 dark:text-zinc-400'>
					Elige de qué ubicación sale cada ítem sin serie. Si sólo una tiene stock, sale
					de ella sin elegir.
				</p>
			</div>

			{options.map((option) => (
				<SaleLocationAllocationItem
					key={option.sale_item_id}
					option={option}
					label={describeOption(option, itemsById.get(option.sale_item_id))}
					formik={formik}
					disabled={disabled || isLoading}
					reselectNotes={reselectNotes[option.sale_item_id]}
					rowErrors={rowErrors[option.sale_item_id]}
					shortage={shortagesByItem.get(option.sale_item_id)}
				/>
			))}

			{hasBlocked && (
				<p className='text-xs font-semibold text-red-700 dark:text-red-300'>
					No se puede cerrar la venta mientras un ítem no tenga stock suficiente en la
					sucursal.
				</p>
			)}
		</section>
	);
};

export default SaleLocationAllocationPanel;
