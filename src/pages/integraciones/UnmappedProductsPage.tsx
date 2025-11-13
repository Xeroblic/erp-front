import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import {
	fetchUnmappedProducts,
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
import Select from '@/components/form/Select';
import Input from '@/components/form/Input';
import Label from '@/components/form/Label';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import { toast } from 'react-toastify';
import type { UnmappedWooCommerceProduct } from '@/types/integrations.types';

const UnmappedProductsPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const subsidiaryId = useAppSelector(
		(state) =>
			state.auth.user?.subsidiary?.id || state.auth.user?.personalizacion?.subsidiary_id,
	);
	const { integrations } = useAppSelector((state) => state.integrations);
	const { unmappedProducts, loading } = useAppSelector((state) => state.unmappedProducts);

	const [selectedIntegrationId, setSelectedIntegrationId] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [showMapModal, setShowMapModal] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<UnmappedWooCommerceProduct | null>(null);
	const [mappingSku, setMappingSku] = useState('');

	// Cargar integraciones al montar
	useEffect(() => {
		if (subsidiaryId) {
			dispatch(fetchIntegrations({ subsidiaryId }));
		}
	}, [dispatch, subsidiaryId]);

	// Cargar productos sin mapear cuando se selecciona una integración
	useEffect(() => {
		if (subsidiaryId && selectedIntegrationId) {
			dispatch(fetchUnmappedProducts({ subsidiaryId, integrationId: selectedIntegrationId }));
		}
	}, [dispatch, subsidiaryId, selectedIntegrationId]);

	const handleMapProduct = async () => {
		if (!subsidiaryId || !selectedIntegrationId || !selectedProduct || !mappingSku.trim()) {
			toast.error('Faltan datos para mapear el producto');
			return;
		}

		const resultAction = await dispatch(
			mapProduct({
				subsidiaryId,
				integrationId: selectedIntegrationId,
				unmappedProductId: selectedProduct.id,
				payload: { erp_sku: mappingSku },
			}),
		);

		if (mapProduct.fulfilled.match(resultAction)) {
			toast.success('Producto mapeado correctamente');
			setShowMapModal(false);
			setSelectedProduct(null);
			setMappingSku('');
			// Refrescar lista
			dispatch(fetchUnmappedProducts({ subsidiaryId, integrationId: selectedIntegrationId }));
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

	const filteredProducts = unmappedProducts.filter(
		(product: UnmappedWooCommerceProduct) =>
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	return (
		<PageWrapper name='Productos Sin Mapear'>
			<Subheader>
				<SubheaderLeft>
					<span className='text-2xl font-semibold'>Productos Sin Mapear</span>
					<Badge color='amber' className='ml-2'>
						{filteredProducts.length}
					</Badge>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant='solid'
						icon='HeroArrowPath'
						onClick={() => {
							if (subsidiaryId && selectedIntegrationId) {
								dispatch(
									fetchUnmappedProducts({
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
							<Select
								name='integration'
								value={selectedIntegrationId || ''}
								onChange={(e) =>
									setSelectedIntegrationId(
										e.target.value ? e.target.value : null,
									)
								}>
								<option value=''>Selecciona una integración</option>
								{integrations
									.filter((i) => i.is_active)
									.map((integration) => (
										<option key={integration.id} value={integration.id}>
											{integration.name} - {integration.base_url}
										</option>
									))}
							</Select>
						</div>

						{selectedIntegrationId && (
							<div className='mb-4'>
								<Label htmlFor='search'>Buscar Producto</Label>
								<Input
									name='search'
									type='text'
									placeholder='Buscar por nombre o SKU...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
							</div>
						)}
					</CardBody>
				</Card>

				{selectedIntegrationId && (
					<Card className='mt-4'>
						<CardHeader>
							<CardHeaderChild>
								<CardTitle>
									Productos de WooCommerce sin mapear ({filteredProducts.length})
								</CardTitle>
							</CardHeaderChild>
						</CardHeader>
						<CardBody>
							{loading ? (
								<div className='flex justify-center py-8'>
									<span>Cargando productos...</span>
								</div>
							) : filteredProducts.length === 0 ? (
								<div className='py-8 text-center text-gray-500'>
									{searchTerm
										? 'No se encontraron productos con ese criterio'
										: 'No hay productos sin mapear'}
								</div>
							) : (
								<div className='overflow-x-auto'>
									<table className='w-full'>
										<thead>
											<tr className='border-b'>
												<th className='px-4 py-2 text-left'>ID WC</th>
												<th className='px-4 py-2 text-left'>Nombre</th>
												<th className='px-4 py-2 text-left'>SKU</th>
												<th className='px-4 py-2 text-left'>Precio</th>
												<th className='px-4 py-2 text-left'>Stock</th>
												<th className='px-4 py-2 text-left'>Estado</th>
												<th className='px-4 py-2 text-center'>Acciones</th>
											</tr>
									</thead>
									<tbody>
										{filteredProducts.map((product: UnmappedWooCommerceProduct) => (
											<tr
												key={product.woocommerce_product_id}
												className='border-b hover:bg-gray-50'>
												<td className='px-4 py-2'>
													{product.woocommerce_product_id}
												</td>
													<td className='px-4 py-2'>{product.name}</td>
													<td className='px-4 py-2'>
														<code className='rounded bg-gray-100 px-2 py-1 text-xs'>
															{product.sku || 'Sin SKU'}
														</code>
													</td>
													<td className='px-4 py-2'>
														${product.price || '0'}
													</td>
													<td className='px-4 py-2'>
														{product.stock_quantity ?? 'N/A'}
													</td>
													<td className='px-4 py-2'>
														<Badge
															color={
																product.status === 'publish'
																	? 'green'
																	: 'gray'
															}>
															{product.status}
														</Badge>
													</td>
													<td className='px-4 py-2'>
														<div className='flex justify-center gap-2'>
															<Button
																size='sm'
																variant='outline'
																icon='HeroLink'
																onClick={() => {
																	setSelectedProduct(product);
																	setMappingSku(
																		product.sku || '',
																	);
																	setShowMapModal(true);
																}}>
																Mapear
															</Button>
															<Button
																size='sm'
																variant='outline'
																color='red'
																icon='HeroXMark'
																onClick={() =>
																	handleIgnoreProduct(product)
																}>
																Ignorar
															</Button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
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
									<strong>ID:</strong> {selectedProduct.woocommerce_product_id}
								</p>
								<p className='text-sm'>
									<strong>Nombre:</strong> {selectedProduct.name}
								</p>
								<p className='text-sm'>
									<strong>SKU WC:</strong> {selectedProduct.sku || 'Sin SKU'}
								</p>
							</div>

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

							<div className='flex justify-end gap-2 border-t pt-4'>
								<Button
									variant='outline'
									onClick={() => {
										setShowMapModal(false);
										setSelectedProduct(null);
										setMappingSku('');
									}}>
									Cancelar
								</Button>
								<Button
									variant='solid'
									onClick={handleMapProduct}
									disabled={!mappingSku.trim() || loading}>
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
