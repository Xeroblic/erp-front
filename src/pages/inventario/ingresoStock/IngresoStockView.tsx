import React, { useMemo } from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle, CardHeaderChild } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';
import {
	ProductsTable,
	WorkspaceTable,
	QuickProductModal,
	FinalizeAdjustmentModal,
	BrandDedupModal,
	ProductDetailCard, // @Full_React: Importamos card de detalle
} from './components';

import { useIngresoStock } from './hooks/useIngresoStock';

interface IngresoStockViewProps {
	logic: ReturnType<typeof useIngresoStock>;
}

export const IngresoStockView: React.FC<IngresoStockViewProps> = ({ logic }) => {
	const { state, forms, actions, brands } = logic;
	const {
		isLoadingProducts,
		productsError,
		productRows,
		workItems,
		modals,
		loaders,
		brandDedup,
		selectedProduct,
		targetBranchId,
		isWorkspaceOpen,
		lastBatchId,
		subsidiaryBranchOptions,
		currentSubsidiaryId,
	} = state;

	const isDetailVisible = selectedProduct !== null && !isWorkspaceOpen;

	const workspaceProductIds = useMemo(
		() => new Set(workItems.map((item) => item.productId)),
		[workItems],
	);

	return (
		<PageWrapper title='Ajuste Stock' name='Admin Stock' isProtectedRoute={true}>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20'>
							<Icon icon='DuoBox' className='h-6 w-6' />
						</div>
						<div>
							<h3 className='text-2xl font-bold'>Ajuste de Stock</h3>
							<p className='text-sm text-zinc-500'>
								Flujo de facturas/boletas y mermas sin salir de la pantalla.
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Tooltip text='Crear un producto nuevo sin salir de esta pantalla'>
						<Button
							color='blue'
							variant='solid'
							icon='HeroPlus'
							onClick={actions.openQuickProductModal}>
							Crear Producto Exprés
						</Button>
					</Tooltip>
					{isWorkspaceOpen && (
						<Tooltip text='Cerrar la zona de ajuste y descartar los productos en proceso'>
							<Button
								color='red'
								variant='solid'
								icon='HeroXMark'
								onClick={actions.handleClearWorkspace}>
								Cerrar zona de ajuste
							</Button>
						</Tooltip>
					)}
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='flex flex-col gap-6 py-8'>
					{lastBatchId && (
						<div className='flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900'>
							<span>
								Batch en seguimiento: <strong>{lastBatchId}</strong>
							</span>
							<Button
								color='blue'
								variant='outline'
								size='sm'
								onClick={actions.clearLastBatchId}>
								Ocultar
							</Button>
						</div>
					)}

					{productsError && (
						<p className='text-center text-red-500'>Error: {productsError}</p>
					)}

					<div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
						<div
							className={`col-span-1 transition-all duration-300 ${
								isDetailVisible ? 'lg:col-span-7' : 'lg:col-span-12'
							}`}>
							<Card className='h-full'>
								<CardHeader>
									<CardHeaderChild>
										<CardTitle>Catálogo de Productos</CardTitle>
										<p className='text-xs text-zinc-500'>
											{isWorkspaceOpen
												? 'Click en "Ingresar/Ajustar" para añadir al workspace activo.'
												: 'Sin serialización — click en "Ingresar/Ajustar" para ver detalle.'}
										</p>
									</CardHeaderChild>
								</CardHeader>
								<CardBody>
									<ProductsTable
										products={productRows}
										loading={isLoadingProducts}
										onSelectProduct={actions.handleAddProduct}
										selectedProductIds={workspaceProductIds}
									/>
								</CardBody>
							</Card>
						</div>

						{/* COLUMNA DERECHA: Card Detalle de Producto (Fase 1) */}
						{isDetailVisible && selectedProduct && (
							<div className='col-span-1 lg:col-span-5'>
								<ProductDetailCard
									product={selectedProduct}
									branches={subsidiaryBranchOptions}
									targetBranchId={targetBranchId}
									onTargetBranchChange={actions.setTargetBranchId}
									onStartAdjustment={actions.handleStartAdjustment}
									onClose={actions.handleCloseDetail}
									subsidiaryId={currentSubsidiaryId ?? null}
								/>
							</div>
						)}
					</div>

					{/* ─── Zona de Trabajo (Fase 3: full-width, abajo) ─── */}
					{isWorkspaceOpen && (
						<div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
							<div className='col-span-1 lg:col-span-12'>
								<Card className='h-full'>
									<CardHeader>
										<CardHeaderChild>
											<div>
												<div className='flex items-center gap-2'>
													<CardTitle>Zona de Trabajo</CardTitle>
													<Badge variant='outline'>
														{workItems.length} producto
														{workItems.length === 1 ? '' : 's'}
													</Badge>
												</div>
												<p className='mt-1 text-xs text-zinc-500'>
													Ajusta la cantidad de cada producto y luego
													confirma con "Procesar Ajuste".
												</p>
											</div>
										</CardHeaderChild>
										<CardHeaderChild>
											{workItems.length > 0 && (
												<Tooltip text='Quitar todos los productos de la zona de trabajo'>
													<Button
														color='red'
														variant='solid'
														icon='HeroTrash'
														onClick={actions.handleClearWorkspace}
														className='mr-2'>
														Limpiar
													</Button>
												</Tooltip>
											)}
											<Tooltip text='Revisar y confirmar el ajuste de stock de los productos en la zona'>
												<Button
													color='emerald'
													variant='solid'
													icon='HeroCheckCircle'
													isDisable={workItems.length === 0}
													onClick={actions.openAdjustmentModal}>
													Procesar Ajuste
												</Button>
											</Tooltip>
										</CardHeaderChild>
									</CardHeader>
									<CardBody>
										{workItems.length === 0 ? (
											<div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 p-12 text-center dark:border-zinc-800'>
												<Icon
													icon='HeroInbox'
													className='mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600'
												/>
												<p className='text-zinc-500'>
													No hay productos en la zona de trabajo.
												</p>
											</div>
										) : (
											<WorkspaceTable
												items={workItems}
												getSignedQuantity={(qty) =>
													actions.getSignedQuantity(
														qty,
														forms.adjustment.values.movementType,
													)
												}
												onQuantityChange={actions.updateItemQuantity}
												onRemoveItem={actions.removeFromWorkspace}
											/>
										)}
									</CardBody>
								</Card>
							</div>

							{/* Opcional: Podríamos re-utilizar la columna de col-span-5 para formulario de datos aquí si quisiéramos replicar el diseño exacto o simplemente dejarlo flotante. */}
						</div>
					)}
				</div>
			</Container>

			{/* Modales Controlados */}
			<QuickProductModal
				isOpen={modals.isQuickProductModalOpen}
				onClose={actions.closeQuickProductModal}
				form={forms.quickProduct}
				isSubmitting={loaders.isCreatingProduct}
				branchId={forms.adjustment.values.branchId}
				brandOptions={brands?.options ?? []}
				onBrandChange={actions.handleBrandChange}
				onCreateBrand={actions.handleCreateBrand}
			/>

			<FinalizeAdjustmentModal
				isOpen={modals.isAdjustmentModalOpen}
				onClose={actions.closeAdjustmentModal}
				form={forms.adjustment}
				isSubmitting={loaders.isAdjusting}
				itemCount={workItems.length}
				workItems={workItems}
				subsidiaryId={currentSubsidiaryId ?? null}
			/>

			<BrandDedupModal
				isOpen={modals.isBrandDedupModalOpen}
				onClose={actions.handleCloseBrandDedupModal}
				duplicates={brandDedup.candidates}
				affectedProductsByBrand={brandDedup.productsByBrand}
				defaultKeepId={brandDedup.defaultKeepId}
				isLoadingProducts={loaders.isLoadingBrandDedupProducts}
				isSubmitting={loaders.isResolvingBrandDedup}
				onConfirm={actions.handleConfirmBrandDedup}
			/>
		</PageWrapper>
	);
};

export default IngresoStockView;
