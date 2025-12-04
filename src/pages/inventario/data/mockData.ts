/**
 * Datos mock para el módulo de inventario
 */

export interface MockProduct {
	id: number;
	name: string;
	sku: string;
	category: string;
}

export interface MockWarehouse {
	id: number;
	name: string;
	location: string;
}

export interface MockInventoryMovement {
	id: number;
	movement_date: string;
	movement_type: 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT';
	product: MockProduct;
	warehouse: MockWarehouse;
	quantity: number;
	unit_cost?: number;
	total_cost?: number;
	reference: string;
	notes?: string;
	created_by: string;
}

export interface MockInventoryItem {
	product_id: number;
	warehouse_id: number;
	product: MockProduct;
	warehouse: MockWarehouse;
	current_stock: number;
	available_stock: number;
	reserved_stock: number;
	status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
	last_updated: string;
}

export interface MockStockLevel {
	product_id: number;
	warehouse_id: number;
	product: MockProduct;
	warehouse: MockWarehouse;
	current_stock: number;
	min_stock: number;
	max_stock: number;
	reorder_point: number;
	status: 'OPTIMAL' | 'LOW' | 'CRITICAL' | 'OVERSTOCK';
}

export interface MockStockAlert {
	id: number;
	product: MockProduct;
	warehouse: MockWarehouse;
	alert_level: 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
	current_stock: number;
	min_stock: number;
	created_at: string;
}

export interface MockInventoryStatistics {
	totalProducts: number;
	totalWarehouses: number;
	totalMovements: number;
	lowStockItems: number;
	outOfStockItems: number;
	recentMovements: number;
}

// Mock Products
export const mockProducts: MockProduct[] = [
	{ id: 1, name: 'Laptop Dell Inspiron 15', sku: 'LAP-DELL-001', category: 'Electrónicos' },
	{ id: 2, name: 'Mouse Logitech MX Master', sku: 'MOU-LOG-001', category: 'Periféricos' },
	{ id: 3, name: 'Teclado Mecánico RGB', sku: 'KEY-MEC-001', category: 'Periféricos' },
	{ id: 4, name: 'Monitor Samsung 24"', sku: 'MON-SAM-001', category: 'Monitores' },
	{ id: 5, name: 'Silla Ergonómica', sku: 'CHR-ERG-001', category: 'Mobiliario' },
	{ id: 6, name: 'Disco SSD 1TB', sku: 'SSD-1TB-001', category: 'Almacenamiento' },
	{ id: 7, name: 'RAM DDR4 16GB', sku: 'RAM-16GB-001', category: 'Memoria' },
	{ id: 8, name: 'Webcam Logitech 4K', sku: 'WEB-LOG-001', category: 'Periféricos' },
];

// Mock Warehouses
export const mockWarehouses: MockWarehouse[] = [
	{ id: 1, name: 'Almacén Principal', location: 'Centro' },
	{ id: 2, name: 'Almacén Norte', location: 'Zona Norte' },
	{ id: 3, name: 'Almacén Sur', location: 'Zona Sur' },
	{ id: 4, name: 'Almacén Temporal', location: 'Bodega Temporal' },
];

// Mock Movements
export const mockMovements: MockInventoryMovement[] = [
	{
		id: 1,
		movement_date: '2025-01-09T10:30:00Z',
		movement_type: 'ENTRY',
		product: mockProducts[0],
		warehouse: mockWarehouses[0],
		quantity: 10,
		unit_cost: 1200000,
		total_cost: 12000000,
		reference: 'PO-2025-001',
		notes: 'Compra inicial de laptops',
		created_by: 'Juan Pérez',
	},
	{
		id: 2,
		movement_date: '2025-01-09T11:15:00Z',
		movement_type: 'EXIT',
		product: mockProducts[1],
		warehouse: mockWarehouses[0],
		quantity: -5,
		reference: 'SO-2025-001',
		notes: 'Venta a cliente corporativo',
		created_by: 'María González',
	},
	{
		id: 3,
		movement_date: '2025-01-09T14:20:00Z',
		movement_type: 'TRANSFER',
		product: mockProducts[2],
		warehouse: mockWarehouses[0],
		quantity: -8,
		reference: 'TR-2025-001',
		notes: 'Transferencia a almacén norte',
		created_by: 'Carlos López',
	},
	{
		id: 4,
		movement_date: '2025-01-09T15:45:00Z',
		movement_type: 'ADJUSTMENT',
		product: mockProducts[3],
		warehouse: mockWarehouses[1],
		quantity: 2,
		reference: 'ADJ-2025-001',
		notes: 'Ajuste por inventario físico',
		created_by: 'Ana Rodríguez',
	},
	{
		id: 5,
		movement_date: '2025-01-08T09:00:00Z',
		movement_type: 'ENTRY',
		product: mockProducts[4],
		warehouse: mockWarehouses[2],
		quantity: 15,
		unit_cost: 450000,
		total_cost: 6750000,
		reference: 'PO-2025-002',
		notes: 'Reposición de sillas ergonómicas',
		created_by: 'Luis Martínez',
	},
];

// Mock Items
export const mockItems: MockInventoryItem[] = [
	{
		product_id: 1,
		warehouse_id: 1,
		product: mockProducts[0],
		warehouse: mockWarehouses[0],
		current_stock: 25,
		available_stock: 20,
		reserved_stock: 5,
		status: 'IN_STOCK',
		last_updated: '2025-01-09T16:00:00Z',
	},
	{
		product_id: 2,
		warehouse_id: 1,
		product: mockProducts[1],
		warehouse: mockWarehouses[0],
		current_stock: 8,
		available_stock: 8,
		reserved_stock: 0,
		status: 'LOW_STOCK',
		last_updated: '2025-01-09T15:30:00Z',
	},
	{
		product_id: 3,
		warehouse_id: 1,
		product: mockProducts[2],
		warehouse: mockWarehouses[0],
		current_stock: 12,
		available_stock: 10,
		reserved_stock: 2,
		status: 'IN_STOCK',
		last_updated: '2025-01-09T14:45:00Z',
	},
	{
		product_id: 4,
		warehouse_id: 2,
		product: mockProducts[3],
		warehouse: mockWarehouses[1],
		current_stock: 0,
		available_stock: 0,
		reserved_stock: 0,
		status: 'OUT_OF_STOCK',
		last_updated: '2025-01-09T12:00:00Z',
	},
];

// Mock Stock Levels
export const mockStockLevels: MockStockLevel[] = [
	{
		product_id: 1,
		warehouse_id: 1,
		product: mockProducts[0],
		warehouse: mockWarehouses[0],
		current_stock: 25,
		min_stock: 5,
		max_stock: 50,
		reorder_point: 10,
		status: 'OPTIMAL',
	},
	{
		product_id: 2,
		warehouse_id: 1,
		product: mockProducts[1],
		warehouse: mockWarehouses[0],
		current_stock: 8,
		min_stock: 10,
		max_stock: 30,
		reorder_point: 15,
		status: 'LOW',
	},
	{
		product_id: 3,
		warehouse_id: 1,
		product: mockProducts[2],
		warehouse: mockWarehouses[0],
		current_stock: 2,
		min_stock: 5,
		max_stock: 25,
		reorder_point: 8,
		status: 'CRITICAL',
	},
];

// Mock Stock Alerts
export const mockStockAlerts: MockStockAlert[] = [
	{
		id: 1,
		product: mockProducts[1],
		warehouse: mockWarehouses[0],
		alert_level: 'LOW',
		current_stock: 8,
		min_stock: 10,
		created_at: '2025-01-09T14:00:00Z',
	},
	{
		id: 2,
		product: mockProducts[2],
		warehouse: mockWarehouses[0],
		alert_level: 'CRITICAL',
		current_stock: 2,
		min_stock: 5,
		created_at: '2025-01-09T13:30:00Z',
	},
	{
		id: 3,
		product: mockProducts[3],
		warehouse: mockWarehouses[1],
		alert_level: 'OUT_OF_STOCK',
		current_stock: 0,
		min_stock: 3,
		created_at: '2025-01-09T12:00:00Z',
	},
];

// Mock Statistics
export const mockStatistics: MockInventoryStatistics = {
	totalProducts: 150,
	totalWarehouses: 4,
	totalMovements: 1250,
	lowStockItems: 12,
	outOfStockItems: 3,
	recentMovements: 25,
};
