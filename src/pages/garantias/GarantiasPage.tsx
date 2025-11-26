import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import type { MultiValue, SingleValue } from 'react-select';
import Alert from '@/components/ui/Alert';
import { useAppDispatch } from '@/store';
import { useWarranties, warrantyStatusOptions } from './hooks/useWarranties';
import WarrantiesTable from './components/WarrantiesTable';
import WarrantyFormModal from './components/WarrantyFormModal';
import WarrantySeriesMode from './components/WarrantySeriesMode';
import DeleteWarrantyModal from './components/DeleteWarrantyModal';
import type { Warranty, WarrantyStatus } from '@/interface/warranties.interface';
import type { WarrantyFormMode } from './types';
import { toast } from '@/utils/toast.utils';
import { deleteWarranty } from '@/store/slices/garantias/thunks';

const ensureFilterOption = (options: TSelectOption[], value?: number | null) => {
	if (!value) return null;
	return (
		options.find((option) => Number(option.value) === Number(value)) ?? {
			value: String(value),
			label: `ID ${value}`,
		}
	);
};

const GarantiasPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const {
		subsidiaryId,
		warranties,
		loading,
		meta,
		filters,
		page,
		perPage,
		setFilter,
		clearFilters,
		productOptions,
		customerOptions,
		saleOptions,
		handlePageChange,
		handlePerPageChange,
		reload,
		searchSales,
		loadProducts,
	} = useWarranties();

	const [formMode, setFormMode] = useState<WarrantyFormMode>('create');
	const [formOpen, setFormOpen] = useState(false);
	const [seriesOpen, setSeriesOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);

	const statusValue = useMemo(() => {
		if (!filters.status) return null;
		return warrantyStatusOptions.find((opt) => opt.value === filters.status) ?? null;
	}, [filters.status]);

	const productFilterValue = useMemo(
		() => ensureFilterOption(productOptions, filters.product_id ?? null),
		[productOptions, filters.product_id],
	);
	const customerFilterValue = useMemo(
		() => ensureFilterOption(customerOptions, filters.customer_id ?? null),
		[customerOptions, filters.customer_id],
	);
	const saleFilterValue = useMemo(
		() => ensureFilterOption(saleOptions, filters.sale_id ?? null),
		[saleOptions, filters.sale_id],
	);

	const handleStatusFilterChange = (
		option: SingleValue<TSelectOption> | MultiValue<TSelectOption>,
	) => {
		if (!option || Array.isArray(option)) {
			setFilter('status', '');
			return;
		}
		const singleOption = option as TSelectOption;
		const status = singleOption.value as WarrantyStatus;
		setFilter('status', status || '');
	};

	const handleCreate = () => {
		setSelectedWarranty(null);
		setFormMode('create');
		setFormOpen(true);
	};

	const handleEdit = (warranty: Warranty) => {
		setSelectedWarranty(warranty);
		setFormMode('edit');
		setFormOpen(true);
	};

	const handleDelete = (warranty: Warranty) => {
		setSelectedWarranty(warranty);
		setDeleteOpen(true);
	};

	const confirmDelete = async () => {
		if (!subsidiaryId || !selectedWarranty) return;
		setDeleteLoading(true);
		try {
			await dispatch(
				deleteWarranty({ subsidiaryId, warrantyId: selectedWarranty.id }),
			).unwrap();
			toast.success('Garantía eliminada correctamente');
			setDeleteOpen(false);
			setSelectedWarranty(null);
			reload();
		} catch (error: unknown) {
			const message =
				(error as { response?: { data?: { message?: string } } })?.response?.data
					?.message || 'No se pudo eliminar la garantía';
			toast.error(message);
		} finally {
			setDeleteLoading(false);
		}
	};

	return (
		<PageWrapper name='garantias-page'>
			<Subheader>
				<SubheaderLeft>
					<div>
						<h1 className='text-2xl font-semibold text-zinc-900'>Garantías</h1>
						<p className='text-sm text-zinc-500'>
							Controla las garantías activas, vencidas y anuladas de tu operación.
						</p>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex flex-wrap gap-2'>
						<Button
							variant='outline'
							icon='HeroQrCode'
							onClick={() => setSeriesOpen(true)}
							isDisable={!subsidiaryId}>
							Crear por serie
						</Button>
						<Button
							color='emerald'
							icon='HeroPlus'
							onClick={handleCreate}
							isDisable={!subsidiaryId}>
							Crear garantía
						</Button>
					</div>
				</SubheaderRight>
			</Subheader>

			<Container>
				{!subsidiaryId && (
					<Alert color='blue' variant='outline' className='mb-4'>
						Selecciona una empresa o sucursal para gestionar sus garantías.
					</Alert>
				)}

				<Card className='mb-6'>
					<CardBody className='space-y-4'>
						<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
							<div>
								<Label htmlFor='search'>Buscar (serie o notas)</Label>
								<Input
									id='search'
									name='search'
									placeholder='Buscar por serie o nota'
									value={filters.q ?? ''}
									onChange={(event) => setFilter('q', event.target.value)}
								/>
							</div>
							<div>
								<Label htmlFor='status-filter'>Estado</Label>
								<SelectReact
									name='status-filter'
									id='status-filter'
									isClearable
									placeholder='Todos'
									value={statusValue}
									options={warrantyStatusOptions}
									onChange={handleStatusFilterChange}
								/>
							</div>
							<div>
								<Label htmlFor='product-filter'>Producto</Label>
								<SelectReact
									name='product-filter'
									id='product-filter'
									isClearable
									placeholder='Todos los productos'
									value={productFilterValue}
									options={productOptions}
									onFocus={() => {
										void loadProducts();
									}}
									onChange={(option) =>
										setFilter(
											'product_id',
											option ? Number((option as TSelectOption).value) : null,
										)
									}
								/>
							</div>
							<div>
								<Label htmlFor='customer-filter'>Cliente</Label>
								<SelectReact
									name='customer-filter'
									id='customer-filter'
									isClearable
									placeholder='Todos los clientes'
									value={customerFilterValue}
									options={customerOptions}
									onChange={(option) =>
										setFilter(
											'customer_id',
											option ? Number((option as TSelectOption).value) : null,
										)
									}
								/>
							</div>
							<div>
								<Label htmlFor='sale-filter'>Venta</Label>
								<SelectReact
									name='sale-filter'
									id='sale-filter'
									isClearable
									placeholder='Todas las ventas'
									value={saleFilterValue}
									options={saleOptions}
									onFocus={() => {
										if (!saleOptions.length) {
											void searchSales();
										}
									}}
									onChange={(option) =>
										setFilter(
											'sale_id',
											option ? Number((option as TSelectOption).value) : null,
										)
									}
									onInputChange={(term, meta) => {
										if (meta?.action === 'input-change') {
											void searchSales(term || '');
										}
									}}
								/>
							</div>
						</div>
						<div className='flex justify-end'>
							<Button variant='outline' onClick={clearFilters}>
								Limpiar filtros
							</Button>
						</div>
					</CardBody>
				</Card>

				<WarrantiesTable
					warranties={warranties}
					loading={loading}
					meta={meta}
					page={page}
					perPage={perPage}
					onPageChange={handlePageChange}
					onPageSizeChange={handlePerPageChange}
					onView={(warranty) => navigate(`/garantias/${warranty.id}`)}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
			</Container>

				{formOpen && (
					<WarrantyFormModal
						isOpen={formOpen}
						onClose={() => setFormOpen(false)}
						onSuccess={reload}
						subsidiaryId={subsidiaryId}
						mode={formMode}
						warranty={formMode === 'edit' ? selectedWarranty : null}
						productOptions={productOptions}
						customerOptions={customerOptions}
						saleOptions={saleOptions}
						onSearchSales={searchSales}
						onLoadProducts={loadProducts}
					/>
				)}

			{seriesOpen && (
				<WarrantySeriesMode
					isOpen={seriesOpen}
					onClose={() => setSeriesOpen(false)}
					onSuccess={reload}
					subsidiaryId={subsidiaryId}
				/>
			)}

			{deleteOpen && (
				<DeleteWarrantyModal
					isOpen={deleteOpen}
					onClose={() => setDeleteOpen(false)}
					onConfirm={confirmDelete}
					loading={deleteLoading}
					warranty={selectedWarranty}
				/>
			)}
		</PageWrapper>
	);
};

export default GarantiasPage;
