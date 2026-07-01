/**
 * Muestra en qué tiendas WooCommerce está publicado/vinculado un producto.
 * Cruza los vínculos de `marketplace_external_ids` con los nombres de las
 * integraciones para que el usuario sepa "este producto está aquí, aquí y aquí".
 */

import React from 'react';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import type { WooProductLink } from '@/utils/wooProductMeta.util';

interface WooProductStorefrontsProps {
	links: WooProductLink[];
	getIntegrationName: (id: string | null | undefined) => string;
	/** Id de la tienda activa en el selector, para resaltarla. */
	activeIntegrationId?: string | null;
	/** Ids de integraciones que ya no están activas (para marcar la tienda). */
	inactiveIntegrationIds?: Set<string>;
}

const WooProductStorefronts: React.FC<WooProductStorefrontsProps> = ({
	links,
	getIntegrationName,
	activeIntegrationId = null,
	inactiveIntegrationIds,
}) => {
	if (links.length === 0) {
		return (
			<div className='flex items-start gap-2.5 rounded-lg border border-dashed border-neutral-300 bg-white p-3.5 dark:border-neutral-600 dark:bg-neutral-800/50'>
				<Icon
					icon='HeroBuildingStorefront'
					className='mt-0.5 h-5 w-5 flex-shrink-0 text-neutral-400 dark:text-neutral-500'
				/>
				<div>
					<p className='text-sm font-medium text-neutral-700 dark:text-neutral-200'>
						No publicado en ninguna tienda
					</p>
					<p className='mt-0.5 text-xs text-neutral-500 dark:text-neutral-400'>
						Este producto todavía no está vinculado a ninguna tienda WooCommerce.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className='rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-500/25 dark:bg-emerald-950/20'>
			<div className='mb-2.5 flex items-center gap-2'>
				<Icon
					icon='HeroBuildingStorefront'
					className='h-4 w-4 text-emerald-600 dark:text-emerald-400'
				/>
				<span className='text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300'>
					Publicado en {links.length} tienda{links.length !== 1 ? 's' : ''}
				</span>
			</div>

			<ul className='space-y-2'>
				{links.map((link, idx) => {
					const unidentified = link.integrationId == null;
					const name = unidentified
						? 'Tienda no identificada'
						: getIntegrationName(link.integrationId);
					const isActive =
						!unidentified && activeIntegrationId === link.integrationId;
					const isInactive =
						link.integrationId != null &&
						inactiveIntegrationIds?.has(link.integrationId);
					const hasError = link.lastErrorMsg != null;

					return (
						<li
							key={link.integrationId ?? `link-${idx}`}
							className={`flex items-center gap-2.5 rounded-md border p-2.5 transition-colors ${
								isActive
									? 'border-emerald-400 bg-emerald-100/60 ring-1 ring-emerald-300 dark:border-emerald-500/50 dark:bg-emerald-900/30 dark:ring-emerald-500/30'
									: 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800/50'
							}`}>
							<div
								className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
									hasError
										? 'bg-rose-500/15 dark:bg-rose-500/20'
										: 'bg-emerald-500/15 dark:bg-emerald-500/20'
								}`}>
								<Icon
									icon={hasError ? 'HeroExclamationTriangle' : 'HeroGlobeAlt'}
									className={`h-4 w-4 ${
										hasError
											? 'text-rose-600 dark:text-rose-400'
											: 'text-emerald-600 dark:text-emerald-400'
									}`}
								/>
							</div>

							<div className='min-w-0 flex-1'>
								<div className='flex flex-wrap items-center gap-1.5'>
									<span className='truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100'>
										{name}
									</span>
									{isActive && (
										<Badge color='emerald' variant='solid'>
											Seleccionada
										</Badge>
									)}
									{isInactive && (
										<Badge color='zinc' variant='outline'>
											Tienda inactiva
										</Badge>
									)}
									{unidentified && (
										<Badge color='amber' variant='outline'>
											Sin identificar
										</Badge>
									)}
								</div>
								<div className='mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400'>
									<span>
										ID:{' '}
										<span className='font-mono font-medium text-neutral-700 dark:text-neutral-300'>
											#{link.externalProductId}
										</span>
									</span>
									{link.publishedAt && (
										<span>
											Publicado:{' '}
											{new Date(link.publishedAt).toLocaleDateString('es-CL')}
										</span>
									)}
								</div>
								{hasError && (
									<p className='mt-1 text-xs font-medium text-rose-600 dark:text-rose-400'>
										<Icon
											icon='HeroExclamationCircle'
											className='mr-1 inline h-3 w-3'
										/>
										{link.lastErrorMsg}
									</p>
								)}
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
};

export default WooProductStorefronts;
