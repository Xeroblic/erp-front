/**
 * IngresoStock.tsx — Progressive Disclosure (4 Fases)
 * @Architect + @UI_UX + @Full_React
 *
 * Fase 0: Solo Catálogo (col-12)
 * Fase 1: Catálogo (col-7) + Detalle Producto (col-5)
 * Fase 2: Selección de Sucursal Destino dentro del Detalle
 * Fase 3: Workspace abierto (full-width, debajo)
 *
 * Bypass: si Workspace ya está abierto, click en otro producto lo añade directo.
 */
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAppSelector } from '@/store';
import { selectPersonalizacionUsuario } from '@/store/slices/personalizacion/personalizacionSlice';

import { useProductos } from '@/pages/catalogos/productos/hooks/useProductos';
import type { IProduct } from '@/interface/product.interface';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

// Componentes y hooks locales
import { ProductsTable, WorkspaceTable, ProductDetailCard } from './components';
import { QuickProductForm } from './components/QuickProductForm';
import { MovementForm } from './components/MovementForm';
import { useWorkspaceItems, useStockAdjustment, useQuickProductCreate } from './hooks';

const IngresoStock = () => {
	const filters = useMemo(() => ({}), []);

	// ── Contexto centralizado de sucursal/subempresa ─────────────────────
	const {
		branchId: currentBranchId,
		subsidiaryId: contextSubsidiaryId,
		visibleBranches,
	} = useCurrentBranch();

	// ── Progressive Disclosure: Estados de Fase ─────────────────────────
	// Estado local de branchId solo para la UI del selector, sincronizado con el contexto centralizado
	const [selectedBranchId, setSelectedBranchId] = useState<string>('');

	// Sincronizar el seletor local con el contexto cuando cambia el branchId centralizado
	useEffect(() => {
		if (currentBranchId) {
			setSelectedBranchId(String(currentBranchId));
		}
	}, [currentBranchId]);

	const branchOptions = useMemo(
		() =>
			visibleBranches.map((branch) => ({
				value: String(branch.id),
				label: branch.name ?? `Sucursal ${branch.id}`,
			})),
		[visibleBranches],
	);

	// ─── Progressive Disclosure: Estados de Fase ─────────────────────────
	const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null); // Fase 0→1
	const [targetBranchId, setTargetBranchId] = useState<string>(''); // Fase 1→2
	const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false); // Fase 2→3

	// Derivar fases
	const isDetailVisible = selectedProduct !== null && !isWorkspaceOpen;

	// ─── Productos ───────────────────────────────────────────────────────
	const { products, loading, error, refresh, brands } = useProductos({
		mode: 'subsidiaries',
		branchId: undefined, // @Architect: Forzamos undefined para que catalogue cargue el stock total global
		subsidiaryId: contextSubsidiaryId,
		enabled: Boolean(contextSubsidiaryId),
		filters,
		page: 1,
		perPage: 15,
	});

	// Workspace
	const {
		workItems,
		selectedSubsidiaryId,
		addToWorkspace,
		removeFromWorkspace,
		updateItemQuantity,
		clearWorkspace,
	} = useWorkspaceItems({ contextSubsidiaryId });

	const [movementType, setMovementType] = useState<'ingreso' | 'egreso'>('ingreso');
	const [reason, setReason] = useState('');
	const [notes, setNotes] = useState('');

	const { isSubmitting, submitBatchAdjustment, getSignedQuantity } = useStockAdjustment();
	const { isCreating, createQuickProduct } = useQuickProductCreate();

	const productRows = useMemo<IProduct[]>(() => {
		return products.filter((p: IProduct) => !p.serial_tracking);
	}, [products]);

	// ─── Handlers ────────────────────────────────────────────────────────

	/**
	 * Click en "Ingresar/Ajustar" de una fila del catálogo.
	 * Si el Workspace ya está abierto → bypass: se agrega directo.
	 * Si no → se abre la Card de Detalle (Fase 1).
	 */
	const handleSelectProduct = (product: IProduct) => {
		if (isWorkspaceOpen) {
			// Bypass: agregar directo al workspace activo
			addToWorkspace(product);
			toast.info(`"${product.name}" agregado a la zona de trabajo.`);
			return;
		}
		// Fase 0 → 1: mostrar detalle
		setSelectedProduct(product);
		setTargetBranchId('');
	};

	/** Fase 2 → 3: Abrir Workspace con la sucursal elegida */
	const handleStartAdjustment = () => {
		if (!selectedProduct || !targetBranchId) return;
		addToWorkspace(selectedProduct);
		setIsWorkspaceOpen(true);
	};

	/** Cerrar Workspace: vuelve a Fase 0 */
	const handleCloseWorkspace = () => {
		clearWorkspace();
		setSelectedProduct(null);
		setTargetBranchId('');
		setIsWorkspaceOpen(false);
		setReason('');
		setNotes('');
	};

	/** Cerrar la Card Detalle: vuelve a Fase 0 */
	const handleCloseDetail = () => {
		setSelectedProduct(null);
		setTargetBranchId('');
	};

	const handleSubmit = async () => {
		// Usar targetBranchId (la sucursal elegida en la Fase 2) como destino
		await submitBatchAdjustment(
			workItems,
			targetBranchId,
			reason,
			notes,
			contextSubsidiaryId ?? 0,
			movementType,
			() => {
				handleCloseWorkspace();
				refresh();
			},
		);
	};

	const handleQuickProductCreate = async (data: {
		name: string;
		sku: string;
		price: string;
		brandId?: string;
	}) => {
		const parsedSubsidiaryId = Number(contextSubsidiaryId ?? 0);
		const parsedBranchId = Number(selectedBranchId);
		const selectedBrandId = Number(brands?.[0]?.id ?? 0);

		if (parsedSubsidiaryId <= 0 || parsedBranchId <= 0) {
			toast.error('Debes seleccionar una sucursal/subsidiaria antes de crear un producto.');
			return;
		}

		if (selectedBrandId <= 0) {
			toast.error('No hay marcas disponibles para crear el producto rápido.');
			return;
		}

		const newProduct = await createQuickProduct(
			{ ...data, brandId: data.brandId ?? String(selectedBrandId) },
			parsedSubsidiaryId,
			parsedBranchId,
			selectedBrandId,
		);
		if (newProduct) {
			addToWorkspace(newProduct);
			refresh();
		}
	};

	// ─── Render ──────────────────────────────────────────────────────────
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
					{isWorkspaceOpen && (
						<Button color='red' variant='outline' onClick={handleCloseWorkspace}>
							<Icon icon='DuoClose' className='mr-1 h-4 w-4' />
							Cerrar zona de ajuste
						</Button>
					)}
				</SubheaderRight>
			</Subheader>

			<Container>
				<div className='flex flex-col gap-4 py-8'>
					{error && <p className='text-center text-red-500'>Error: {error}</p>}
					{!selectedBranchId && (
						<p className='text-center text-amber-500'>
							Selecciona una sucursal visible para cargar productos.
						</p>
					)}

					{/* Producto Exprés */}
					<QuickProductForm
						branchId={selectedBranchId}
						isCreating={isCreating}
						onSubmit={handleQuickProductCreate}
					/>

					{/* ─── Grid Principal: Catálogo + Detalle ─── */}
					<div className='grid grid-cols-1 gap-4 lg:grid-cols-12'>
						{/* Catálogo de Productos */}
						<Card
							className={`transition-all duration-300 ${
								isDetailVisible ? 'lg:col-span-7' : 'lg:col-span-12'
							}`}>
							<CardHeader>
								<CardTitle>Catálogo de Productos</CardTitle>
								<p className='text-xs text-zinc-500'>
									{isWorkspaceOpen
										? 'Click en "Ingresar/Ajustar" para agregar más productos al workspace activo.'
										: 'Sin serialización — click en "Ingresar/Ajustar" para ver detalle.'}
								</p>
							</CardHeader>
							<CardBody>
								<ProductsTable
									products={productRows}
									loading={loading}
									onSelectProduct={handleSelectProduct}
								/>
							</CardBody>
						</Card>

						{/* Fase 1: Card Detalle de Producto */}
						{isDetailVisible && selectedProduct && (
							<div className='lg:col-span-5'>
								<ProductDetailCard
									product={selectedProduct}
									branches={branchOptions}
									targetBranchId={targetBranchId}
									onTargetBranchChange={setTargetBranchId}
									onStartAdjustment={handleStartAdjustment}
									onClose={handleCloseDetail}
									subsidiaryId={contextSubsidiaryId}
								/>
							</div>
						)}
					</div>

					{/* ─── Fase 3: Zona de Trabajo (full-width, debajo) ─── */}
					{isWorkspaceOpen && (
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
									<Badge variant='outline' color='amber'>
										Destino:{' '}
										{branchOptions.find((b) => b.value === targetBranchId)
											?.label ?? '—'}
									</Badge>
								</CardHeader>
								<CardBody>
									<MovementForm
										movementType={movementType}
										onMovementTypeChange={setMovementType}
										branchId={targetBranchId}
										onBranchIdChange={() => {}}
										branchOptions={branchOptions}
										isBranchesLoading={false}
										selectedSubsidiaryId={selectedSubsidiaryId}
										reason={reason}
										onReasonChange={setReason}
										notes={notes}
										onNotesChange={setNotes}
										hasItems={workItems.length > 0}
										isSubmitting={isSubmitting}
										onClear={() => {
											clearWorkspace();
											setReason('');
											setNotes('');
										}}
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
