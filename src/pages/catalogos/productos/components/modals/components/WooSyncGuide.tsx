import React from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface WooSyncGuideProps {
	isOpen: boolean;
	onClose: () => void;
}

type Direction = 'erp-to-woo' | 'bidirectional';

interface SyncRow {
	icon: string;
	label: string;
	direction: Direction;
	detail: string;
}

/**
 * Cómo se comportan los datos entre el ERP y WooCommerce. Documentado para el
 * usuario porque la sincronización tiene reglas por campo (algunos van solo del
 * ERP a Woo, otros en ambos sentidos) que no son evidentes desde la UI.
 */
const SYNC_ROWS: SyncRow[] = [
	{
		icon: 'HeroArchiveBox',
		label: 'Stock',
		direction: 'erp-to-woo',
		detail: 'El ERP siempre manda el stock. Si lo cambian en Woo, se sobreescribe con el del ERP.',
	},
	{
		icon: 'HeroCurrencyDollar',
		label: 'Precio',
		direction: 'bidirectional',
		detail: 'Se sincroniza en ambos sentidos, pero desde el precio de canal (no el precio base del producto en el ERP).',
	},
	{
		icon: 'HeroDocumentText',
		label: 'Descripción (corta y larga)',
		direction: 'bidirectional',
		detail: 'Cambios en Woo o en el ERP se reflejan en el otro lado.',
	},
	{
		icon: 'HeroTag',
		label: 'Categorías',
		direction: 'bidirectional',
		detail: 'Se sincronizan en ambos sentidos.',
	},
	{
		icon: 'HeroBookmark',
		label: 'Marcas',
		direction: 'bidirectional',
		detail: 'Se sincronizan en ambos sentidos.',
	},
];

const DirectionBadge: React.FC<{ direction: Direction }> = ({ direction }) => {
	if (direction === 'erp-to-woo') {
		return (
			<span className='inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300'>
				ERP <Icon icon='HeroArrowRight' className='h-3 w-3' /> Woo
			</span>
		);
	}
	return (
		<span className='inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300'>
			ERP <Icon icon='HeroArrowsRightLeft' className='h-3 w-3' /> Woo
		</span>
	);
};

const WooSyncGuide: React.FC<WooSyncGuideProps> = ({ isOpen, onClose }) => {
	return (
		<Modal isOpen={isOpen} setIsOpen={onClose} isCentered>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<span className='flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/25 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-400/30'>
						<Icon icon='HeroShoppingBag' className='h-6 w-6' />
					</span>
					<div className='mt-3'>
						<p className='text-xl font-bold'>¿Cómo funciona la sincronización con WooCommerce?</p>
						<p className='text-sm text-neutral-500'>
							Publica este producto en tu tienda y mantenlo sincronizado automáticamente.
						</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='space-y-5 py-2'>
					{/* Qué pasa al activar */}
					<div className='flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/30'>
						<Icon
							icon='HeroCheckCircle'
							className='mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400'
						/>
						<p className='text-sm text-emerald-900 dark:text-emerald-100'>
							Al <strong>activar la sincronización</strong>, el producto se publica en la
							tienda seleccionada y se mantiene conectado. A partir de ahí, cada campo se
							sincroniza según estas reglas:
						</p>
					</div>

					{/* Tabla de campos */}
					<div className='overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700'>
						{SYNC_ROWS.map((row, index) => (
							<div
								key={row.label}
								className={`flex items-start gap-3 p-3.5 ${
									index !== SYNC_ROWS.length - 1
										? 'border-b border-neutral-100 dark:border-neutral-800'
										: ''
								}`}>
								<span className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'>
									<Icon icon={row.icon} className='h-4 w-4' />
								</span>
								<div className='min-w-0 flex-1'>
									<div className='flex flex-wrap items-center gap-2'>
										<span className='text-sm font-semibold text-neutral-900 dark:text-neutral-100'>
											{row.label}
										</span>
										<DirectionBadge direction={row.direction} />
									</div>
									<p className='mt-0.5 text-xs text-neutral-500 dark:text-neutral-400'>
										{row.detail}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Nombre y precio por canal */}
					<div className='flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-500/30 dark:bg-sky-950/30'>
						<Icon
							icon='HeroInformationCircle'
							className='mt-0.5 h-5 w-5 flex-shrink-0 text-sky-600 dark:text-sky-400'
						/>
						<div className='space-y-1'>
							<p className='text-sm font-semibold text-sky-900 dark:text-sky-100'>
								Nombre y precio propios por canal
							</p>
							<p className='text-xs text-sky-800 dark:text-sky-200'>
								Cada tienda guarda su <strong>propio nombre y precio</strong>, sin pisar
								los del ERP. Así no tienes que reescribir nada y cada marketplace
								mantiene los suyos. Es <strong>agnóstico al canal</strong>: la misma
								lógica aplica a los próximos marketplaces que se integren.
							</p>
						</div>
					</div>

					{/* Advertencia stock */}
					<div className='flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/30'>
						<Icon
							icon='HeroExclamationTriangle'
							className='mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400'
						/>
						<p className='text-xs text-amber-900 dark:text-amber-100'>
							<strong>El stock lo controla siempre el ERP.</strong> Si editas el stock
							directamente en WooCommerce, el sistema lo vuelve a sobreescribir con el
							valor del ERP en la próxima sincronización.
						</p>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<div className='flex w-full justify-end'>
					<Button variant='solid' color='emerald' icon='HeroCheckCircle' onClick={onClose}>
						Entendido
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default WooSyncGuide;
