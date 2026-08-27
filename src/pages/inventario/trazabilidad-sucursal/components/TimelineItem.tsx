import { useCallback, useMemo, useState, type ReactNode } from 'react';
import Icon, { type IIconProps } from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { IInventoryMovement } from '@/interface/inventoryMovements.interface';

type MovementTypeConfig = {
	label: string;
	color: 'emerald' | 'red' | 'blue' | 'amber' | 'violet' | 'zinc';
	icon: string;
	bgColor: string;
};

interface MetadataPresentation {
	label: string;
	icon: IIconProps['icon'];
	iconClassName: string;
}

const DEFAULT_METADATA_PRESENTATION: MetadataPresentation = {
	label: '',
	icon: 'HeroTag',
	iconClassName: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300',
};

const METADATA_PRESENTATIONS: Record<string, MetadataPresentation> = {
	batch_id: {
		label: 'Lote de ajuste',
		icon: 'HeroArchiveBox',
		iconClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
	},
	origin: {
		label: 'Origen técnico',
		icon: 'HeroLink',
		iconClassName: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300',
	},
	notes: {
		label: 'Notas',
		icon: 'HeroDocumentText',
		iconClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
	},
	stock_target: {
		label: 'Stock objetivo',
		icon: 'HeroHashtag',
		iconClassName:
			'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
	},
	serial_number: {
		label: 'Número de serie',
		icon: 'HeroTag',
		iconClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
	},
	serial_numbers: {
		label: 'Números de serie',
		icon: 'HeroTag',
		iconClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
	},
	traceability_type: {
		label: 'Tipo de trazabilidad',
		icon: 'HeroLink',
		iconClassName: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300',
	},
	equipment_type: {
		label: 'Tipo de equipo',
		icon: 'HeroCube',
		iconClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
	},
	grade: {
		label: 'Grado del equipo',
		icon: 'HeroTag',
		iconClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
	},
	current_status: {
		label: 'Estado actual',
		icon: 'HeroClipboardDocumentCheck',
		iconClassName:
			'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
	},
	review_status: {
		label: 'Estado de revisión',
		icon: 'HeroClipboardDocumentCheck',
		iconClassName:
			'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
	},
	sale_id: {
		label: 'Venta asociada',
		icon: 'HeroShoppingCart',
		iconClassName: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300',
	},
	sale_item_id: {
		label: 'Ítem de la venta',
		icon: 'HeroShoppingCart',
		iconClassName: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300',
	},
	requested_qty: {
		label: 'Cantidad solicitada',
		icon: 'HeroHashtag',
		iconClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
	},
	customer_id: {
		label: 'Cliente asociado',
		icon: 'HeroUser',
		iconClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
	},
	customer_name: {
		label: 'Nombre del cliente',
		icon: 'HeroUser',
		iconClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
	},
	sale_branch_id: {
		label: 'Sucursal de la venta',
		icon: 'HeroBuildingStorefront',
		iconClassName:
			'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
	},
	stock_source_branch_id: {
		label: 'Sucursal de origen del stock',
		icon: 'HeroBuildingStorefront',
		iconClassName:
			'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
	},
	warehouse_id: {
		label: 'Bodega asociada',
		icon: 'HeroArchiveBox',
		iconClassName: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
	},
	product_id: {
		label: 'Producto asociado',
		icon: 'HeroCube',
		iconClassName: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
	},
	reference_id: {
		label: 'Referencia asociada',
		icon: 'HeroIdentification',
		iconClassName: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
	},
	reference_type: {
		label: 'Tipo de referencia',
		icon: 'HeroIdentification',
		iconClassName: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
	},
};

const METADATA_VALUE_LABELS: Record<string, string> = {
	serialized_mirror: 'Trazabilidad serializada',
	available_for_sale: 'Disponible para venta',
	approved: 'Aprobado',
	pending: 'Pendiente',
	rejected: 'Rechazado',
	batch_adjustment: 'Ajuste por lote',
	notebook: 'Notebook',
	desktop: 'Computador de escritorio',
};

const getMetadataPresentation = (key: string): MetadataPresentation => {
	const knownPresentation = Object.prototype.hasOwnProperty.call(METADATA_PRESENTATIONS, key)
		? METADATA_PRESENTATIONS[key]
		: undefined;
	if (knownPresentation) return knownPresentation;

	const normalized = key.replace(/[_-]+/g, ' ').trim();
	const label = normalized
		? normalized.charAt(0).toUpperCase() + normalized.slice(1)
		: 'Dato sin nombre';

	return { ...DEFAULT_METADATA_PRESENTATION, label };
};

const hasMeaningfulMetadataValue = (value: unknown): boolean => {
	if (value === null || typeof value === 'undefined') return false;
	if (typeof value === 'string') return value.trim().length > 0;
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === 'object') return Object.keys(value).length > 0;

	return true;
};

const formatMetadataValue = (key: string, value: unknown): string => {
	if (value === null || typeof value === 'undefined' || value === '') return 'Sin información';
	if (typeof value === 'boolean') return value ? 'Sí' : 'No';
	if (typeof value === 'string') {
		const translatedValue = Object.prototype.hasOwnProperty.call(METADATA_VALUE_LABELS, value)
			? METADATA_VALUE_LABELS[value]
			: undefined;
		return translatedValue ?? value;
	}
	if (typeof value === 'number' || typeof value === 'bigint') {
		if (key === 'requested_qty') {
			return `${String(value)} ${value === 1 ? 'unidad' : 'unidades'}`;
		}

		const prefixes: Record<string, string> = {
			sale_id: 'Venta #',
			sale_item_id: 'Ítem #',
			customer_id: 'Cliente #',
			sale_branch_id: 'Sucursal #',
			stock_source_branch_id: 'Sucursal #',
			warehouse_id: 'Bodega #',
			product_id: 'Producto #',
			reference_id: 'Referencia #',
		};

		const prefix = prefixes[key] ?? '';
		if (prefix) return `${prefix}${String(value)}`;
		return String(value);
	}

	if (typeof value === 'object') {
		if (
			Array.isArray(value) &&
			value.every((item) => typeof item === 'string' || typeof item === 'number')
		) {
			return value.length > 0
				? value.map((item) => `• ${String(item)}`).join('\n')
				: 'Sin información';
		}

		try {
			return JSON.stringify(value, null, 2) ?? 'Sin valor';
		} catch {
			return 'Valor no disponible';
		}
	}

	return String(value);
};

const getMetadataCardSpanClass = (index: number, totalEntries: number, isWide: boolean): string => {
	const isLastEntry = index === totalEntries - 1;
	let fillsLastRow = false;
	if (isLastEntry) {
		fillsLastRow = totalEntries <= 3 ? totalEntries % 2 === 1 : totalEntries % 3 === 1;
	}
	const smallSpan = isWide || fillsLastRow ? 'sm:col-span-2' : '';
	const largeSpan =
		totalEntries > 3 && isLastEntry && totalEntries % 3 === 1 ? 'xl:col-span-3' : '';

	return `${smallSpan} ${largeSpan}`.trim();
};

interface DetailFieldProps {
	icon: IIconProps['icon'];
	label: string;
	children: ReactNode;
	className?: string;
}

const DetailField = ({ icon, label, children, className = '' }: DetailFieldProps) => (
	<div
		className={`min-w-0 rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/60 ${className}`}>
		<dt className='flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
			<Icon icon={icon} className='h-4 w-4 shrink-0 text-blue-500' aria-hidden='true' />
			{label}
		</dt>
		<dd className='mt-2 min-w-0 text-sm font-medium text-zinc-900 dark:text-zinc-100'>
			{children}
		</dd>
	</div>
);

// Tipos de movimiento (según Enum MovementType del backend)
const MOVEMENT_TYPE_MAP: Record<string, MovementTypeConfig> = {
	// Tipos Oficiales del Enum
	entry: {
		label: 'Ingreso',
		color: 'emerald',
		icon: 'HeroArrowDownTray',
		bgColor: 'bg-emerald-500',
	},
	status_change: {
		label: 'Cambio de Estado',
		color: 'amber',
		icon: 'HeroArrowPath',
		bgColor: 'bg-amber-500',
	},
	warehouse_transfer: {
		label: 'Transferencia de Bodega',
		color: 'blue',
		icon: 'HeroArrowsRightLeft',
		bgColor: 'bg-blue-500',
	},
	reservation: {
		label: 'Reserva',
		color: 'violet',
		icon: 'HeroBookmark',
		bgColor: 'bg-violet-500',
	},
	sale: { label: 'Venta', color: 'emerald', icon: 'HeroShoppingCart', bgColor: 'bg-emerald-500' },
	return: {
		label: 'Devolución',
		color: 'blue',
		icon: 'HeroArrowUturnLeft',
		bgColor: 'bg-blue-500',
	},
	adjustment: {
		label: 'Ajuste',
		color: 'amber',
		icon: 'HeroWrenchScrewdriver',
		bgColor: 'bg-amber-500',
	},
	// Otros tipos utilizados en el código
	initial_balance: {
		label: 'Balance Inicial',
		color: 'blue',
		icon: 'HeroArchiveBox',
		bgColor: 'bg-blue-500',
	},
	manual_adjustment: {
		label: 'Ajuste Manual',
		color: 'amber',
		icon: 'HeroPencilSquare',
		bgColor: 'bg-amber-500',
	},
	import_adjustment: {
		label: 'Ajuste por Importación',
		color: 'violet',
		icon: 'HeroDocumentArrowUp',
		bgColor: 'bg-violet-500',
	},
	reserve: {
		label: 'Reserva (Stock)',
		color: 'violet',
		icon: 'HeroLockClosed',
		bgColor: 'bg-violet-500',
	},
	release: {
		label: 'Liberación (Stock)',
		color: 'emerald',
		icon: 'HeroLockOpen',
		bgColor: 'bg-emerald-500',
	},
	transfer_in: {
		label: 'Transferencia Entrada',
		color: 'emerald',
		icon: 'HeroArrowDownTray',
		bgColor: 'bg-emerald-500',
	},
	transfer_out: {
		label: 'Transferencia Salida',
		color: 'red',
		icon: 'HeroArrowUpTray',
		bgColor: 'bg-red-500',
	},
	reconciliation: {
		label: 'Reconciliación',
		color: 'blue',
		icon: 'HeroScale',
		bgColor: 'bg-blue-500',
	},
};

const getMovementConfig = (type: string): MovementTypeConfig => {
	return (
		MOVEMENT_TYPE_MAP[type] || {
			label: type,
			color: 'zinc',
			icon: 'HeroQuestionMarkCircle',
			bgColor: 'bg-zinc-500',
		}
	);
};

const formatDate = (dateString: string): string => {
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-CL', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return dateString;
	}
};

const formatShortDate = (dateString: string): string => {
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-CL', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return dateString;
	}
};

interface TimelineItemProps {
	movement: IInventoryMovement;
	isLast?: boolean;
}

export function TimelineItem({ movement, isLast = false }: TimelineItemProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const config = useMemo(
		() => getMovementConfig(movement.movement_type),
		[movement.movement_type],
	);

	const quantityStyle = useMemo(() => {
		const delta = movement.quantity_delta;
		if (delta > 0)
			return {
				color: 'text-emerald-600 dark:text-emerald-400',
				prefix: '+',
				bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
			};
		if (delta < 0)
			return {
				color: 'text-red-600 dark:text-red-400',
				prefix: '',
				bgColor: 'bg-red-100 dark:bg-red-900/30',
			};
		return {
			color: 'text-zinc-600 dark:text-zinc-400',
			prefix: '',
			bgColor: 'bg-zinc-100 dark:bg-zinc-800',
		};
	}, [movement.quantity_delta]);

	const toggleExpand = useCallback(() => {
		setIsExpanded((prev) => !prev);
	}, []);

	const metadataEntries = useMemo(
		() =>
			Object.entries(movement.metadata ?? {})
				.filter(([, value]) => hasMeaningfulMetadataValue(value))
				.map(([key, value]) => {
					const presentation = getMetadataPresentation(key);
					const formattedValue = formatMetadataValue(key, value);
					return {
						key,
						...presentation,
						value: formattedValue,
						isStructured: typeof value === 'object' && value !== null,
						isWide: formattedValue.length > 80,
					};
				}),
		[movement.metadata],
	);

	const detailsId = `movement-details-${movement.id}`;
	const detailsTitleId = `${detailsId}-title`;
	const metadataTitleId = `${detailsId}-metadata-title`;
	const hasSource = Boolean(
		movement.source?.type || movement.source?.id || movement.source?.line_id,
	);
	const isSaleSource = movement.source?.type?.endsWith('\\Sale') ?? false;
	const sourceTypeLabel = isSaleSource ? 'Venta' : movement.source?.type;
	const metadataGridClassName = metadataEntries.length > 3 ? 'xl:grid-cols-3' : '';

	return (
		<div className='relative flex gap-4'>
			{/* Timeline line */}
			{!isLast && (
				<div className='absolute left-[19px] top-10 h-[calc(100%-2rem)] w-0.5 bg-gradient-to-b from-zinc-300 to-zinc-200 dark:from-zinc-600 dark:to-zinc-700' />
			)}

			{/* Icon circle */}
			<div
				className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor} shadow-lg`}>
				<Icon icon={config.icon} className='h-5 w-5 text-white' />
			</div>

			{/* Content */}
			<div className='flex-1 pb-6'>
				{/* Header - Always visible */}
				<button
					type='button'
					onClick={toggleExpand}
					aria-expanded={isExpanded}
					aria-controls={detailsId}
					aria-label={`${isExpanded ? 'Ocultar' : 'Mostrar'} detalles del movimiento de ${movement.product?.name ?? 'producto desconocido'}`}
					className='group w-full rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-600 dark:focus-visible:ring-offset-zinc-900'>
					<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
						<div className='flex flex-1 flex-col gap-1'>
							{/* Product name */}
							<span className='text-base font-semibold text-zinc-900 dark:text-white'>
								{movement.product?.name ?? 'Producto desconocido'}
							</span>
							{/* SKU */}
							<span className='font-mono text-xs text-zinc-500 dark:text-zinc-400'>
								SKU: {movement.product?.sku ?? 'N/A'}
							</span>
						</div>

						<div className='flex flex-wrap items-center gap-2'>
							{/* Movement type badge */}
							<Badge color={config.color} variant='solid' className='px-2 text-xs'>
								{config.label}
							</Badge>

							{/* Quantity delta */}
							<Badge
								variant='outline'
								className={`px-2 font-mono text-sm font-bold ${quantityStyle.color}`}>
								{quantityStyle.prefix}
								{movement.quantity_delta}
							</Badge>

							{/* Date */}
							<span className='text-xs text-zinc-500 dark:text-zinc-400'>
								{formatShortDate(movement.occurred_at)}
							</span>

							{/* Expand icon */}
							<Icon
								icon={isExpanded ? 'HeroChevronUp' : 'HeroChevronDown'}
								className='h-5 w-5 text-zinc-400 transition-transform duration-200 group-hover:text-blue-500'
							/>
						</div>
					</div>
				</button>

				{/* Expanded details */}
				<div
					id={detailsId}
					aria-hidden={!isExpanded}
					className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${
						isExpanded
							? 'mt-3 grid-rows-[1fr] opacity-100'
							: 'grid-rows-[0fr] opacity-0'
					}`}>
					<div className='min-h-0 overflow-hidden'>
						<section
							aria-labelledby={detailsTitleId}
							className='rounded-xl border border-zinc-200 bg-zinc-100/80 p-4 shadow-inner dark:border-zinc-700 dark:bg-zinc-900/50'>
							<div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
								<div className='flex items-center gap-3'>
									<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300'>
										<Icon
											icon='HeroDocumentText'
											className='h-5 w-5'
											aria-hidden='true'
										/>
									</span>
									<div>
										<h3
											id={detailsTitleId}
											className='text-base font-semibold text-zinc-900 dark:text-white'>
											Detalle del movimiento
										</h3>
										<p className='text-sm text-zinc-500 dark:text-zinc-400'>
											Información operativa y técnica registrada
										</p>
									</div>
								</div>
								<Badge
									color='zinc'
									variant='outline'
									className='self-start px-2 sm:self-auto'>
									Movimiento #{movement.id}
								</Badge>
							</div>

							<div className='grid gap-4'>
								<section className='rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800'>
									<h4 className='flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
										<Icon
											icon='HeroArrowsRightLeft'
											className='h-5 w-5 text-violet-500'
											aria-hidden='true'
										/>
										Cambio de stock
									</h4>
									<div className='mt-5 grid grid-cols-3 items-center gap-2'>
										<div className='text-center'>
											<span className='block text-xs font-medium uppercase tracking-wide text-zinc-500'>
												Anterior
											</span>
											<span className='mt-1 block text-2xl font-bold text-zinc-700 dark:text-zinc-200'>
												{movement.balance_before}
											</span>
										</div>
										<div className='flex flex-col items-center gap-2'>
											<span
												className={`rounded-lg ${quantityStyle.bgColor} px-3 py-1 font-mono text-lg font-bold ${quantityStyle.color}`}>
												{quantityStyle.prefix}
												{movement.quantity_delta}
											</span>
											<Icon
												icon='HeroArrowRight'
												className='h-5 w-5 text-zinc-400'
												aria-hidden='true'
											/>
										</div>
										<div className='text-center'>
											<span className='block text-xs font-medium uppercase tracking-wide text-zinc-500'>
												Resultante
											</span>
											<span className='mt-1 block text-2xl font-bold text-blue-600 dark:text-blue-400'>
												{movement.balance_after}
											</span>
										</div>
									</div>
								</section>

								<section className='rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800'>
									<h4 className='mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
										Contexto del movimiento
									</h4>
									<dl className='grid gap-3 sm:grid-cols-2'>
										<DetailField icon='HeroBuildingStorefront' label='Sucursal'>
											<span className='break-words'>
												{movement.branch?.name ?? 'No informada'}
											</span>
										</DetailField>
										<DetailField icon='HeroArchiveBox' label='Bodega'>
											<span className='break-words'>
												{movement.warehouse?.name ?? 'Sin bodega'}
											</span>
										</DetailField>
										<DetailField icon='HeroUser' label='Realizado por'>
											<span className='block break-words'>
												{movement.performed_by?.name ??
													'Usuario desconocido'}
											</span>
											<span className='mt-1 block break-all text-xs font-normal text-zinc-500 dark:text-zinc-400'>
												{movement.performed_by?.email ??
													'Sin correo informado'}
											</span>
										</DetailField>
										<DetailField icon='HeroCalendar' label='Ocurrió'>
											{formatDate(movement.occurred_at)}
										</DetailField>
										<DetailField
											icon='HeroDocumentText'
											label='Razón'
											className='sm:col-span-2'>
											<p className='whitespace-pre-wrap break-words font-normal leading-relaxed'>
												{movement.reason || 'Sin razón especificada'}
											</p>
										</DetailField>
										{hasSource && (
											<DetailField
												icon='HeroLink'
												label='Origen'
												className='sm:col-span-2'>
												<div className='flex flex-wrap gap-2'>
													{sourceTypeLabel && (
														<Badge
															color='violet'
															variant='outline'
															className='px-2 text-xs'>
															{sourceTypeLabel}
														</Badge>
													)}
													{movement.source?.id != null && (
														<Badge
															color='zinc'
															variant='outline'
															className='px-2 text-xs'>
															{isSaleSource ? 'Venta' : 'ID'} #
															{movement.source.id}
														</Badge>
													)}
													{movement.source?.line_id != null && (
														<Badge
															color='zinc'
															variant='outline'
															className='px-2 text-xs'>
															{isSaleSource ? 'Ítem' : 'Línea'} #
															{movement.source.line_id}
														</Badge>
													)}
												</div>
											</DetailField>
										)}
										<DetailField
											icon='HeroCalendar'
											label='Registrado'
											className='sm:col-span-2'>
											{formatDate(movement.created_at)}
										</DetailField>
									</dl>
								</section>
							</div>

							{metadataEntries.length > 0 && (
								<section
									aria-labelledby={metadataTitleId}
									className='mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800'>
									<div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
										<div>
											<h4
												id={metadataTitleId}
												className='flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100'>
												<Icon
													icon='HeroCodeBracket'
													className='h-5 w-5 text-violet-500'
													aria-hidden='true'
												/>
												Metadatos del movimiento
											</h4>
											<p className='mt-1 text-xs text-zinc-500 dark:text-zinc-400'>
												Datos técnicos y referencias entregados por el
												origen
											</p>
										</div>
										<Badge
											color='violet'
											variant='outline'
											className='self-start px-2 text-xs sm:self-auto'>
											{metadataEntries.length}{' '}
											{metadataEntries.length === 1 ? 'campo' : 'campos'}
										</Badge>
									</div>
									<dl
										className={`grid gap-3 sm:grid-cols-2 ${metadataGridClassName}`}>
										{metadataEntries.map((entry, index) => (
											<div
												key={entry.key}
												className={`min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/60 ${getMetadataCardSpanClass(
													index,
													metadataEntries.length,
													entry.isWide,
												)}`}>
												<dt className='flex min-w-0 items-start gap-3'>
													<span
														className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${entry.iconClassName}`}>
														<Icon
															icon={entry.icon}
															className='h-4 w-4'
															aria-hidden='true'
														/>
													</span>
													<span className='flex min-w-0 flex-col gap-1'>
														<span className='text-sm font-semibold text-zinc-700 dark:text-zinc-200'>
															{entry.label}
														</span>
														<code className='break-all text-[11px] text-zinc-400 dark:text-zinc-500'>
															{entry.key}
														</code>
													</span>
												</dt>
												<dd
													className={`mt-3 whitespace-pre-wrap break-words border-t border-zinc-200 pt-3 text-zinc-900 dark:border-zinc-700 dark:text-zinc-100 ${
														entry.isStructured
															? 'font-mono text-xs leading-relaxed'
															: 'text-sm font-medium'
													}`}>
													{entry.value}
												</dd>
											</div>
										))}
									</dl>
								</section>
							)}
						</section>
					</div>
				</div>
			</div>
		</div>
	);
}

export default TimelineItem;
