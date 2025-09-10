/**
 * Mock data para movimientos de inventario
 * Datos de prueba para el desarrollo del módulo de historial
 */

export type MovementType = 'ENTRY' | 'EXIT' | 'TRANSFER' | 'ADJUSTMENT' | 'SALE' | 'PURCHASE';

export interface IInventoryMovement {
    id: number;
    type: MovementType;
    product?: {
        id: number;
        name: string;
        sku: string;
    };
    warehouse?: {
        id: number;
        name: string;
    };
    quantity: number;
    previous_stock: number;
    current_stock: number;
    reference_type?: string;
    reference_id?: number;
    notes?: string;
    performer?: {
        id: number;
        name: string;
    };
    created_at: string;
}

export interface MovementStats {
    totalMovements: number;
    totalEntries: number;
    totalExits: number;
    uniqueProducts: number;
    lastMovement?: IInventoryMovement;
}

// Mock data
export const mockMovements: IInventoryMovement[] = [
    {
        id: 1,
        type: 'TRANSFER',
        product: { id: 1, name: 'Laptop Dell XPS 13', sku: 'DELL-XPS-001' },
        warehouse: { id: 1, name: 'Almacén Central' },
        quantity: -2,
        previous_stock: 15,
        current_stock: 13,
        reference_type: 'TRANSFER',
        reference_id: 1001,
        notes: 'Transferencia a sucursal sur',
        performer: { id: 1, name: 'Juan Pérez' },
        created_at: '2024-09-10T10:30:00Z'
    },
    {
        id: 2,
        type: 'ENTRY',
        product: { id: 2, name: 'Monitor Samsung 24"', sku: 'SAM-MON-024' },
        warehouse: { id: 2, name: 'Almacén Norte' },
        quantity: 5,
        previous_stock: 8,
        current_stock: 13,
        reference_type: 'PURCHASE',
        reference_id: 2001,
        notes: 'Compra mensual de monitores',
        performer: { id: 2, name: 'María González' },
        created_at: '2024-09-09T14:15:00Z'
    },
    {
        id: 3,
        type: 'SALE',
        product: { id: 3, name: 'Teclado Mecánico RGB', sku: 'KEY-RGB-001' },
        warehouse: { id: 1, name: 'Almacén Central' },
        quantity: -1,
        previous_stock: 25,
        current_stock: 24,
        reference_type: 'SALE',
        reference_id: 3001,
        notes: 'Venta a cliente premium',
        performer: { id: 3, name: 'Carlos Silva' },
        created_at: '2024-09-08T16:45:00Z'
    },
    {
        id: 4,
        type: 'ADJUSTMENT',
        product: { id: 4, name: 'Mouse Inalámbrico', sku: 'MOU-WIR-001' },
        warehouse: { id: 3, name: 'Almacén Sur' },
        quantity: -3,
        previous_stock: 50,
        current_stock: 47,
        reference_type: 'ADJUSTMENT',
        reference_id: 4001,
        notes: 'Ajuste por inventario físico',
        performer: { id: 1, name: 'Juan Pérez' },
        created_at: '2024-09-07T11:20:00Z'
    },
    {
        id: 5,
        type: 'PURCHASE',
        product: { id: 5, name: 'Auriculares Bluetooth', sku: 'AUR-BLU-001' },
        warehouse: { id: 2, name: 'Almacén Norte' },
        quantity: 12,
        previous_stock: 3,
        current_stock: 15,
        reference_type: 'PURCHASE',
        reference_id: 2002,
        notes: 'Restock de auriculares populares',
        performer: { id: 2, name: 'María González' },
        created_at: '2024-09-06T09:15:00Z'
    },
    {
        id: 6,
        type: 'EXIT',
        product: { id: 6, name: 'Webcam HD 1080p', sku: 'WEB-HD-001' },
        warehouse: { id: 1, name: 'Almacén Central' },
        quantity: -2,
        previous_stock: 8,
        current_stock: 6,
        reference_type: 'INTERNAL_USE',
        reference_id: 5001,
        notes: 'Uso interno para oficinas',
        performer: { id: 4, name: 'Ana Ruiz' },
        created_at: '2024-09-05T15:30:00Z'
    }
];

// Funciones de utilidad
export const getMovementById = (id: number): IInventoryMovement | undefined => {
    return mockMovements.find(movement => movement.id === id);
};

export const getMovementsByType = (type: MovementType): IInventoryMovement[] => {
    return mockMovements.filter(movement => movement.type === type);
};

export const getMovementsByWarehouse = (warehouseId: number): IInventoryMovement[] => {
    return mockMovements.filter(movement => movement.warehouse?.id === warehouseId);
};

export const getMovementStats = (): MovementStats => {
    const totalMovements = mockMovements.length;
    const totalEntries = mockMovements.filter(m => m.quantity > 0).length;
    const totalExits = mockMovements.filter(m => m.quantity < 0).length;
    const uniqueProducts = new Set(mockMovements.map(m => m.product?.id)).size;
    const lastMovement = mockMovements.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return {
        totalMovements,
        totalEntries,
        totalExits,
        uniqueProducts,
        lastMovement
    };
};

export const getWarehouses = () => [
    { id: 1, name: 'Almacén Central' },
    { id: 2, name: 'Almacén Norte' },
    { id: 3, name: 'Almacén Sur' }
];
