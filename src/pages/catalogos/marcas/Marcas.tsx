import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import { useMarcas } from './components/hooks/useMarcas';
import BrandStats from './components/BrandStats';
import BrandsGrid from './components/tables/BrandsGrid';
import CrearMarca from './components/modals/CrearMarca';
import EditarMarca from './components/modals/EditarMarca';
import DetalleMarca from './components/modals/DetalleMarca';
import EliminarMarca from './components/modals/EliminarMarca';
import type { IBrand, IBrandFilters } from '@/interface/brand.interface';

const Marcas: React.FC = () => {
	const [filters, setFilters] = useState<IBrandFilters>({ search: '' });
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [viewOpen, setViewOpen] = useState(false);
	const [selected, setSelected] = useState<IBrand | null>(null);

	const {
		brands,
		stats,
		loading,
		error,
		branches,
		activeBranchId,
		creating,
		updating,
		deleting,
		createBrand,
		updateBrand,
		deleteBrand,
	} = useMarcas(filters);

	const branchOptions = useMemo(
		() =>
			branches.map((branch) => ({
				value: String(branch.id),
				label: branch.name ?? `Sucursal ${branch.id}`,
			})),
		[branches],
	);

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
			await createBrand({
				name: String(formData.get('name') ?? '').trim(),
				code: formData.get('code')?.toString().trim() || undefined,
				origin_country: formData.get('origin_country')?.toString().trim() || undefined,
				manufacturer: formData.get('manufacturer')?.toString().trim() || undefined,
				is_active: formData.get('is_active') === '1',
				branch_id: filters.branch_id ?? activeBranchId ?? undefined,
				image: (() => {
					const file = formData.get('image');
					return file instanceof File && file.size > 0 ? file : null;
				})(),
			});

			toast.success('Marca creada correctamente');
			setCreateOpen(false);
		} catch (err: any) {
			toast.error(err?.message ?? 'No se pudo crear la marca');
		}
	};

	const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!selected) return;

		const formData = new FormData(event.currentTarget);

		try {
			await updateBrand({
				id: selected.id,
				branch_id: selected.branch_id ?? activeBranchId ?? undefined,
				name: String(formData.get('name') ?? '').trim(),
				code: formData.get('code')?.toString().trim() || undefined,
				origin_country: formData.get('origin_country')?.toString().trim() || undefined,
				manufacturer: formData.get('manufacturer')?.toString().trim() || undefined,
				is_active: formData.get('is_active') === '1',
				image: (() => {
					const file = formData.get('image');
					return file instanceof File && file.size > 0 ? file : null;
				})(),
			});

			toast.success('Marca actualizada');
			setEditOpen(false);
			setSelected(null);
		} catch (err: any) {
			toast.error(err?.message ?? 'No se pudo actualizar la marca');
		}
	};

	const handleConfirmDelete = async () => {
		if (!selected) return;

		try {
			await deleteBrand(selected.id, selected.branch_id);
			toast.success('Marca eliminada');
			setDeleteOpen(false);
			setSelected(null);
		} catch (err: any) {
			toast.error(err?.message ?? 'No se pudo eliminar la marca');
		}
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
								Gestiona el catalogo de marcas asociadas a tus sucursales
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex flex-col items-stretch gap-2 sm:flex-row sm:items-center'>
						<Input
							name='search'
							placeholder='Buscar por nombre, codigo o fabricante'
							value={filters.search}
							onChange={handleSearchChange}
							className='w-full sm:w-72'
						/>
						<Select
							name='branch_id'
							value={filters.branch_id ? String(filters.branch_id) : ''}
							onChange={handleBranchChange}
							className='w-full sm:w-60'>
							<option value=''>Todas las sucursales</option>
							{branchOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
						<Button color='violet' onClick={() => setCreateOpen(true)} icon='HeroPlus'>
							Nueva marca
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
				<BrandStats stats={stats} />
				<BrandsGrid
					brands={brands}
					loading={loading}
					onView={(brand) => {
						setSelected(brand);
						setViewOpen(true);
					}}
					onEdit={(brand) => {
						setSelected(brand);
						setEditOpen(true);
					}}
					onDelete={(brand) => {
						setSelected(brand);
						setDeleteOpen(true);
					}}
				/>
			</Container>

			<CrearMarca
				isOpen={createOpen}
				setIsOpen={setCreateOpen}
				onSubmit={handleCreateSubmit}
				isLoading={creating}
			/>
			<EditarMarca
				isOpen={editOpen}
				setIsOpen={setEditOpen}
				brand={selected}
				onSubmit={handleEditSubmit}
				isLoading={updating}
			/>
			<EliminarMarca
				isOpen={deleteOpen}
				setIsOpen={setDeleteOpen}
				brand={selected}
				onConfirm={handleConfirmDelete}
				isLoading={deleting}
			/>
			<DetalleMarca
				isOpen={viewOpen}
				setIsOpen={setViewOpen}
				brand={selected}
				onEdit={(brand) => {
					setSelected(brand);
					setEditOpen(true);
				}}
			/>
		</PageWrapper>
	);
};

export default Marcas;
