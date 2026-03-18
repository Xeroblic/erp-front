import React from 'react';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle, CardHeaderChild } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import {
	ProductsTable,
	WorkspaceTable,
	QuickProductModal,
	FinalizeAdjustmentModal,
	BrandDedupModal,
} from './components';

// Importamos el retorno del hook pre-procesado por Full_React
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
		isWorkspaceVisible,
		modals,
		loaders,
		brandDedup,
	} = state;

	return (
		<PageWrapper>
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
					<Button
						color='blue'
						variant='solid'
						icon='HeroPlus'
						onClick={actions.openQuickProductModal}>
						Crear Producto Exprés
					</Button>
					<Button
						color='zinc'
						variant='outline'
						onClick={() => actions.setIsWorkspaceVisible(!isWorkspaceVisible)}>
						{isWorkspaceVisible ? 'Ocultar zona de ajuste' : 'Mostrar zona de ajuste'}
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='flex flex-col gap-6 py-8'>
					{productsError && (
						<p className='text-center text-red-500'>Error: {productsError}</p>
					)}

					<div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
						{/* COLUMNA IZQUIERDA: Catálogo de Productos */}
						<div
							className={`col-span-1 ${isWorkspaceVisible ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
							<Card className='h-full'>
								<CardHeader>
									<CardTitle>Catálogo de Productos</CardTitle>
									<p className='text-xs text-zinc-500'>
										Sin serialización — click en "Ingresar/Ajustar" para agregar
									</p>
								</CardHeader>
								<CardBody>
									<ProductsTable
										products={productRows}
										loading={isLoadingProducts}
										onSelectProduct={actions.handleAddProduct}
									/>
								</CardBody>
							</Card>
						</div>

						{/* COLUMNA DERECHA: Zona de Trabajo */}
						{isWorkspaceVisible && (
							<div className='col-span-1 lg:col-span-7'>
								<Card className='h-full'>
									<CardHeader>
										<CardHeaderChild>
											<CardTitle>Zona de Trabajo</CardTitle>
											<Badge variant='outline'>
												{workItems.length} producto
												{workItems.length === 1 ? '' : 's'}
											</Badge>
										</CardHeaderChild>
										<CardHeaderChild>
											{workItems.length > 0 && (
												<Button
													color='red'
													variant='outline'
													onClick={actions.handleClearWorkspace}
													className='mr-2'>
													Limpiar
												</Button>
											)}
											<Button
												color='amber'
												variant='solid'
												isDisable={workItems.length === 0}
												onClick={actions.openAdjustmentModal}>
												Procesar Ajuste
											</Button>
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
												<p className='text-sm text-zinc-400'>
													Selecciona productos del catálogo a la
													izquierda.
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
						)}
					</div>
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
