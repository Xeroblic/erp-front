import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Spinner from '@/components/ui/Spinner';
import CategoryStats from './components/CategoryStats';
import CategoriesTable from './components/tables/CategoriesTable';
import CrearCategoria from './components/modals/CrearCategoria';
import EditarCategoria from './components/modals/EditarCategoria';
import EliminarCategoria from './components/modals/EliminarCategoria';
import DetalleCategoria from './components/modals/DetalleCategoria';
import { useCategorias } from './hooks/useCategorias';
import type { ICategory, ICategoryFilters } from './types';
import { buildCategoryTableRows } from '@/components/helper/category.helper';

const Categorias: React.FC = () => {
	const [filters, setFilters] = useState<ICategoryFilters>({ search: '' });
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [viewOpen, setViewOpen] = useState(false);
	const [selected, setSelected] = useState<ICategory | null>(null);

	const {
		categories,
		stats,
		loading,
		error,
		parentOptions,
		branches,
		activeBranchId,
		creating,
		updating,
		deleting,
		createCategory,
		updateCategory,
		toggleCategoryStatus,
		deleteCategory,
		uploadCategoryGallery,
		tree,
	} = useCategorias(filters);

	const parentOptionsForSelect = useMemo(() => parentOptions, [parentOptions]);
	const branchOptions = useMemo(
		() =>
			(branches ?? []).map((b) => ({
				value: String(b.id),
				label: b.name ?? `Sucursal ${b.id}`,
			})),
		[branches],
	);
	const tableRows = useMemo(() => buildCategoryTableRows(categories, tree), [categories, tree]);

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setFilters((prev) => ({ ...prev, search: event.target.value }));
	};

	const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const value = event.target.value;
		setFilters((prev) => ({ ...prev, branch_id: value ? Number(value) : undefined }));
	};

	const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

    try {
      const image = (formData.get('image') as File | null) || null;
      const galleryFiles = (formData.getAll('gallery') as File[]).filter((f) => f && typeof (f as any).size === 'number');
      const created = await createCategory({
        name: String(formData.get('name') ?? '').trim(),
        description: formData.get('description')?.toString().trim() || undefined,
        parent_id: (() => {
          const parent = formData.get('parent_id');
          if (!parent) return undefined;
          const value = Number(parent);
          return Number.isFinite(value) ? value : undefined;
        })(),
        // Sin toggle en el modal: crear siempre activa
        is_active: true,
        image,
      });

      if (created?.id && galleryFiles.length) {
        await uploadCategoryGallery(created.id, galleryFiles);
      }

      toast.success('Categoria creada correctamente');
      setCreateOpen(false);
    } catch (err: any) {
			toast.error(err?.message ?? 'No se pudo crear la categoria');
		}
	};

	const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!selected) return;

		const formData = new FormData(event.currentTarget);

    try {
      const image = (formData.get('image') as File | null) || null;
      const galleryFiles = (formData.getAll('gallery') as File[]).filter((f) => f && typeof (f as any).size === 'number');
      const updated = await updateCategory({
        id: selected.id,
        name: String(formData.get('name') ?? '').trim(),
        description: formData.get('description')?.toString().trim() || undefined,
        parent_id: (() => {
          const parent = formData.get('parent_id');
          if (!parent) return undefined;
          const value = Number(parent);
          return Number.isFinite(value) ? value : undefined;
        })(),
        // Sin toggle en el modal: conservar estado actual
        is_active: selected.is_active,
        image,
      });

      if (updated?.id && galleryFiles.length) {
        await uploadCategoryGallery(updated.id, galleryFiles);
      }

      toast.success('Categoria actualizada');
      setEditOpen(false);
      setSelected(null);
    } catch (err: any) {
			toast.error(err?.message ?? 'No se pudo actualizar la categoria');
		}
	};

	const handleConfirmDelete = async () => {
		if (!selected) return;

		try {
			await deleteCategory(selected.id);
			toast.success('Categoria eliminada');
			setDeleteOpen(false);
			setSelected(null);
		} catch (err: any) {
			toast.error(err?.message ?? 'No se pudo eliminar la categoria');
		}
	};

	const handleToggleStatus = async (category: ICategory) => {
		try {
			await toggleCategoryStatus(category);
			toast.info(`Categoria ${category.is_active ? 'desactivada' : 'activada'}`);
		} catch (err: any) {
			toast.error(err?.message ?? 'No se pudo cambiar el estado');
		}
	};

	const handleOpenCreate = () => setCreateOpen(true);
	const handleView = (category: ICategory) => {
		setSelected(category);
		setViewOpen(true);
	};
	const handleEdit = (category: ICategory) => {
		setSelected(category);
		setEditOpen(true);
	};
	const handleDelete = (category: ICategory) => {
		setSelected(category);
		setDeleteOpen(true);
	};

	return (
		<PageWrapper name='categorias-admin'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/20'>
							<Icon icon='HeroSquares2X2' className='h-6 w-6 text-indigo-600' />
						</div>
						<div>
							<h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
								Categorias
							</h1>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Organiza tus productos por categorias
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex flex-col items-stretch gap-2 sm:flex-row sm:items-center'>
						<Input
							name='search'
							placeholder='Buscar por nombre o descripcion'
							value={filters.search}
							onChange={handleSearchChange}
							className='w-full sm:w-72'
						/>
						<Select
							name='branch_id'
							value={
								filters.branch_id
									? String(filters.branch_id)
									: activeBranchId
										? String(activeBranchId)
										: ''
							}
							onChange={handleBranchChange}
							className='w-full sm:w-60'>
							<option value=''>Todas las sucursales</option>
							{branchOptions.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</Select>
						<Button color='indigo' onClick={handleOpenCreate} icon='HeroPlus'>
							Nueva categoria
						</Button>
					</div>
				</SubheaderRight>
			</Subheader>

			<Container>
				{error && (
					<div className='mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
						{error}
					</div>
				)}

				<CategoryStats stats={stats} />

				{loading ? (
					<div className='py-10'>
						<Spinner nombre='Categorias' />
					</div>
				) : (
					<CategoriesTable
						rows={tableRows}
						onView={handleView}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onToggleStatus={handleToggleStatus}
					/>
				)}
			</Container>

			<CrearCategoria
				isOpen={createOpen}
				setIsOpen={setCreateOpen}
				onSubmit={handleCreateSubmit}
				parentOptions={parentOptionsForSelect}
				isLoading={creating}
			/>
			<EditarCategoria
				isOpen={editOpen}
				setIsOpen={setEditOpen}
				category={selected}
				onSubmit={handleEditSubmit}
				parentOptions={parentOptionsForSelect}
				isLoading={updating}
			/>
			<EliminarCategoria
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				category={selected}
				onConfirm={handleConfirmDelete}
				isLoading={deleting}
			/>
			<DetalleCategoria
				isOpen={viewOpen}
				setIsOpen={setViewOpen}
				category={selected}
				onEdit={handleEdit}
			/>
		</PageWrapper>
	);
};

export default Categorias;
