import React, { useEffect, useMemo, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import {
	fetchUnmappedProducts,
	fetchMappedProducts,
	mapProduct,
	ignoreProduct,
} from '@/store/slices/integrations/unmappedProductsSlice';
import { fetchIntegrations } from '@/store/slices/integrations/integrationsSlice';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import SelectReact, { type TSelectOption } from '@/components/form/SelectReact';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { toast } from 'react-toastify';
import type { UnmappedWooCommerceProduct } from '@/types/integrations.types';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import DataTable from '@/components/ui/DataTable/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import type { SingleValue } from 'react-select';

const UnmappedProductsPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);
	const { integrations } = useAppSelector((state) => state.integrations);
	const { unmappedProducts, mappedProducts, loading } = useAppSelector(
		(state) => state.unmappedProducts,
	);

	const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
	const [showMapModal, setShowMapModal] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<UnmappedWooCommerceProduct | null>(null);
	const [mappingSku, setMappingSku] = useState('');
	const [mappingProductId, setMappingProductId] = useState('');
	const [activeTab, setActiveTab] = useState<'pending' | 'mapped'>('pending');

	const integrationOptions = useMemo<TSelectOption[]>(
		() =>
			integrations
				.filter((integration) => integration.is_active)
				.map((integration) => ({
					value: integration.id,
					label: `${integration.name} - ${integration.base_url}`,
				})),
		[integrations],
	);

	const selectedIntegrationOption = useMemo(
		() => integrationOptions.find((option) => option.value === selectedIntegrationId) ?? null,
		[integrationOptions, selectedIntegrationId],
	);

	// Cargar integraciones al montar
	useEffect(() => {
		if (subsidiaryId) {
			dispatch(fetchIntegrations({ subsidiaryId }));
		}
	}, [dispatch, subsidiaryId]);

// Cargar productos según pestaña activa
	useEffect(() => {
		if (!subsidiaryId || !selectedIntegrationId) return;
		if (activeTab === 'pending') {
			dispatch(fetchUnmappedProducts({ subsidiaryId, integrationId: selectedIntegrationId }));
		} else {
			dispatch(fetchMappedProducts({ subsidiaryId, integrationId: selectedIntegrationId }));
		}
	}, [dispatch, subsidiaryId, selectedIntegrationId, activeTab]);

const handleMapProduct = async () => {
	if (
		!subsidiaryId ||
		!selectedIntegrationId ||
		!selectedProduct ||
		!mappingSku.trim() ||
		!mappingProductId.trim()
	) {
		toast.error('Faltan datos para mapear el producto');
		return;
	}

	const parsedProductId = Number(mappingProductId);
	if (!Number.isFinite(parsedProductId)) {
		toast.error('Ingresa un ID de producto válido');
		return;
	}

	const resultAction = await dispatch(
		mapProduct({
			subsidiaryId,
			integrationId: selectedIntegrationId,
			unmappedProductId: selectedProduct.id,
			payload: { erp_sku: mappingSku, product_id: parsedProductId },
		}),
	);

	if (mapProduct.fulfilled.match(resultAction)) {
		toast.success('Producto mapeado correctamente');
		setShowMapModal(false);
		setSelectedProduct(null);
		setMappingSku('');
		setMappingProductId('');
			// Refrescar lista activa
			if (activeTab === 'pending') {
				dispatch(fetchUnmappedProducts({ subsidiaryId, integrationId: selectedIntegrationId }));
			} else {
				dispatch(fetchMappedProducts({ subsidiaryId, integrationId: selectedIntegrationId }));
			}
		} else {
			toast.error('Error al mapear el producto');
		}
	};

	const handleIgnoreProduct = async (product: UnmappedWooCommerceProduct) => {
		if (!subsidiaryId || !selectedIntegrationId) return;
		if (!confirm('¿Estás seguro de ignorar este producto?')) return;

		const resultAction = await dispatch(
			ignoreProduct({
				subsidiaryId,
				integrationId: selectedIntegrationId,
				unmappedProductId: product.id,
			}),
		);

		if (ignoreProduct.fulfilled.match(resultAction)) {
			toast.success('Producto marcado como ignorado');
			dispatch(fetchUnmappedProducts({ subsidiaryId, integrationId: selectedIntegrationId }));
		} else {
			toast.error('Error al ignorar el producto');
		}
	};

const displayedProducts = activeTab === 'pending' ? unmappedProducts : mappedProducts;

const SALE_STATUS_LABELS: Record<string, string> = {
	draft: 'Borrador',
	confirmed: 'Confirmada',
	partially_paid: 'Pago parcial',
	paid: 'Pagada',
	delivered: 'Entregada',
	cancelled: 'Cancelada',
	refunded: 'Reembolsada',
};

const columns = useMemo<ColumnDef<UnmappedWooCommerceProduct>[]>(
	() => [
		{
			accessorFn: (row) =>
				String(
					row.external_product_id ??
					(row as any).woocommerce_product_id ??
					row.line_item_data?.product_id ??
					'',
				),
			header: 'ID WC',
			cell: ({ row }) => {
				const product = row.original;
				const wcId =
					product.external_product_id ??
					(product as any).woocommerce_product_id ??
					product.line_item_data?.product_id ??
					'-';
				return <span>{wcId}</span>;
			},
		},
		{
			id: 'product',
			accessorFn: (row) => `${row.name ?? ''} ${row.sale?.sale_number ?? ''}`.trim(),
			header: 'Producto',
			cell: ({ row }) => (
				<div>
					<p className='font-medium text-gray-900'>{row.original.name}</p>
					<p className='text-xs text-gray-500'>Venta: {row.original.sale?.sale_number ?? 'N/A'}</p>
				</div>
			),
		},
		{
			id: 'sku',
			accessorFn: (row) => row.sku ?? '',
			header: 'SKU',
			cell: ({ row }) => (
				<code className='rounded bg-gray-100 px-2 py-1 text-xs'>
					{row.original.sku || 'Sin SKU'}
				</code>
			),
		},
		{
			id: 'price',
			accessorFn: (row) => row.price ?? '',
			header: 'Precio',
			cell: ({ row }) => {
				const value = Number(row.original.price ?? 0);
				return new Intl.NumberFormat('es-CL', {
					style: 'currency',
					currency: 'CLP',
				}).format(Number.isFinite(value) ? value : 0);
			},
		},
		{
			id: 'status',
			accessorFn: (row) => row.sale?.status ?? '',
			header: 'Estado venta',
			cell: ({ row }) => {
				const status = row.original.sale?.status ?? 'N/A';
				const label = SALE_STATUS_LABELS[status as keyof typeof SALE_STATUS_LABELS] ?? status;
				const badgeColor = status === 'paid' ? 'green' : status === 'cancelled' ? 'red' : 'gray';
				return <Badge color={badgeColor}>{label}</Badge>;
			},
		},
		{
			id: 'actions',
			header: 'Acciones',
			cell: ({ row }) => {
				if (activeTab === 'mapped') {
					return row.original.mapped_product ? (
						<div className='text-xs text-gray-500'>
							Mapeado con {row.original.mapped_product.name} ({row.original.mapped_product.sku})
						</div>
					) : (
						<span className='text-xs text-gray-400'>Sin referencia</span>
					);
				}

				return (
					<div className='flex flex-wrap gap-2'>
						<Button
							size='sm'
							variant='outline'
							icon='HeroLink'
							onClick={() => {
								setSelectedProduct(row.original);
								setMappingSku(row.original.sku || '');
								setMappingProductId('');
								setShowMapModal(true);
							}}>
							Mapear
						</Button>
						<Button
							size='sm'
							variant='outline'
							color='red'
							onClick={() => handleIgnoreProduct(row.original)}
							icon='HeroXMark'>
							Ignorar
						</Button>
					</div>
				);
			},
		},
	],
	[activeTab],
);

	return (
		<PageWrapper name='Productos Sin Mapear'>
			<Subheader>
		<SubheaderLeft>
			<span className='text-2xl font-semibold'>Productos de WooCommerce</span>
			<Badge color='amber' className='ml-2'>
				{displayedProducts.length}
			</Badge>
				</SubheaderLeft>
				<SubheaderRight>
			<Button
				variant='solid'
				icon='HeroArrowPath'
				onClick={() => {
					if (subsidiaryId && selectedIntegrationId) {
						dispatch(
							activeTab === 'pending'
								? fetchUnmappedProducts({
										subsidiaryId,
										integrationId: selectedIntegrationId,
									})
								: fetchMappedProducts({
										subsidiaryId,
										integrationId: selectedIntegrationId,
									}),
						);
					}
				}}>
				Actualizar
			</Button>
				</SubheaderRight>
			</Subheader>
			<Container>
		<Card>
					<CardHeader>
						<CardHeaderChild>
							<CardTitle>Seleccionar Integración</CardTitle>
						</CardHeaderChild>
					</CardHeader>
					<CardBody>
						<div className='mb-4'>
							<Label htmlFor='integration'>Integración de WooCommerce</Label>
							<SelectReact
								name='integration'
								value={selectedIntegrationOption}
								onChange={(option) => {
									const selected = option as SingleValue<TSelectOption>;
									setSelectedIntegrationId(selected?.value ?? null);
								}}
								options={integrationOptions}
								placeholder='Selecciona una integración'
							/>
						</div>

				{selectedIntegrationId && (
					<div className='flex items-center gap-3'>
						<Button
							variant={activeTab === 'pending' ? 'solid' : 'outline'}
							onClick={() => setActiveTab('pending')}
							disabled={activeTab === 'pending'}>
							Pendientes
						</Button>
						<Button
							variant={activeTab === 'mapped' ? 'solid' : 'outline'}
							onClick={() => setActiveTab('mapped')}
							disabled={activeTab === 'mapped'}>
							Mapeados
						</Button>
					</div>
				)}
					</CardBody>
				</Card>

				{selectedIntegrationId && (
					<Card className='mt-4'>
						<CardHeader>
				<CardHeaderChild>
					<CardTitle>
						{activeTab === 'pending'
							? `Productos de WooCommerce sin mapear (${displayedProducts.length})`
							: `Productos mapeados (${displayedProducts.length})`}
					</CardTitle>
							</CardHeaderChild>
						</CardHeader>
				<CardBody>
					<DataTable
						columns={columns}
						data={displayedProducts}
						loading={loading}
						searchPlaceholder='Buscar por nombre o SKU...'
						emptyMessage='No hay productos para mostrar'
					/>
				</CardBody>
					</Card>
				)}
			</Container>

			{/* Modal para mapear producto */}
			<Modal isOpen={showMapModal} setIsOpen={setShowMapModal} size='lg'>
				<ModalHeader>Mapear Producto de WooCommerce</ModalHeader>
				<ModalBody>
					{selectedProduct && (
						<div className='space-y-4'>
							<div className='rounded-lg bg-blue-50 p-4'>
								<h3 className='mb-2 font-semibold'>Producto de WooCommerce:</h3>
					<p className='text-sm'>
						<strong>ID:</strong>{' '}
						{selectedProduct.external_product_id || selectedProduct.line_item_data?.product_id || 'N/A'}
					</p>
								<p className='text-sm'>
									<strong>Nombre:</strong> {selectedProduct.name}
								</p>
								<p className='text-sm'>
									<strong>SKU WC:</strong> {selectedProduct.sku || 'Sin SKU'}
								</p>
							</div>

					<div className='grid gap-4 md:grid-cols-2'>
						<div>
							<Label htmlFor='erp_sku'>SKU del Producto en el ERP</Label>
							<Input
								name='erp_sku'
								id='erp_sku'
								type='text'
								value={mappingSku}
								onChange={(e) => setMappingSku(e.target.value)}
								placeholder='Ingresa el SKU del producto en el ERP'
								required
							/>
							<p className='mt-1 text-xs text-gray-500'>
								Este SKU debe existir en tu inventario del ERP
							</p>
						</div>
						<div>
							<Label htmlFor='erp_product_id'>ID del producto en el ERP</Label>
							<Input
								name='erp_product_id'
								id='erp_product_id'
								type='number'
								value={mappingProductId}
								onChange={(e) => setMappingProductId(e.target.value)}
								placeholder='Ejemplo: 12345'
								required
							/>
							<p className='mt-1 text-xs text-gray-500'>
								Puedes obtenerlo desde la ficha del producto en el ERP
							</p>
						</div>
					</div>

							<div className='flex justify-end gap-2 border-t pt-4'>
					<Button
						variant='outline'
						onClick={() => {
							setShowMapModal(false);
							setSelectedProduct(null);
							setMappingSku('');
							setMappingProductId('');
						}}>
						Cancelar
								</Button>
					<Button
						variant='solid'
						onClick={handleMapProduct}
						disabled={!mappingSku.trim() || !mappingProductId.trim() || loading}>
						{loading ? 'Mapeando...' : 'Confirmar Mapeo'}
					</Button>
							</div>
						</div>
					)}
				</ModalBody>
			</Modal>
		</PageWrapper>
	);
};

export default UnmappedProductsPage;
