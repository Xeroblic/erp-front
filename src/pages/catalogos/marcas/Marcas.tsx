import React, { useState } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { IBrand, IBrandFilters, BrandMarketPosition } from './components/types';
import { useMarcas } from './components/hooks/useMarcas';
import BrandStats from './components/BrandStats';
import BrandsGrid from './components/tables/BrandsGrid';
import CrearMarca from './components/modals/CrearMarca';
import EditarMarca from './components/modals/EditarMarca';
import DetalleMarca from './components/modals/DetalleMarca';
import EliminarMarca from './components/modals/EliminarMarca';

const Marcas: React.FC = () => {
	const [filters] = useState<IBrandFilters>({ search: '' });
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [viewOpen, setViewOpen] = useState(false);
	const [selected, setSelected] = useState<IBrand | null>(null);

	const { brands, stats, loading } = useMarcas(filters);

	const onCreate = () => setCreateOpen(true);
	const onView = (brand: IBrand) => {
		setSelected(brand);
		setViewOpen(true);
	};
	const onEdit = (brand: IBrand) => {
		setSelected(brand);
		setEditOpen(true);
	};
	const onDelete = (brand: IBrand) => {
		setSelected(brand);
		setDeleteOpen(true);
	};

	const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		const payload = {
			code: String(data.get('code') || ''),
			name: String(data.get('name') || ''),
			description: String(data.get('description') || ''),
			origin_country: String(data.get('origin_country') || ''),
			manufacturer: String(data.get('manufacturer') || ''),
			market_position: (data.get('market_position') as BrandMarketPosition) || 'MEDIO',
			quality_rating: Number(data.get('quality_rating') || 0),
			margin_percentage: Number(data.get('margin_percentage') || 0),
			is_active: data.get('is_active') === 'on',
			is_exclusive: data.get('is_exclusive') === 'on',
		};

		console.log('Create brand:', payload);
		setCreateOpen(false);
	};

	const handleEditSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!selected) return;

		const data = new FormData(event.currentTarget);
		const payload = {
			id: selected.id,
			code: String(data.get('code') || ''),
			name: String(data.get('name') || ''),
			description: String(data.get('description') || ''),
			origin_country: String(data.get('origin_country') || ''),
			manufacturer: String(data.get('manufacturer') || ''),
			market_position:
				(data.get('market_position') as BrandMarketPosition) || selected.market_position,
			quality_rating: Number(data.get('quality_rating') || 0),
			margin_percentage: Number(data.get('margin_percentage') || 0),
			is_active: data.get('is_active') === 'on',
			is_exclusive: data.get('is_exclusive') === 'on',
		};

		console.log('Update brand:', payload);
		setEditOpen(false);
		setSelected(null);
	};

	const handleConfirmDelete = () => {
		if (!selected) return;

		console.log('Delete brand:', selected.id);
		setDeleteOpen(false);
		setSelected(null);
	};

	return (
		<PageWrapper name='marcas-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/20'>
							<Icon
								icon='HeroTag'
								className='h-6 w-6 text-violet-600 dark:text-violet-400'
							/>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								Marcas
							</h1>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Gestión de marcas y análisis de rendimiento
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button color='violet' onClick={onCreate} icon='HeroPlus'>
						Nueva Marca
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<BrandStats stats={stats} />
				<BrandsGrid
					brands={brands}
					loading={loading}
					onView={onView}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
			</Container>

			<CrearMarca
				isOpen={createOpen}
				setIsOpen={setCreateOpen}
				onSubmit={handleCreateSubmit}
			/>
			<EditarMarca
				isOpen={editOpen}
				setIsOpen={setEditOpen}
				brand={selected}
				onSubmit={handleEditSubmit}
			/>
			<EliminarMarca
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				brand={selected}
				onConfirm={handleConfirmDelete}
			/>
			<DetalleMarca
				isOpen={viewOpen}
				setIsOpen={setViewOpen}
				brand={selected}
				onEdit={onEdit}
			/>
		</PageWrapper>
	);
};

export default Marcas;
