import React, { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import { useMarcas } from './components/hooks/useMarcas';
import BrandsGrid from './components/tables/BrandsGrid';
import BrandMasterDetail from './components/BrandMasterDetail';
import type { BrandInlineSavePayload } from './components/BrandDetailPanel';
import CrearMarca from './components/modals/CrearMarca';
import EditarMarca from './components/modals/EditarMarca';
import DetalleMarca from './components/modals/DetalleMarca';
import EliminarMarca from './components/modals/EliminarMarca';
import ProtectedButton from '@/components/ui/ProtectedButton';
import ImportTermsWizard from '@/components/integrations/importTerms/ImportTermsWizard';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import useDeviceScreen from '@/hooks/useDeviceScreen';
import type { IBrand, IBrandFilters } from '@/interface/brand.interface';

type ViewMode = 'list' | 'grid';

const Marcas: React.FC = () => {
	const [filters, setFilters] = useState<IBrandFilters>({ search: '' });
	const [viewMode, setViewMode] = useState<ViewMode>('list');
	const [createOpen, setCreateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [viewOpen, setViewOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [selected, setSelected] = useState<IBrand | null>(null);
	const [detailId, setDetailId] = useState<number | null>(null);

	const { branchId } = useCurrentBranch();
	const { width } = useDeviceScreen();
	const isDesktop = (width ?? 1024) >= 1024;

	const {
		brands,
		loading,
		error,
		activeBranchId,
		creating,
		updating,
		deleting,
		createBrand,
		updateBrand,
		deleteBrand,
		uploadBrandGallery,
		refresh,
	} = useMarcas(filters);

	// Marca mostrada en el panel de detalle (maestro-detalle): la elegida o la primera.
	const detailBrand = useMemo(
		() => brands.find((b) => b.id === detailId) ?? brands[0] ?? null,
		[brands, detailId],
	);

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setFilters((prev) => ({ ...prev, search: event.target.value }));
	};

	const handleCreateSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		try {
			const branchIdValue = formData.get('branch_id');
			const branchIdForm =
				branchIdValue && branchIdValue !== 'null' ? Number(branchIdValue) : undefined;

			const created = await createBrand({
				name: String(formData.get('name') ?? '').trim(),
				code: formData.get('code')?.toString().trim() || undefined,
				is_active: formData.get('is_active') === '1',
				branch_id: branchIdForm ?? filters.branch_id ?? activeBranchId ?? undefined,
				image: (() => {
					const file = formData.get('image');
					return file instanceof File && file.size > 0 ? file : null;
				})(),
			});
			const galleryFiles = (formData.getAll('gallery') as File[]).filter(
				(f) => f && typeof (f as { size?: number }).size === 'number',
			);
			if (created?.id && (galleryFiles?.length ?? 0) > 0) {
				await uploadBrandGallery(
					created.id,
					galleryFiles,
					created.branch_id ?? branchIdForm ?? activeBranchId ?? undefined,
				);
			}

			toast.success('Marca creada correctamente');
			setCreateOpen(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'No se pudo crear la marca');
		}
	};

	const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!selected) return;

		const formData = new FormData(event.currentTarget);

		try {
			const updated = await updateBrand({
				id: selected.id,
				branch_id: selected.branch_id ?? activeBranchId ?? undefined,
				name: String(formData.get('name') ?? '').trim(),
				code: formData.get('code')?.toString().trim() || undefined,
				is_active: formData.get('is_active') === '1',
				image: (() => {
					const file = formData.get('image');
					return file instanceof File && file.size > 0 ? file : null;
				})(),
			});
			const galleryFilesEdit = (formData.getAll('gallery') as File[]).filter(
				(f) => f && typeof (f as { size?: number }).size === 'number',
			);
			if (updated?.id && (galleryFilesEdit?.length ?? 0) > 0) {
				await uploadBrandGallery(
					updated.id,
					galleryFilesEdit,
					updated.branch_id ?? activeBranchId ?? undefined,
				);
			}

			toast.success('Marca actualizada');
			setEditOpen(false);
			setSelected(null);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la marca');
		}
	};

	const handleConfirmDelete = async () => {
		if (!selected) return;

		try {
			await deleteBrand(selected.id, selected.branch_id);
			toast.success('Marca eliminada');
			setDeleteOpen(false);
			setSelected(null);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la marca');
		}
	};

	const openEdit = (brand: IBrand) => {
		setSelected(brand);
		setEditOpen(true);
	};
	const openDelete = (brand: IBrand) => {
		setSelected(brand);
		setDeleteOpen(true);
	};
	const openView = (brand: IBrand) => {
		setSelected(brand);
		setViewOpen(true);
	};

	const handleInlineSave = async (brand: IBrand, payload: BrandInlineSavePayload) => {
		try {
			const updated = await updateBrand({
				id: brand.id,
				branch_id: brand.branch_id ?? activeBranchId ?? undefined,
				name: payload.name,
				code: payload.code,
				is_active: payload.is_active,
				image: payload.image,
			});
			if (payload.galleryFiles.length > 0) {
				await uploadBrandGallery(
					brand.id,
					payload.galleryFiles,
					updated?.branch_id ?? brand.branch_id ?? activeBranchId ?? undefined,
				);
			}
			toast.success('Marca actualizada');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la marca');
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
								Gestiona el catálogo de marcas asociadas a tus sucursales
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex flex-col items-stretch gap-2 sm:flex-row sm:items-center'>
						<Input
							name='search'
							placeholder='Buscar por nombre o código'
							value={filters.search}
							onChange={handleSearchChange}
							className='w-full sm:w-64'
						/>

						<div className='inline-flex shrink-0 gap-0.5 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700'>
							<Button
								icon='HeroBars3'
								size='sm'
								variant={viewMode === 'list' ? 'solid' : 'ghost'}
								color={viewMode === 'list' ? 'violet' : 'zinc'}
								aria-label='Vista de lista'
								aria-pressed={viewMode === 'list'}
								onClick={() => setViewMode('list')}
							/>
							<Button
								icon='HeroSquares2X2'
								size='sm'
								variant={viewMode === 'grid' ? 'solid' : 'ghost'}
								color={viewMode === 'grid' ? 'violet' : 'zinc'}
								aria-label='Vista de cuadrícula'
								aria-pressed={viewMode === 'grid'}
								onClick={() => setViewMode('grid')}
							/>
						</div>

						<ProtectedButton
							permission='view-integration'
							roles={['super-admin']}
							branchId={branchId}
							scope='access'
							fallbackMode='disabled'
							variant='outline'
							color='violet'
							icon='HeroArrowDownTray'
							onClick={() => setImportOpen(true)}>
							Importar Marcas desde WC
						</ProtectedButton>
						<Button
							variant='solid'
							color='emerald'
							type='button'
							icon='HeroPlus'
							onClick={() => setCreateOpen(true)}>
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

				{viewMode === 'list' ? (
					<BrandMasterDetail
						brands={brands}
						loading={loading}
						selected={detailBrand}
						onSelect={(brand) => {
							setDetailId(brand.id);
							// En mobile no hay panel lateral: abrir el detalle como modal.
							if (!isDesktop) openView(brand);
						}}
						onSave={handleInlineSave}
						onDelete={openDelete}
						saving={updating}
					/>
				) : (
					<BrandsGrid
						brands={brands}
						loading={loading}
						onView={openView}
						onEdit={openEdit}
						onDelete={openDelete}
					/>
				)}
			</Container>

			<CrearMarca
				isOpen={createOpen}
				setIsOpen={setCreateOpen}
				onSubmit={handleCreateSubmit}
				isLoading={creating}
				defaultBranchId={filters.branch_id ?? activeBranchId ?? undefined}
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
				onEdit={openEdit}
			/>
			<ImportTermsWizard
				isOpen={importOpen}
				setIsOpen={setImportOpen}
				onCompleted={refresh}
				defaultTaxonomies={['brands']}
			/>
		</PageWrapper>
	);
};

export default Marcas;
