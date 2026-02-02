import React, { useState, useEffect } from 'react';

// Components
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/form/Select';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Table, { TBody, Td, THead, Th, Tr } from '@/components/ui/Table';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import PermissionGuard from '@/components/authorization/PermissionGuard';
import { formatDate } from '@/utils/format.utils';

// Interfaces
interface TechnicalState {
	id: string;
	name: string;
	description: string;
	color: string;
	order: number;
}

interface Warehouse {
	id: number;
	name: string;
	code: string;
}

interface InventoryByTechState {
	warehouse_id: number;
	warehouse_name: string;
	warehouse_code: string;
	tech_states: {
		[key: string]: {
			quantity: number;
			products: ProductInBucket[];
		};
	};
}

interface ProductInBucket {
	id: number;
	product_id: number;
	product_name: string;
	product_sku: string;
	serial_number?: string;
	quantity: number;
	condition_grade: string;
	last_updated: string;
	location?: string;
}

interface InventoryBucketDetail {
	warehouse: Warehouse;
	tech_state: TechnicalState;
	total_quantity: number;
	products: ProductInBucket[];
	last_updated: string;
}

// Estados técnicos posibles
const TECHNICAL_STATES: TechnicalState[] = [
	{
		id: 'NEW',
		name: 'Nuevo',
		description: 'Producto nuevo sin uso',
		color: 'green',
		order: 1,
	},
	{
		id: 'USED',
		name: 'Usado',
		description: 'Producto usado en buenas condiciones',
		color: 'blue',
		order: 2,
	},
	{
		id: 'REFURBISHED',
		name: 'Reacondicionado',
		description: 'Producto restaurado y verificado',
		color: 'amber',
		order: 3,
	},
	{
		id: 'DAMAGED',
		name: 'Dañado',
		description: 'Producto con daños que requiere reparación',
		color: 'red',
		order: 4,
	},
	{
		id: 'OBSOLETE',
		name: 'Obsoleto',
		description: 'Producto descontinuado o sin valor comercial',
		color: 'gray',
		order: 5,
	},
];

// Bodegas mock
const MOCK_WAREHOUSES: Warehouse[] = [
	{ id: 1, name: 'Bodega Central', code: 'BC01' },
	{ id: 2, name: 'Bodega Norte', code: 'BN02' },
	{ id: 3, name: 'Bodega Sur', code: 'BS03' },
	{ id: 4, name: 'Bodega Distribución', code: 'BD04' },
	{ id: 5, name: 'Bodega Reparaciones', code: 'BR05' },
];

const MOCK_INVENTORY_DATA: InventoryByTechState[] = [
	{
		warehouse_id: 1,
		warehouse_name: 'Bodega Central',
		warehouse_code: 'BC01',
		tech_states: {
			NEW: {
				quantity: 45,
				products: [
					{
						id: 1,
						product_id: 1,
						product_name: 'Laptop Dell Inspiron 15',
						product_sku: 'LAP-DELL-15',
						serial_number: 'DL2025001',
						quantity: 15,
						condition_grade: 'A+',
						last_updated: '2025-09-10T10:00:00Z',
						location: 'A-01-03',
					},
					{
						id: 2,
						product_id: 2,
						product_name: 'Monitor Samsung 24"',
						product_sku: 'MON-SAM-24',
						quantity: 30,
						condition_grade: 'A',
						last_updated: '2025-09-09T14:30:00Z',
						location: 'B-02-01',
					},
				],
			},
			USED: {
				quantity: 12,
				products: [
					{
						id: 3,
						product_id: 1,
						product_name: 'Laptop Dell Inspiron 15',
						product_sku: 'LAP-DELL-15',
						serial_number: 'DL2024098',
						quantity: 8,
						condition_grade: 'B',
						last_updated: '2025-09-08T16:15:00Z',
						location: 'A-01-04',
					},
					{
						id: 4,
						product_id: 3,
						product_name: 'Teclado Mecánico Logitech',
						product_sku: 'TEC-LOG-MEC',
						quantity: 4,
						condition_grade: 'B+',
						last_updated: '2025-09-07T11:20:00Z',
						location: 'C-03-02',
					},
				],
			},
			REFURBISHED: {
				quantity: 8,
				products: [
					{
						id: 5,
						product_id: 4,
						product_name: 'Mouse Óptico HP',
						product_sku: 'MOU-HP-OPT',
						quantity: 8,
						condition_grade: 'B',
						last_updated: '2025-09-06T09:45:00Z',
						location: 'C-03-01',
					},
				],
			},
			DAMAGED: {
				quantity: 3,
				products: [
					{
						id: 6,
						product_id: 5,
						product_name: 'Impresora HP LaserJet',
						product_sku: 'IMP-HP-LASER',
						serial_number: 'HP2024-567',
						quantity: 2,
						condition_grade: 'C',
						last_updated: '2025-09-05T13:30:00Z',
						location: 'D-04-01',
					},
					{
						id: 7,
						product_id: 2,
						product_name: 'Monitor Samsung 24"',
						product_sku: 'MON-SAM-24',
						quantity: 1,
						condition_grade: 'C',
						last_updated: '2025-09-04T08:15:00Z',
						location: 'D-04-02',
					},
				],
			},
			OBSOLETE: {
				quantity: 2,
				products: [
					{
						id: 8,
						product_id: 6,
						product_name: 'Fax Brother Antiguo',
						product_sku: 'FAX-BRO-OLD',
						quantity: 2,
						condition_grade: 'D',
						last_updated: '2025-08-30T16:00:00Z',
						location: 'E-05-01',
					},
				],
			},
		},
	},
	{
		warehouse_id: 2,
		warehouse_name: 'Bodega Norte',
		warehouse_code: 'BN02',
		tech_states: {
			NEW: {
				quantity: 28,
				products: [
					{
						id: 9,
						product_id: 7,
						product_name: 'Tablet Samsung Galaxy',
						product_sku: 'TAB-SAM-GAL',
						quantity: 20,
						condition_grade: 'A+',
						last_updated: '2025-09-09T12:00:00Z',
						location: 'A-01-01',
					},
					{
						id: 10,
						product_id: 8,
						product_name: 'Smartphone iPhone 14',
						product_sku: 'PHO-APP-I14',
						quantity: 8,
						condition_grade: 'A+',
						last_updated: '2025-09-08T15:30:00Z',
						location: 'A-01-02',
					},
				],
			},
			USED: {
				quantity: 15,
				products: [
					{
						id: 11,
						product_id: 7,
						product_name: 'Tablet Samsung Galaxy',
						product_sku: 'TAB-SAM-GAL',
						quantity: 10,
						condition_grade: 'B+',
						last_updated: '2025-09-07T10:15:00Z',
						location: 'A-02-01',
					},
					{
						id: 12,
						product_id: 8,
						product_name: 'Smartphone iPhone 14',
						product_sku: 'PHO-APP-I14',
						quantity: 5,
						condition_grade: 'B',
						last_updated: '2025-09-06T14:45:00Z',
						location: 'A-02-02',
					},
				],
			},
			REFURBISHED: {
				quantity: 6,
				products: [
					{
						id: 13,
						product_id: 9,
						product_name: 'Smartwatch Apple Watch',
						product_sku: 'WAT-APP-SW',
						quantity: 6,
						condition_grade: 'B',
						last_updated: '2025-09-05T09:30:00Z',
						location: 'B-01-01',
					},
				],
			},
			DAMAGED: {
				quantity: 1,
				products: [
					{
						id: 14,
						product_id: 8,
						product_name: 'Smartphone iPhone 14',
						product_sku: 'PHO-APP-I14',
						serial_number: 'APL2024-999',
						quantity: 1,
						condition_grade: 'C',
						last_updated: '2025-09-03T11:00:00Z',
						location: 'C-01-01',
					},
				],
			},
			OBSOLETE: {
				quantity: 0,
				products: [],
			},
		},
	},
	// Agregar más bodegas con algunos estados vacíos para mostrar variabilidad
	{
		warehouse_id: 3,
		warehouse_name: 'Bodega Sur',
		warehouse_code: 'BS03',
		tech_states: {
			NEW: {
				quantity: 35,
				products: [
					{
						id: 15,
						product_id: 10,
						product_name: 'Proyector Epson',
						product_sku: 'PRJ-EPS-HD',
						quantity: 5,
						condition_grade: 'A+',
						last_updated: '2025-09-09T16:20:00Z',
						location: 'A-01-01',
					},
				],
			},
			USED: { quantity: 0, products: [] },
			REFURBISHED: {
				quantity: 12,
				products: [
					{
						id: 16,
						product_id: 10,
						product_name: 'Proyector Epson',
						product_sku: 'PRJ-EPS-HD',
						quantity: 12,
						condition_grade: 'B+',
						last_updated: '2025-09-08T10:30:00Z',
						location: 'B-01-01',
					},
				],
			},
			DAMAGED: { quantity: 0, products: [] },
			OBSOLETE: { quantity: 0, products: [] },
		},
	},
];

const InventarioEstadoTecnico: React.FC = () => {
	const [inventoryData, setInventoryData] = useState<InventoryByTechState[]>(MOCK_INVENTORY_DATA);
	const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [selectedBucket, setSelectedBucket] = useState<InventoryBucketDetail | null>(null);

	const filteredData =
		selectedWarehouse === 'all'
			? inventoryData
			: inventoryData.filter((item) => item.warehouse_id.toString() === selectedWarehouse);

	const calculateTotals = () => {
		const totals = TECHNICAL_STATES.reduce(
			(acc, state) => {
				acc[state.id] = 0;
				return acc;
			},
			{} as { [key: string]: number },
		);

		filteredData.forEach((warehouse) => {
			TECHNICAL_STATES.forEach((state) => {
				const stateData = warehouse.tech_states[state.id];
				if (stateData) {
					totals[state.id] += stateData.quantity;
				}
			});
		});

		return totals;
	};

	const totals = calculateTotals();
	const grandTotal = Object.values(totals).reduce((sum, qty) => sum + qty, 0);

	const getTechStateBadge = (state: TechnicalState, quantity: number) => {
		return (
			<Badge
				color={state.color as any}
				variant={quantity === 0 ? 'outline' : 'solid'}
				className={quantity === 0 ? 'opacity-50' : ''}>
				{state.name}: {quantity}
			</Badge>
		);
	};

	const handleCellClick = (warehouse: InventoryByTechState, techState: TechnicalState) => {
		const stateData = warehouse.tech_states[techState.id];

		if (!stateData || stateData.quantity === 0) {
			return;
		}

		const bucketDetail: InventoryBucketDetail = {
			warehouse: {
				id: warehouse.warehouse_id,
				name: warehouse.warehouse_name,
				code: warehouse.warehouse_code,
			},
			tech_state: techState,
			total_quantity: stateData.quantity,
			products: stateData.products,
			last_updated:
				stateData.products.length > 0
					? stateData.products.reduce(
							(latest, product) =>
								new Date(product.last_updated) > new Date(latest)
									? product.last_updated
									: latest,
							stateData.products[0].last_updated,
						)
					: new Date().toISOString(),
		};

		setSelectedBucket(bucketDetail);
		setShowDetailModal(true);
	};

	const getConditionGradeBadge = (grade: string) => {
		const gradeConfig = {
			'A+': { color: 'emerald' as const, text: 'Excelente' },
			A: { color: 'emerald' as const, text: 'Muy Bueno' },
			'B+': { color: 'sky' as const, text: 'Bueno+' },
			B: { color: 'sky' as const, text: 'Bueno' },
			C: { color: 'amber' as const, text: 'Regular' },
			D: { color: 'red' as const, text: 'Deficiente' },
		};

		const config = gradeConfig[grade as keyof typeof gradeConfig] || gradeConfig.B;
		return (
			<Badge color={config.color} variant='outline'>
				{grade} - {config.text}
			</Badge>
		);
	};

	return (
		<Container className='flex shrink-0 grow basis-auto flex-col pb-0'>
			{/* Header */}
			<div className='flex items-center justify-between py-4'>
				<div>
					<h1 className='text-3xl font-semibold'>Inventario por Estado Técnico</h1>
					<p className='text-zinc-500'>
						Vista matricial de productos por bodega y estado técnico
					</p>
				</div>
				<div className='text-right'>
					<p className='text-2xl font-bold'>{grandTotal}</p>
					<p className='text-sm text-gray-600'>Total Unidades</p>
				</div>
			</div>

			{/* Filtros */}
			<Card className='mb-6'>
				<CardHeader>
					<CardTitle>Filtros</CardTitle>
				</CardHeader>
				<CardBody>
					<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
						<div>
							<label className='mb-2 block text-sm font-medium'>Bodega</label>
							<Select
								name='warehouse'
								value={selectedWarehouse}
								onChange={(e) => setSelectedWarehouse(e.target.value)}>
								<option value='all'>Todas las bodegas</option>
								{MOCK_WAREHOUSES.map((warehouse) => (
									<option key={warehouse.id} value={warehouse.id.toString()}>
										{warehouse.name} ({warehouse.code})
									</option>
								))}
							</Select>
						</div>

						{/* Leyenda de estados técnicos */}
						<div className='md:col-span-2'>
							<label className='mb-2 block text-sm font-medium'>
								Estados Técnicos
							</label>
							<div className='flex flex-wrap gap-2'>
								{TECHNICAL_STATES.map((state) => (
									<Badge
										key={state.id}
										color={state.color as any}
										variant='outline'>
										{state.name}
									</Badge>
								))}
							</div>
						</div>
					</div>
				</CardBody>
			</Card>

			{/* Resumen por estados técnicos */}
			<Card className='mb-6'>
				<CardHeader>
					<CardTitle>Resumen General</CardTitle>
				</CardHeader>
				<CardBody>
					<div className='grid grid-cols-2 gap-4 md:grid-cols-5'>
						{TECHNICAL_STATES.map((state) => (
							<div key={state.id} className='rounded-lg border p-4 text-center'>
								<div className={`text-2xl font-bold text-${state.color}-600`}>
									{totals[state.id]}
								</div>
								<div className='text-sm text-gray-600'>{state.name}</div>
								<div className='mt-1 text-xs text-gray-500'>
									{state.description}
								</div>
							</div>
						))}
					</div>
				</CardBody>
			</Card>

			{/* Matriz Bodega × Estado Técnico */}
			<Card>
				<CardHeader>
					<CardTitle>
						Matriz Inventario por Bodega y Estado
						{selectedWarehouse !== 'all' &&
							` - ${MOCK_WAREHOUSES.find((w) => w.id.toString() === selectedWarehouse)?.name}`}
					</CardTitle>
				</CardHeader>
				<CardBody>
					<div className='overflow-x-auto'>
						<table className='min-w-full table-auto border-collapse'>
							<thead>
								<tr>
									<th className='border bg-gray-50 px-4 py-3 text-left font-medium'>
										Bodega
									</th>
									{TECHNICAL_STATES.map((state) => (
										<th
											key={state.id}
											className='min-w-[120px] border bg-gray-50 px-4 py-3 text-center font-medium'>
											<div className='space-y-1'>
												<div
													className={`font-semibold text-${state.color}-700`}>
													{state.name}
												</div>
												<div className='text-xs text-gray-600'>
													{state.description}
												</div>
											</div>
										</th>
									))}
									<th className='border bg-gray-50 px-4 py-3 text-center font-medium'>
										Total
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredData.map((warehouse) => {
									const warehouseTotal = TECHNICAL_STATES.reduce((sum, state) => {
										return (
											sum + (warehouse.tech_states[state.id]?.quantity || 0)
										);
									}, 0);

									return (
										<tr
											key={warehouse.warehouse_id}
											className='hover:bg-gray-50'>
											<td className='border px-4 py-3 font-medium'>
												<div>
													<div className='font-semibold'>
														{warehouse.warehouse_name}
													</div>
													<div className='font-mono text-sm text-gray-600'>
														{warehouse.warehouse_code}
													</div>
												</div>
											</td>
											{TECHNICAL_STATES.map((state) => {
												const quantity =
													warehouse.tech_states[state.id]?.quantity || 0;
												return (
													<td
														key={state.id}
														className={`cursor-pointer border px-4 py-3 text-center transition-colors hover:bg-${state.color}-50 ${
															quantity === 0
																? 'text-gray-400'
																: `text-${state.color}-700 font-semibold`
														}`}
														onClick={() =>
															handleCellClick(warehouse, state)
														}
														title={
															quantity === 0
																? 'Sin productos'
																: `Click para ver detalles (${quantity} productos)`
														}>
														<div className='text-xl'>{quantity}</div>
														{quantity > 0 && (
															<div className='text-xs text-gray-500'>
																{warehouse.tech_states[state.id]
																	?.products.length || 0}{' '}
																tipos
															</div>
														)}
													</td>
												);
											})}
											<td className='border px-4 py-3 text-center text-lg font-bold'>
												{warehouseTotal}
											</td>
										</tr>
									);
								})}

								{/* Fila de totales */}
								<tr className='bg-gray-100 font-bold'>
									<td className='border px-4 py-3'>TOTAL</td>
									{TECHNICAL_STATES.map((state) => (
										<td
											key={state.id}
											className='border px-4 py-3 text-center text-lg'>
											{totals[state.id]}
										</td>
									))}
									<td className='border px-4 py-3 text-center text-xl'>
										{grandTotal}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</CardBody>
			</Card>

			{/* Modal de detalles del bucket */}
			<Modal isOpen={showDetailModal} setIsOpen={setShowDetailModal} size='4xl'>
				<ModalHeader>
					<h3 className='text-lg font-semibold'>
						Detalle de Inventario - {selectedBucket?.warehouse.name}
					</h3>
				</ModalHeader>
				<ModalBody>
					{selectedBucket && (
						<div className='space-y-6'>
							{/* Información del bucket */}
							<div className='grid grid-cols-2 gap-6'>
								<div>
									<h4 className='mb-3 font-medium text-gray-700'>
										Información General
									</h4>
									<div className='space-y-2'>
										<div>
											<span className='text-sm text-gray-600'>Bodega:</span>
											<p className='font-medium'>
												{selectedBucket.warehouse.name} (
												{selectedBucket.warehouse.code})
											</p>
										</div>
										<div>
											<span className='text-sm text-gray-600'>
												Estado Técnico:
											</span>
											<div className='mt-1'>
												<Badge
													color={selectedBucket.tech_state.color as any}>
													{selectedBucket.tech_state.name}
												</Badge>
											</div>
											<p className='mt-1 text-sm text-gray-600'>
												{selectedBucket.tech_state.description}
											</p>
										</div>
										<div>
											<span className='text-sm text-gray-600'>
												Última actualización:
											</span>
											<p className='text-sm'>
												{formatDate(selectedBucket.last_updated)}
											</p>
										</div>
									</div>
								</div>

								<div>
									<h4 className='mb-3 font-medium text-gray-700'>Estadísticas</h4>
									<div className='space-y-2'>
										<div className='rounded-lg bg-sky-50 p-3 text-center'>
											<div className='text-2xl font-bold text-sky-600'>
												{selectedBucket.total_quantity}
											</div>
											<div className='text-sm text-sky-800'>
												Total Unidades
											</div>
										</div>
										<div className='rounded-lg bg-emerald-50 p-3 text-center'>
											<div className='text-2xl font-bold text-emerald-600'>
												{selectedBucket.products.length}
											</div>
											<div className='text-sm text-emerald-800'>
												Tipos de Productos
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Tabla de productos */}
							<div>
								<h4 className='mb-3 font-medium text-gray-700'>
									Productos en este Bucket
								</h4>
								<div className='overflow-x-auto'>
									<Table>
										<THead>
											<Tr>
												<Th>SKU</Th>
												<Th>Producto</Th>
												<Th>Cantidad</Th>
												<Th>Serie/Lote</Th>
												<Th>Condición</Th>
												<Th>Ubicación</Th>
												<Th>Actualizado</Th>
											</Tr>
										</THead>
										<TBody>
											{selectedBucket.products.map((product) => (
												<Tr key={product.id}>
													<Td className='font-mono text-sm'>
														{product.product_sku}
													</Td>
													<Td>
														<div>
															<div className='font-medium'>
																{product.product_name}
															</div>
														</div>
													</Td>
													<Td className='font-semibold'>
														{product.quantity}
													</Td>
													<Td className='font-mono text-sm'>
														{product.serial_number || '-'}
													</Td>
													<Td>
														{getConditionGradeBadge(
															product.condition_grade,
														)}
													</Td>
													<Td className='font-mono text-sm'>
														{product.location || '-'}
													</Td>
													<Td className='text-sm'>
														{formatDate(product.last_updated)}
													</Td>
												</Tr>
											))}
										</TBody>
									</Table>
								</div>
							</div>
						</div>
					)}
				</ModalBody>
				<ModalFooter>
					<Button variant='outline' onClick={() => setShowDetailModal(false)}>
						Cerrar
					</Button>
					<PermissionGuard permissions={[ERP_PERMISSIONS.INVENTORY.VIEW]}>
						<Button
							color='blue'
							onClick={() => {
								// Deep-link a vista detallada de inventario
								window.open(
									`/inventario?warehouse_id=${selectedBucket?.warehouse.id}&tech_state=${selectedBucket?.tech_state.id}`,
									'_blank',
								);
							}}>
							Ver en Inventario General
						</Button>
					</PermissionGuard>
				</ModalFooter>
			</Modal>
		</Container>
	);
};

export default InventarioEstadoTecnico;
