import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import { IInventoryMovement } from '@/interface/inventoryMovements.interface';
import { useState, useCallback, useMemo } from 'react';

type MovementTypeConfig = {
	label: string;
	color: 'emerald' | 'red' | 'blue' | 'amber' | 'violet' | 'zinc';
	icon: string;
	bgColor: string;
};

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
					className='group w-full rounded-xl border border-zinc-200 bg-gray-300 p-4 text-left shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-600'>
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
					className={`overflow-hidden transition-all duration-300 ease-in-out ${
						isExpanded ? 'mt-3 max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
					}`}>
					<div className='rounded-xl border border-zinc-200 bg-gray-300 p-4 dark:border-zinc-700 dark:bg-zinc-900/50'>
						<div className='grid gap-4 md:grid-cols-2'>
							{/* Cambio de inventario */}
							<div className='rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-800'>
								<h4 className='mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
									<Icon
										icon='HeroArrowsRightLeft'
										className='h-4 w-4 text-violet-500'
									/>
									Cambio de Stock
								</h4>
								<div className='flex items-center justify-center gap-3'>
									<div className='text-center'>
										<span className='block text-xs text-zinc-500'>Antes</span>
										<span className='text-xl font-bold text-zinc-700 dark:text-zinc-200'>
											{movement.balance_before}
										</span>
									</div>
									<Icon icon='HeroArrowRight' className='h-5 w-5 text-zinc-400' />
									<div
										className={`rounded-lg ${quantityStyle.bgColor} px-3 py-1 text-center`}>
										<span
											className={`text-lg font-bold ${quantityStyle.color}`}>
											{quantityStyle.prefix}
											{movement.quantity_delta}
										</span>
									</div>
									<Icon icon='HeroArrowRight' className='h-5 w-5 text-zinc-400' />
									<div className='text-center'>
										<span className='block text-xs text-zinc-500'>Después</span>
										<span className='text-xl font-bold text-blue-600 dark:text-blue-400'>
											{movement.balance_after}
										</span>
									</div>
								</div>
							</div>

							{/* Ubicación */}
							<div className='rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-800'>
								<h4 className='mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
									<Icon
										icon='HeroBuildingStorefront'
										className='h-4 w-4 text-emerald-500'
									/>
									Ubicación
								</h4>
								<div className='space-y-1.5'>
									<div className='flex items-center justify-between'>
										<span className='text-xs text-zinc-500'>Sucursal</span>
										<span className='text-sm font-medium text-zinc-800 dark:text-zinc-200'>
											{movement.branch?.name ?? 'N/A'}
										</span>
									</div>
									<div className='flex items-center justify-between'>
										<span className='text-xs text-zinc-500'>Bodega</span>
										<span className='text-sm font-medium text-zinc-800 dark:text-zinc-200'>
											{movement.warehouse?.name ?? 'Sin bodega'}
										</span>
									</div>
								</div>
							</div>

							{/* Usuario */}
							<div className='rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-800'>
								<h4 className='mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
									<Icon icon='HeroUser' className='h-4 w-4 text-blue-500' />
									Realizado por
								</h4>
								<div className='space-y-1.5'>
									<span className='block text-sm font-medium text-zinc-800 dark:text-zinc-200'>
										{movement.performed_by?.name ?? 'Usuario desconocido'}
									</span>
									{movement.performed_by?.email && (
										<span className='block text-xs text-zinc-500'>
											{movement.performed_by.email}
										</span>
									)}
								</div>
							</div>

							{/* Razón */}
							<div className='rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-800'>
								<h4 className='mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
									<Icon
										icon='HeroDocumentText'
										className='h-4 w-4 text-amber-500'
									/>
									Razón
								</h4>
								<p className='text-sm text-zinc-700 dark:text-zinc-300'>
									{movement.reason || 'Sin razón especificada'}
								</p>
							</div>

							{/* Origen */}
							{movement.source && (
								<div className='rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-800'>
									<h4 className='mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
										<Icon icon='HeroLink' className='h-4 w-4 text-violet-500' />
										Origen
									</h4>
									<div className='flex flex-wrap gap-2'>
										<Badge
											color='violet'
											variant='outline'
											className='px-2 text-xs'>
											{movement.source.type}
										</Badge>
										{movement.source.id && (
											<Badge
												color='zinc'
												variant='outline'
												className='px-2 text-xs'>
												ID: {movement.source.id}
											</Badge>
										)}
										{movement.source.line_id && (
											<Badge
												color='zinc'
												variant='outline'
												className='px-2 text-xs'>
												Línea: {movement.source.line_id}
											</Badge>
										)}
									</div>
								</div>
							)}

							{/* Fechas */}
							<div className='rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-800'>
								<h4 className='mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
									<Icon icon='HeroCalendar' className='h-4 w-4 text-blue-500' />
									Fechas
								</h4>
								<div className='space-y-1.5'>
									<div className='flex items-center justify-between'>
										<span className='text-xs text-zinc-500'>Ocurrió</span>
										<span className='text-xs font-medium text-zinc-800 dark:text-zinc-200'>
											{formatDate(movement.occurred_at)}
										</span>
									</div>
									<div className='flex items-center justify-between'>
										<span className='text-xs text-zinc-500'>Registrado</span>
										<span className='text-xs font-medium text-zinc-800 dark:text-zinc-200'>
											{formatDate(movement.created_at)}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Metadata */}
						{movement.metadata && Object.keys(movement.metadata).length > 0 && (
							<div className='mt-4 rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-800'>
								<h4 className='mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300'>
									<Icon
										icon='HeroCodeBracket'
										className='h-4 w-4 text-zinc-500'
									/>
									Metadatos
								</h4>
								<div className='flex flex-wrap gap-2'>
									{Object.entries(movement.metadata).map(([key, value]) => (
										<Badge
											key={key}
											color='zinc'
											variant='outline'
											className='px-2 text-xs'>
											{key}: {String(value)}
										</Badge>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default TimelineItem;
