import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { useProductos } from '@/pages/catalogos/productos/hooks/useProductos';
import type { IProduct } from '@/interface/product.interface';

// Módulo local de componentes y hooks
import { ProductsTable, WorkspaceTable } from './components';
import { useWorkspaceItems, useStockAdjustment, useQuickProductCreate } from './hooks';
import { QuickProductForm } from './components/QuickProductForm';
import { MovementForm } from './components/MovementForm';

const IngresoStock = () => {
	const filters = useMemo(() => ({}), []);

	// 1. Cargar productos
	const { products, loading, error, refresh } = useProductos({
		mode: 'branches',
		filters,
		page: 1,
		perPage: 15,
	});

	// 2. Estado del workspace (agregar, remover, actualizar items)
	const {
		workItems,
		isWorkspaceVisible,
		setIsWorkspaceVisible,
		selectedSubsidiaryId,
		addToWorkspace,
		removeFromWorkspace,
		updateItemQuantity,
		clearWorkspace,
	} = useWorkspaceItems();

	// 3. Estado del movimiento (tipo, sucursal, razón, notas)
	const [movementType, setMovementType] = useState<'ingreso' | 'egreso'>('ingreso');
	const [reason, setReason] = useState('');
	const [notes, setNotes] = useState('');
	const [subsidiaryId, setSubsidiaryId] = useState('');

	// 4. Lógica de validación y envío
	const { isSubmitting, submitBatchAdjustment, getSignedQuantity } = useStockAdjustment();

	// 5. Crear producto expres
	const { isCreating, createQuickProduct } = useQuickProductCreate();

	// Filtrar productos sin serialización
	const productRows = useMemo<IProduct[]>(() => {
		return products.filter((p: IProduct) => !p.serial_tracking);
	}, [products]);

	// Handler para agregar producto
	const handleAddProduct = (product: IProduct) => {
		addToWorkspace(product, subsidiaryId, setSubsidiaryId);
	};

	// Handler para enviar ajuste
	const handleSubmit = async () => {
		const success = await submitBatchAdjustment(
			workItems,
			subsidiaryId,
			reason,
			notes,
			selectedSubsidiaryId,
			movementType,
			() => {
				clearWorkspace();
				setReason('');
				setNotes('');
				refresh();
			},
		);

		// El toast ya se muestra en el hook
	};

	// Handler para limpiar workspace
	const handleClear = () => {
		clearWorkspace();
		setReason('');
		setNotes('');
	};

	// Handler para crear producto expres y agregarlo automáticamente
	const handleQuickProductCreate = async (data: { name: string; sku: string; price: string }) => {
		const parsedSubsidiaryId = Number(subsidiaryId);
		if (parsedSubsidiaryId <= 0) {
			toast.error('Debes seleccionar una sucursal/subsidiaria antes de crear un producto.');
			return;
		}

		const newProduct = await createQuickProduct(data, parsedSubsidiaryId);
		if (newProduct) {
			addToWorkspace(newProduct, undefined, undefined, data.price);
			refresh();
		}
	};

	return (
		<PageWrapper title='Ingreso / Egreso de Stock' name='Stock' isProtectedRoute>
			<Subheader>
				<SubheaderLeft>
					<div className='flex items-center space-x-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20'>
							<Icon icon='DuoBox' className='h-6 w-6' />
						</div>
						<div>
							<Badge className='text-2xl font-bold'>Ajuste de Stock</Badge>
							<p className='text-sm text-gray-600 dark:text-gray-400'>
								Flujo de facturas/boletas y mermas sin salir de la pantalla.
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						color='zinc'
						variant='outline'
						onClick={() => setIsWorkspaceVisible((prev) => !prev)}>
						{isWorkspaceVisible ? 'Ocultar' : 'Mostrar'} zona de ajuste
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='flex flex-col gap-4 py-8'>
					{error && <p className='text-center text-red-500'>Error: {error}</p>}

					<div className='flex flex-col gap-4'>
						{/* Formulario expresión para crear producto rápido */}
						<QuickProductForm
							branchId={subsidiaryId}
							isCreating={isCreating}
							onSubmit={handleQuickProductCreate}
						/>

						{/* Tabla de catálogo */}
						<Card>
							<CardHeader>
								<CardTitle>Catálogo de Productos</CardTitle>
								<p className='text-xs text-zinc-500'>
									Sin serialización — haz click en "Ingresar/Ajustar" para agregar
									a la zona de trabajo.
								</p>
							</CardHeader>
							<CardBody>
								<ProductsTable
									products={productRows}
									loading={loading}
									onSelectProduct={handleAddProduct}
								/>
							</CardBody>
						</Card>
					</div>

					{/* Zona de trabajo (workspace) */}
					{isWorkspaceVisible && (
						<div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
							{/* Tabla de items en workspace */}
							<Card className='lg:col-span-7'>
								<CardHeader>
									<CardTitle>Zona de Trabajo</CardTitle>
									<Badge variant='outline'>
										{workItems.length} producto
										{workItems.length === 1 ? '' : 's'}
									</Badge>
								</CardHeader>
								<CardBody>
									<WorkspaceTable
										items={workItems}
										getSignedQuantity={(qty) =>
											getSignedQuantity(qty, movementType)
										}
										onQuantityChange={updateItemQuantity}
										onRemoveItem={removeFromWorkspace}
									/>
								</CardBody>
							</Card>

							{/* Formulario de datos del movimiento */}
							<Card className='lg:col-span-5'>
								<CardHeader>
									<CardTitle>Datos del Movimiento</CardTitle>
								</CardHeader>
								<CardBody>
									<MovementForm
										movementType={movementType}
										onMovementTypeChange={setMovementType}
										branchId={subsidiaryId}
										onBranchIdChange={setSubsidiaryId}
										selectedSubsidiaryId={selectedSubsidiaryId}
										reason={reason}
										onReasonChange={setReason}
										notes={notes}
										onNotesChange={setNotes}
										hasItems={workItems.length > 0}
										isSubmitting={isSubmitting}
										onClear={handleClear}
										onSubmit={handleSubmit}
									/>
								</CardBody>
							</Card>
						</div>
					)}
				</div>
			</Container>
		</PageWrapper>
	);
};
export default IngresoStock;
