import React, { useCallback, useRef, useState } from 'react';
import classNames from 'classnames';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import type { IBrand } from '@/interface/brand.interface';
import BrandLogo from './BrandLogo';
import BrandDetailPanel, { type BrandInlineSavePayload } from './BrandDetailPanel';
import RevealOnScroll from './RevealOnScroll';

interface BrandMasterDetailProps {
	brands: IBrand[];
	loading: boolean;
	selected: IBrand | null;
	onSelect: (brand: IBrand) => void;
	onSave: (brand: IBrand, payload: BrandInlineSavePayload) => Promise<void>;
	onDelete: (brand: IBrand) => void;
	saving?: boolean;
}

const BrandMasterDetail: React.FC<BrandMasterDetailProps> = ({
	brands,
	loading,
	selected,
	onSelect,
	onSave,
	onDelete,
	saving,
}) => {
	const listRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	// Ancho ajustable de la columna lista (px) en desktop.
	const [listWidth, setListWidth] = useState(340);

	const startDrag = useCallback((event: React.MouseEvent) => {
		event.preventDefault();
		const move = (ev: MouseEvent) => {
			const rect = containerRef.current?.getBoundingClientRect();
			if (!rect) return;
			setListWidth(Math.max(260, Math.min(640, ev.clientX - rect.left)));
		};
		const stop = () => {
			document.removeEventListener('mousemove', move);
			document.removeEventListener('mouseup', stop);
			document.body.style.userSelect = '';
		};
		document.addEventListener('mousemove', move);
		document.addEventListener('mouseup', stop);
		document.body.style.userSelect = 'none';
	}, []);

	if (loading) {
		return (
			<div className='flex flex-col items-center justify-center gap-3 py-16'>
				<Icon icon='HeroArrowPath' className='h-8 w-8 animate-spin text-violet-500' />
				<p className='text-sm text-zinc-500'>Cargando marcas...</p>
			</div>
		);
	}

	if (!brands.length) {
		return (
			<Card>
				<CardBody className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
					<div className='rounded-full bg-zinc-100 p-4 dark:bg-zinc-800'>
						<Icon icon='HeroSparkles' className='h-7 w-7 text-zinc-400' />
					</div>
					<p className='font-medium text-zinc-900 dark:text-white'>
						No se encontraron marcas
					</p>
					<p className='text-sm text-zinc-500'>Crea una marca o cambia de sucursal.</p>
				</CardBody>
			</Card>
		);
	}

	return (
		<Card>
			<CardBody>
				<div
					ref={containerRef}
					className='flex flex-col gap-2 lg:flex-row lg:items-stretch'>
					{/* Lista (maestro) */}
					<div
						ref={listRef}
						style={{ ['--list-w' as string]: `${listWidth}px` }}
						className='max-h-[calc(85vh-220px)] w-full space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] lg:w-[var(--list-w)] lg:shrink-0'>
						{brands.map((brand, index) => {
							const isActive = selected?.id === brand.id;
							return (
								<RevealOnScroll
									key={brand.id}
									rootRef={listRef}
									delay={Math.min(index, 8) * 30}>
									<button
										type='button'
										onClick={() => onSelect(brand)}
										className={classNames(
											'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
											isActive
												? 'border-violet-400 bg-violet-50 dark:border-violet-500/60 dark:bg-violet-900/20'
												: 'border-zinc-200 bg-white hover:border-violet-200 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/60',
										)}>
										<BrandLogo
											brand={brand}
											className='h-12 w-12'
											iconClassName='h-5 w-5'
										/>
										<div className='min-w-0 flex-1'>
											<p className='truncate font-semibold text-zinc-900 dark:text-zinc-100'>
												{brand.name}
											</p>
											<p className='text-xs text-zinc-500'>
												{brand.products_count ?? 0} productos
											</p>
										</div>
										<Badge color={brand.is_active ? 'emerald' : 'zinc'}>
											{brand.is_active ? 'Activa' : 'Inactiva'}
										</Badge>
									</button>
								</RevealOnScroll>
							);
						})}
					</div>

					{/* Divisor arrastrable (solo desktop) */}
					<div
						role='separator'
						aria-orientation='vertical'
						aria-label='Ajustar ancho'
						onMouseDown={startDrag}
						className='group hidden w-1.5 shrink-0 cursor-col-resize items-center justify-center lg:flex'>
						<span className='h-16 w-1 rounded-full bg-zinc-200 transition-colors group-hover:bg-violet-400 dark:bg-zinc-700' />
					</div>

					{/* Detalle (solo desktop; en mobile se abre como modal) */}
					<div className='hidden min-w-0 rounded-xl bg-white p-4 dark:bg-zinc-800 lg:block lg:flex-1 lg:self-start'>
						<BrandDetailPanel
							brand={selected}
							onSave={onSave}
							onDelete={onDelete}
							saving={saving}
						/>
					</div>
				</div>
			</CardBody>
		</Card>
	);
};

export default BrandMasterDetail;
