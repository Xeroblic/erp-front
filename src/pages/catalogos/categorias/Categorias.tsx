import React, { useState } from 'react';
import PageWrapper from '../../../components/layouts/PageWrapper/PageWrapper';
import Subheader, {
	SubheaderLeft,
	SubheaderRight,
} from '../../../components/layouts/Subheader/Subheader';
import Container from '../../../components/layouts/Container/Container';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/icon/Icon';
import { ICategory, ICategoryFilters } from './types';
import { useCategorias } from './hooks/useCategorias';
import CategoriesTable from './components/tables/CategoriesTable';
import CrearCategoria from './components/modals/CrearCategoria';
import EditarCategoria from './components/modals/EditarCategoria';
import EliminarCategoria from './components/modals/EliminarCategoria';
import DetalleCategoria from './components/modals/DetalleCategoria';
import Spinner from '@/components/ui/Spinner';

const Categorias: React.FC = () => {
	const [filters] = useState<ICategoryFilters>({ search: '', is_active: undefined });
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [viewOpen, setViewOpen] = useState(false);
	const [selected, setSelected] = useState<ICategory | null>(null);

	const { categories, loading } = useCategorias(filters);

	const onCreate = () => setCreateOpen(true);
	const onView = (c: ICategory) => {
		setSelected(c);
		setViewOpen(true);
	};
	const onEdit = (c: ICategory) => {
		setSelected(c);
		setEditOpen(true);
	};
	const onDelete = (c: ICategory) => {
		setSelected(c);
		setDeleteOpen(true);
	};

	const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const payload = {
			name: String(fd.get('name') || ''),
			description: String(fd.get('description') || ''),
			parent_id: fd.get('parent_id') ? Number(fd.get('parent_id')) : undefined,
			is_active: fd.get('is_active') === 'on',
		};
		console.log('Create category:', payload);
		setCreateOpen(false);
	};

	const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!selected) return;
		const fd = new FormData(e.currentTarget);
		const payload = {
			id: selected.id,
			name: String(fd.get('name') || ''),
			description: String(fd.get('description') || ''),
			parent_id: fd.get('parent_id') ? Number(fd.get('parent_id')) : undefined,
			is_active: fd.get('is_active') === 'on',
		};
		console.log('Update category:', payload);
		setEditOpen(false);
		setSelected(null);
	};

	const handleConfirmDelete = () => {
		if (!selected) return;
		console.log('Delete category:', selected.id);
		setDeleteOpen(false);
		setSelected(null);
	};

	return (
		<PageWrapper name='categorias-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/20'>
							<Icon
								icon='HeroSquares2X2'
								className='h-6 w-6 text-indigo-600 dark:text-indigo-400'
							/>
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								Categorías
							</h1>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Organiza tus productos por categorías
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button color='blue' onClick={onCreate} icon='HeroPlus'>
						Nueva Categoría
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				{loading ? (
					<Spinner nombre='Categorias' />
				) : (
					<CategoriesTable
						categories={categories}
						onView={onView}
						onEdit={onEdit}
						onDelete={onDelete}
					/>
				)}
			</Container>

			<CrearCategoria
				isOpen={createOpen}
				setIsOpen={setCreateOpen}
				onSubmit={handleCreateSubmit}
				categories={categories}
			/>
			<EditarCategoria
				isOpen={editOpen}
				setIsOpen={setEditOpen}
				category={selected}
				onSubmit={handleEditSubmit}
				categories={categories}
			/>
			<EliminarCategoria
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				category={selected}
				onConfirm={handleConfirmDelete}
			/>
			<DetalleCategoria isOpen={viewOpen} setIsOpen={setViewOpen} category={selected} />
		</PageWrapper>
	);
};

export default Categorias;
