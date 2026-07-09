import React from 'react';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import type { Integration } from '@/types/integrations.types';
import Button from '@/components/ui/Button';

interface WooIntegrationSelectorProps {
	integrations: Integration[];
	selectedId: string | null;
	onSelect: (id: string | null) => void;
	loading: boolean;
}

const WooIntegrationSelector: React.FC<WooIntegrationSelectorProps> = ({
	integrations,
	selectedId,
	onSelect,
	loading,
}) => {
	if (loading) {
		return (
			<div className='flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/50'>
				<Icon icon='HeroArrowPath' className='h-4 w-4 animate-spin text-neutral-400' />
				<span className='text-xs text-neutral-500 dark:text-neutral-400'>
					Cargando tiendas…
				</span>
			</div>
		);
	}

	if (integrations.length === 0) {
		return (
			<div className='rounded-lg border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-500/30 dark:bg-yellow-950/30'>
				<div className='flex items-center gap-2'>
					<Icon
						icon='HeroExclamationTriangle'
						className='h-4 w-4 text-yellow-600 dark:text-yellow-400'
					/>
					<span className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
						No hay integraciones WooCommerce
					</span>
				</div>
				<p className='mt-1 text-xs text-yellow-700 dark:text-yellow-300'>
					Configura una integración WooCommerce en el módulo de Integraciones para operar.
				</p>
			</div>
		);
	}

	if (integrations.length === 1) {
		const integration = integrations[0];
		return (
			<div className='flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-700 dark:bg-neutral-800/50'>
				<Icon
					icon='HeroGlobeAlt'
					className='h-4 w-4 text-violet-500 dark:text-violet-400'
				/>
				<span className='text-xs font-medium text-neutral-700 dark:text-neutral-200'>
					{integration.name}
				</span>
				{integration.is_active ? (
					<Badge color='emerald' variant='solid' className='ml-auto'>
						Conectada
					</Badge>
				) : (
					<Badge color='zinc' variant='outline' className='ml-auto'>
						Inactiva
					</Badge>
				)}
			</div>
		);
	}

	// 2+ tiendas → toggle segmentado de cambio rápido
	return (
		<div className='space-y-1.5'>
			<div className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400'>
				<Icon icon='HeroBuildingStorefront' className='h-3.5 w-3.5' />
				Tienda activa — cambio rápido
			</div>
			<div
				role='tablist'
				aria-label='Seleccionar tienda WooCommerce'
				className='flex flex-wrap gap-1.5 rounded-xl border border-neutral-200 bg-neutral-100 p-1.5 dark:border-neutral-700 dark:bg-neutral-800/60'>
				{integrations.map((i) => {
					const isSelected = i.id === selectedId;
					return (
						<Button
							key={i.id}
							type='button'
							role='tab'
							aria-selected={isSelected}
							onClick={() => onSelect(i.id)}
							className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
								isSelected
									? 'bg-white text-violet-700 shadow-sm ring-1 ring-violet-300 dark:bg-neutral-900 dark:text-violet-300 dark:ring-violet-500/40'
									: 'text-neutral-600 hover:bg-white/60 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900/40 dark:hover:text-neutral-200'
							}`}>
							<span
								className={`h-2 w-2 flex-shrink-0 rounded-full ${
									i.is_active
										? 'bg-emerald-500'
										: 'bg-neutral-400 dark:bg-neutral-500'
								}`}
								aria-hidden
							/>
							<span className='truncate'>{i.name}</span>
							{!i.is_active && (
								<span className='text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500'>
									inactiva
								</span>
							)}
						</Button>
					);
				})}
			</div>
		</div>
	);
};

export default WooIntegrationSelector;
