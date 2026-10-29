import React, { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Collapse from '@/components/utils/Collapse';
import { getWebhookCatalog } from '@/services/integrationsService';
import type { WebhookCatalogEntry } from '@/types/integrations.types';

interface WebhookCatalogPanelProps {
	/** Filtra el catálogo al proveedor de la integración (ej. "woocommerce"). */
	provider?: string;
}

/** Título legible derivado de la key del webhook (ej. "woocommerce.orders"). */
const entryTitle = (entry: WebhookCatalogEntry): string => {
	const suffix = entry.key.split('.').pop();
	const map: Record<string, string> = {
		orders: 'Webhook de pedidos',
		products: 'Webhook de productos',
	};
	return (suffix && map[suffix]) || entry.provider_label || entry.key;
};

/** Una entrada del catálogo, colapsable de forma independiente. */
const WebhookEntryItem: React.FC<{ entry: WebhookCatalogEntry }> = ({ entry }) => {
	const [open, setOpen] = useState(false);

	return (
		<div className='rounded-md border border-blue-200/70 bg-white/70 dark:border-blue-500/20 dark:bg-neutral-900/40'>
			<button
				type='button'
				onClick={() => setOpen((v) => !v)}
				className='flex w-full items-center justify-between gap-2 p-3 text-left'>
				<span className='text-sm font-semibold text-gray-800 dark:text-gray-100'>
					{entryTitle(entry)}
				</span>
				<Icon
					icon='HeroChevronDown'
					className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
				/>
			</button>

			<Collapse isOpen={open}>
				<div className='px-3 pb-3'>
					{entry.description && (
						<p className='text-xs text-gray-600 dark:text-gray-300'>
							{entry.description}
						</p>
					)}

					{/* Eventos / topics */}
					{entry.topics.length > 0 && (
						<div className='mt-2 space-y-1'>
							{entry.topics.map((topic) => (
								<div key={topic.topic}>
									<code className='rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-100'>
										{topic.topic}
									</code>
									{topic.description && (
										<span className='ml-2 text-xs text-gray-600 dark:text-gray-300'>
											{topic.description}
										</span>
									)}
								</div>
							))}
						</div>
					)}

					{/* Efectos por estado de pedido (webhook de órdenes) */}
					{entry.status_effects && entry.status_effects.length > 0 && (
						<div className='mt-2'>
							<p className='text-xs font-semibold text-gray-700 dark:text-gray-200'>
								Efecto según estado del pedido
							</p>
							<ul className='mt-1 space-y-1'>
								{entry.status_effects.map((se) => (
									<li key={se.effect} className='text-xs'>
										<span className='flex flex-wrap gap-1'>
											{se.statuses.map((status) => (
												<Badge key={status} color='zinc'>
													{status}
												</Badge>
											))}
										</span>
										<span className='text-gray-600 dark:text-gray-300'>
											{se.effect}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Efectos por campo (webhook de productos) */}
					{entry.field_effects && entry.field_effects.length > 0 && (
						<div className='mt-2'>
							<p className='text-xs font-semibold text-gray-700 dark:text-gray-200'>
								Campos que se sincronizan
							</p>
							<ul className='mt-1 space-y-1'>
								{entry.field_effects.map((fe) => (
									<li key={fe.effect} className='text-xs'>
										<span className='flex flex-wrap gap-1'>
											{fe.fields.map((field) => (
												<Badge key={field} color='zinc'>
													{field}
												</Badge>
											))}
										</span>
										<span className='text-gray-600 dark:text-gray-300'>
											{fe.effect}
										</span>
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Autenticación */}
					{entry.auth && (
						<p className='mt-2 text-xs text-gray-600 dark:text-gray-300'>
							<span className='font-semibold'>Autenticación: </span>
							{entry.auth}
						</p>
					)}

					{/* Notas de comportamiento */}
					{entry.notes && entry.notes.length > 0 && (
						<ul className='mt-2 list-inside list-disc text-xs text-gray-500 dark:text-gray-400'>
							{entry.notes.map((note) => (
								<li key={note}>{note}</li>
							))}
						</ul>
					)}
				</div>
			</Collapse>
		</div>
	);
};

/**
 * Panel informativo (solo lectura, colapsable) que muestra el catálogo dinámico de
 * webhooks entrantes soportados por el ERP: qué eventos se reciben, su efecto sobre
 * inventario/reservas (por estado de pedido o por campo de producto), cómo se autentican
 * y notas de comportamiento. Se alimenta de `GET /integrations/webhooks/catalog`.
 */
const WebhookCatalogPanel: React.FC<WebhookCatalogPanelProps> = ({ provider }) => {
	const [entries, setEntries] = useState<WebhookCatalogEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError(null);
		getWebhookCatalog()
			.then((data) => {
				if (active) setEntries(data);
			})
			.catch((err: unknown) => {
				if (active) {
					setError(
						err instanceof Error
							? err.message
							: 'No se pudo cargar el catálogo de webhooks',
					);
				}
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, []);

	const visibleEntries = useMemo(
		() => (provider ? entries.filter((e) => e.provider === provider) : entries),
		[entries, provider],
	);

	return (
		<div className='rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-950/30'>
			<button
				type='button'
				onClick={() => setOpen((v) => !v)}
				className='flex w-full items-center justify-between gap-2 p-4 text-left'>
				<span className='flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-100'>
					<Icon icon='HeroBolt' className='text-blue-600 dark:text-blue-300' />
					Eventos soportados por el webhook
					{!loading && !error && visibleEntries.length > 0 && (
						<Badge color='blue'>{visibleEntries.length}</Badge>
					)}
				</span>
				<Icon
					icon='HeroChevronDown'
					className={`shrink-0 text-blue-600 transition-transform dark:text-blue-300 ${open ? 'rotate-180' : ''}`}
				/>
			</button>

			<Collapse isOpen={open}>
				<div className='space-y-3 px-4 pb-4'>
					{loading && (
						<p className='flex items-center gap-2 text-sm text-blue-700 dark:text-blue-200'>
							<Icon icon='HeroArrowPath' className='animate-spin' />
							Cargando catálogo…
						</p>
					)}

					{!loading && error && (
						<p className='text-sm text-gray-600 dark:text-gray-300'>
							No se pudo cargar el catálogo de eventos ({error}). La integración
							funciona igual; este detalle es solo informativo.
						</p>
					)}

					{!loading && !error && visibleEntries.length === 0 && (
						<p className='text-sm text-gray-600 dark:text-gray-300'>
							El backend no reportó webhooks en el catálogo para este proveedor.
						</p>
					)}

					{!loading &&
						!error &&
						visibleEntries.map((entry) => (
							<WebhookEntryItem key={entry.key} entry={entry} />
						))}
				</div>
			</Collapse>
		</div>
	);
};

export default WebhookCatalogPanel;
