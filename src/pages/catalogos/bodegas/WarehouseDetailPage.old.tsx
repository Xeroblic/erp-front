import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProducts } from '@/store/slices/products/productsSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Checkbox from '@/components/form/Checkbox';
import Input from '@/components/form/Input';
import SelectReact, { TSelectOption } from '@/components/form/SelectReact';
import { useWarehouseManagement } from './hooks/useWarehouseManagement';
import WarehouseCapacityBar from './components/WarehouseCapacityBar';
import type { IWarehouseProduct } from '@/interface/warehouse.interface';
import { toast } from 'react-toastify';

const WarehouseDetailPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const user = useAppSelector((s) => s.auth.user);
	const personalizacionState = useAppSelector((s) => s.personalizacion);
	const branchId =
		personalizacionState?.personalizacionUsuario?.sucursal_principal ||
		user?.branch?.id ||
		(user?.personalizacion?.sucursal_principal ?? 0);

	const { loadWarehouseDetail, handleAttachProducts, handleDetachProduct } =
		useWarehouseManagement(branchId);
	const warehouseDetail = useAppSelector((s) => s.warehouse.warehouseDetail);
	const { items: allProducts, loading: productsLoading } = useAppSelector((s) => s.products);

	const [isEditable, setIsEditable] = useState(false);
	const [productToRemove, setProductToRemove] = useState<IWarehouseProduct | null>(null);

	const [newProductId, setNewProductId] = useState<number | null>(null);
	const [newQuantity, setNewQuantity] = useState<number>(1);
	const [newSyncStock, setNewSyncStock] = useState<boolean>(false);
	const [submittingNew, setSubmittingNew] = useState(false);

	const [updatingSyncIds, setUpdatingSyncIds] = useState<number[]>([]);

	const [qtyModal, setQtyModal] = useState<{
		open: boolean;
		productId: number | null;
		initialQty: number;
	}>({ open: false, productId: null, initialQty: 1 });
	const [qtyInput, setQtyInput] = useState<number>(1);

	// Modal para asociar producto desde lista disponible
	const [attachProduct, setAttachProduct] = useState<any | null>(null);
	const [attachSync, setAttachSync] = useState<boolean>(true);
	const [attachQty, setAttachQty] = useState<number>(1);
	const [attaching, setAttaching] = useState<boolean>(false);

	useEffect(() => {
		if (branchId && id) {
			loadWarehouseDetail(Number(id));
			// cargar primeros productos (paginado reducido para esta vista)
			if (allProducts.length === 0) {
				dispatch(fetchProducts({ branchId, params: { per_page: 5 } } as any));
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [branchId, id]);

	const availableProducts = useMemo(
		() =>
			allProducts.filter(
				(p) =>
					p.branch_id === branchId &&
					!warehouseDetail?.products?.some((wp) => wp.id === p.id),
			),
		[allProducts, warehouseDetail?.products, branchId],
	);

	const productOptions = useMemo(
		() =>
			availableProducts.map((p) => ({
				value: String(p.id),
				label: `${p.sku} - ${p.name}${p.brand?.name ? ` - ${p.brand.name}` : ''}`,
			})),
		[availableProducts],
	);

	const selectedProduct = useMemo(
		() => allProducts.find((p) => p.id === newProductId) ?? null,
		[allProducts, newProductId],
	);

	const searchTimerRef = useRef<number | null>(null);
	const handleProductSearch = (val: string) => {
		if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
		searchTimerRef.current = window.setTimeout(() => {
			dispatch(fetchProducts({ branchId, params: { per_page: 50, search: val } } as any));
		}, 300) as unknown as number;
	};

	const handleAddProduct = async () => {
		if (!newProductId || !warehouseDetail) return;
		if (warehouseDetail.products?.some((wp) => wp.id === newProductId)) {
			toast.warn('Este producto ya está asociado a la bodega.');
			setNewProductId(null);
			return;
		}
		setSubmittingNew(true);
		const payload = {
			product_id: newProductId,
					{productsLoading ? (
						<div className='flex min-h-[200px] items-center justify-center'><Icon icon='HeroArrowPath' className='mx-auto h-10 w-10 animate-spin text-blue-600' /></div>
					) : availableProducts.length === 0 ? (
						<div className='flex min-h-[200px] items-center justify-center'>No hay productos disponibles</div>
					) : (
						<div className='overflow-x-auto'>
							<table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
								<thead className='bg-gray-50 dark:bg-gray-800'>
									<tr>
										<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>SKU</th>
										<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Nombre</th>
										<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Marca</th>
										<th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Stock</th>
										<th className='px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>Acción</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
									{availableProducts.map((p) => (
										<tr key={p.id} className='hover:bg-gray-50 dark:hover:bg-gray-800'>
											<td className='whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-900 dark:text-white'>{p.sku}</td>
											<td className='px-4 py-3 text-sm text-gray-900 dark:text-white'>{p.name}</td>
											<td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>{p.brand?.name ?? 'N/A'}</td>
											<td className='whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white'>{p.stock ?? 0}</td>
											<td className='whitespace-nowrap px-4 py-3 text-center'>
												<div className='flex items-center justify-center gap-2'>
													<Button size='sm' color='blue' variant='outline' onClick={() => { setAttachProduct(p); setAttachSync(true); setAttachQty(1); }} title='Asociar producto'>Asociar</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
									<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
										Tipo
									</p>
									<p className='mt-1 text-base text-gray-900 dark:text-white'>
										{warehouse.warehouse_type}
									</p>
								</div>
								<div>
									<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
										Estado
									</p>
									<div className='mt-1'>
										<Badge
											color={warehouse.is_active ? 'emerald' : 'red'}
											variant='outline'>
											{warehouse.is_active ? 'Activa' : 'Inactiva'}
										</Badge>
									</div>
								</div>
								<div>
									<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
										Sucursal
									</p>
									<p className='mt-1 text-base text-gray-900 dark:text-white'>
										{warehouse.branch_name || 'N/A'}
									</p>
								</div>
								<div>
									<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
										Seguimiento por serie
									</p>
									<div className='mt-1'>
										<Badge
											color={
												warehouse.requires_serial_tracking ? 'blue' : 'gray'
											}
											variant='outline'>
											{warehouse.requires_serial_tracking ? 'Sí' : 'No'}
										</Badge>
									</div>
								</div>
								{warehouse.description && (
									<div className='md:col-span-2 lg:col-span-3'>
										<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
											Descripción
										</p>
										<p className='mt-1 text-base text-gray-700 dark:text-gray-300'>
											{warehouse.description}
										</p>
									</div>
								)}
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Capacidad</CardTitle>
						</CardHeader>
						<CardBody>
							<div className='space-y-4'>
								<WarehouseCapacityBar
									current={warehouse.current_capacity || 0}
									maximum={warehouse.maximum_capacity}
									size='lg'
								/>
								<div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
									<div className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800'>
										<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
											Capacidad actual
										</p>
										<p className='mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400'>
											{warehouse.current_capacity || 0}
										</p>
									</div>
									<div className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800'>
										<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
											Capacidad máxima
										</p>
										<p className='mt-1 text-2xl font-bold text-gray-900 dark:text-white'>
											{warehouse.maximum_capacity || '∞'}
										</p>
									</div>
									<div className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800'>
										<p className='text-sm font-medium text-gray-600 dark:text-gray-400'>
											Disponible
										</p>
										<p className='mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
											{warehouse.available_capacity !== undefined
												? warehouse.available_capacity
												: '∞'}
										</p>
									</div>
								</div>
							</div>
						</CardBody>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Productos ({warehouse.products?.length || 0})</CardTitle>
						</CardHeader>
						<CardBody>
							{!warehouse.products || warehouse.products.length === 0 ? (
								<div className='flex flex-col items-center justify-center py-8'>
									<Icon icon='HeroArchiveBox' className='size-12 text-gray-400' />
									<p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
										No hay productos en esta bodega
									</p>
								</div>
							) : (
								<div className='overflow-x-auto'>
									<table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
										<thead className='bg-gray-50 dark:bg-gray-800'>
											<tr>
												<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>
													SKU
												</th>
												<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>
													Nombre
												</th>
												<th className='px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>
													Marca
												</th>
												<th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>
													Stock
												</th>
												<th className='px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>
													Cantidad
												</th>
												<th className='px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>
													Modo
												</th>
												<th className='px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400'>
													Acciones
												</th>
											</tr>
										</thead>
										<tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
											{warehouse.products.map((product) => (
												<tr key={product.id} className='hover:bg-gray-50 dark:hover:bg-gray-800'>
													<td className='whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-900 dark:text-white'>
														{product.sku}
													</td>
													<td className='px-4 py-3 text-sm text-gray-900 dark:text-white'>
														{product.name}
													</td>
													<td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-400'>
														{product.brand_name ?? allProducts.find((p) => p.id === product.id)?.brand?.name ?? 'N/A'}
													</td>
													<td className='whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white'>
														{allProducts.find((p) => p.id === product.id)?.stock ?? 0}
													</td>
													<td className='whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white'>
														{product.quantity}
													</td>
													<td className='whitespace-nowrap px-4 py-3 text-center'>
														{product.sync_stock ? (
															<Badge color='blue' variant='outline'><Icon icon='HeroArrowPath' className='mr-1' />Auto-Sync</Badge>
														) : (
															<Badge color='gray' variant='outline'><Icon icon='HeroPencil' className='mr-1' />Manual</Badge>
														)}
													</td>
													<td className='whitespace-nowrap px-4 py-3 text-center'>
														<div className='flex items-center justify-center gap-2'>
															{updatingSyncIds.includes(product.id) && (<Icon icon='HeroArrowPath' className='animate-spin text-blue-600' />)}
															<Checkbox id={`sync-${product.id}`} variant='switch' checked={product.sync_stock} onChange={async (e) => {
																const turningOn = e.target.checked;
																if (!turningOn) {
																	setQtyModal({ open: true, productId: product.id, initialQty: product.quantity });
																} else {
																	setUpdatingSyncIds((s) => [...s, product.id]);
																	try {
																		await handleAttachProducts(warehouse.id, { product_id: product.id, quantity: null, sync_stock: true } as any);
																		await loadWarehouseDetail(warehouse.id);
																	} finally {
																		setUpdatingSyncIds((s) => s.filter((id) => id !== product.id));
																	}
																}
															}} />

															<Button size='sm' variant='outline' color='gray' onClick={() => navigate(`/producto/${product.id}`)} title='Ver producto'>
																<Icon icon='HeroEye' />
															</Button>

															<Button size='sm' variant='outline' color='red' icon='HeroTrash' onClick={() => setProductToRemove(product)} title='Quitar producto' />
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</CardBody>
					</Card>

					{isEditable && (
						<Card className='border-2 border-dashed border-blue-300 shadow-md dark:border-blue-700'>
							<CardHeader className='bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500'>
											<Icon icon='HeroPlus' className='h-6 w-6 text-white' />
										</div>
										<div>
											<CardTitle className='text-xl'>
												Productos Disponibles
											</CardTitle>
											<p className='text-sm text-gray-600 dark:text-gray-400'>
												{availableProducts.length} producto(s) disponible(s)
												para agregar
											</p>
										</div>
									</div>
									{availableProducts.length > 0 && (
										<Badge color='blue' className='shadow-md'>
											{availableProducts.length}
										</Badge>
									)}
								</div>
							</CardHeader>
							<CardBody>
								{productsLoading ? (
									<div className='flex min-h-[200px] items-center justify-center'>
										<Icon
											icon='HeroArrowPath'
											className='mx-auto h-10 w-10 animate-spin text-blue-600'
										/>
									</div>
								) : availableProducts.length === 0 ? (
									<div className='flex min-h-[200px] items-center justify-center'>
										No hay productos disponibles
									</div>
								) : (
									<div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20'>
										<div className='grid grid-cols-1 gap-4 md:grid-cols-12'>
											<div className='md:col-span-5'>
												<label className='mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'>
													Producto
												</label>
												<SelectReact
													name='new-product'
													options={productOptions}
													value={
														newProductId
															? productOptions.find(
																	(opt) =>
																		opt.value ===
																		String(newProductId),
																)
															: null
													}
													onChange={(opt) =>
														setNewProductId(
															(opt as TSelectOption | null)
																? Number(
																		(opt as TSelectOption)
																			.value,
																	)
																: null,
														)
													}
													isLoading={productsLoading}
													onInputChange={(val) =>
														handleProductSearch(String(val))
													}
													isSearchable
													placeholder='Buscar por SKU, nombre o marca...'
													isClearable
												/>
											</div>
											<div className='flex items-end md:col-span-2'>
												<div className='flex items-center gap-2'>
													<Checkbox
														id='sync-new'
														variant='switch'
														checked={newSyncStock}
														onChange={(e) =>
															setNewSyncStock(e.target.checked)
														}
														disabled={!newProductId}
													/>
													<label
														htmlFor='sync-new'
														className='text-sm font-medium text-gray-700 dark:text-gray-300'>
														Sincronizar
													</label>
												</div>
											</div>
											{!newSyncStock && (
												<div className='md:col-span-2'>
													<label className='mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300'>
														Cantidad
													</label>
													<Input
														name='new-quantity'
														type='number'
														min='1'
														value={newQuantity}
														onChange={(e) =>
															setNewQuantity(
																parseInt(e.target.value) || 1,
															)
														}
														placeholder='1'
													/>
												</div>
											)}
											{newSyncStock && selectedProduct && (
												<div className='flex items-end md:col-span-2'>
													<div className='text-sm'>
														Stock:{' '}
														<span className='font-bold text-blue-600 dark:text-blue-400'>
															{selectedProduct.stock || 0}
														</span>
													</div>
												</div>
											)}
											<div className='md:col-span-3'>
												<Button
													className='w-full'
													color='blue'
													icon='HeroPlus'
													onClick={handleAddProduct}
													isLoading={submittingNew}
													isDisable={!newProductId || submittingNew}>
													Agregar
												</Button>
											</div>
										</div>
										{newSyncStock && (
											<div className='mt-3 text-xs text-amber-900 dark:text-amber-100'>
												La cantidad se sincronizará automáticamente con el
												stock del producto
											</div>
										)}
									</div>
								)}
							</CardBody>
						</Card>
					)}
				</div>
			</Container>

			{productToRemove && (
				<Modal
					isOpen={!!productToRemove}
					setIsOpen={() => setProductToRemove(null)}
					size='md'>
					<ModalHeader>
						<div className='flex items-center gap-3'>
							<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20'>
								<Icon
									icon='HeroExclamationTriangle'
									className='text-red-600 dark:text-red-400'
								/>
							</div>
							<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
								Confirmar eliminación
							</h3>
						</div>
					</ModalHeader>
					<ModalBody>
						<p className='text-gray-700 dark:text-gray-300'>
							¿Estás seguro de quitar este producto de la bodega?
						</p>
						<div className='rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800'>
							<p className='text-sm font-medium text-gray-900 dark:text-white'>
								Producto: {productToRemove.name}
							</p>
							<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
								SKU: {productToRemove.sku}
							</p>
							<p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
								Cantidad actual: {productToRemove.quantity} unidades
							</p>
						</div>
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-end gap-2'>
							<Button variant='outline' onClick={() => setProductToRemove(null)}>
								Cancelar
							</Button>
							<Button
								color='red'
								onClick={async () => {
									const success = await handleDetachProduct(warehouse.id, {
										product_id: productToRemove.id,
									} as any);
									if (success) setProductToRemove(null);
								}}>
								Sí, quitar
							</Button>
						</div>
					</ModalFooter>
				</Modal>
			)}

			{qtyModal.open && (
				<Modal
					isOpen={qtyModal.open}
					setIsOpen={() => setQtyModal({ open: false, productId: null, initialQty: 1 })}
					size='sm'>
					<ModalHeader>
						<h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
							Cantidad manual
						</h3>
					</ModalHeader>
					<ModalBody>
						<p className='text-sm text-gray-700 dark:text-gray-300'>
							Ingrese la cantidad manual para este producto
						</p>
						<Input
							name='qty'
							type='number'
							min='1'
							value={qtyInput}
							onChange={(e) => setQtyInput(parseInt(e.target.value || '0'))}
						/>
					</ModalBody>
					<ModalFooter>
						<div className='flex justify-end gap-2'>
							<Button
								variant='outline'
								onClick={() =>
									setQtyModal({ open: false, productId: null, initialQty: 1 })
								}>
								Cancelar
							</Button>
							<Button color='blue' onClick={confirmQtyModal}>
								Confirmar
							</Button>
						</div>
					</ModalFooter>
				</Modal>
			)}
		</PageWrapper>
	);
};

export default WarehouseDetailPage;
