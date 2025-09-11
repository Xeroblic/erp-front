import { useState } from 'react';

// Datos mock consolidados
export interface MockInventoryData {
    movimientos: any[];
    stockItems: any[];
    transferencias: any[];
    estadisticas: any;
    bodegas: any[];
    productos: any[];
}

// Mock data para el inventario consolidado
const MOCK_BODEGAS = [
    { id: 1, name: 'Bodega Central', code: 'BC01', location: 'Centro' },
    { id: 2, name: 'Bodega Norte', code: 'BN02', location: 'Zona Norte' },
    { id: 3, name: 'Bodega Sur', code: 'BS03', location: 'Zona Sur' },
    { id: 4, name: 'Bodega Distribución', code: 'BD04', location: 'Distribución' },
];

const MOCK_PRODUCTOS = [
    { id: 1, name: 'Laptop Dell XPS 13', sku: 'DELL-XPS-001', category: 'Laptops' },
    { id: 2, name: 'Monitor Samsung 24"', sku: 'SAM-MON-24', category: 'Monitores' },
    { id: 3, name: 'Mouse Logitech MX Master', sku: 'LOG-MOU-01', category: 'Periféricos' },
    { id: 4, name: 'Teclado Mecánico', sku: 'MEC-KEY-01', category: 'Periféricos' },
    { id: 5, name: 'Impresora HP LaserJet', sku: 'HP-PRT-001', category: 'Impresoras' },
];

const MOCK_MOVIMIENTOS = [
    {
        id: 1,
        movement_date: '2025-01-10T10:30:00Z',
        movement_type: 'IN',
        product: MOCK_PRODUCTOS[0],
        warehouse: MOCK_BODEGAS[0],
        quantity: 10,
        reference: 'PO-2025-001',
        notes: 'Compra de laptops nuevas',
        created_by: 'Juan Pérez',
        unit_cost: 1200000,
        total_cost: 12000000,
    },
    {
        id: 2,
        movement_date: '2025-01-10T11:15:00Z',
        movement_type: 'OUT',
        product: MOCK_PRODUCTOS[1],
        warehouse: MOCK_BODEGAS[1],
        quantity: -2,
        reference: 'SALE-2025-001',
        notes: 'Venta a cliente corporativo',
        created_by: 'María García',
    },
    {
        id: 3,
        movement_date: '2025-01-10T14:20:00Z',
        movement_type: 'TRANSFER',
        product: MOCK_PRODUCTOS[2],
        warehouse: MOCK_BODEGAS[0],
        quantity: -5,
        reference: 'TRF-2025-001-OUT',
        notes: 'Transferencia a Bodega Norte',
        created_by: 'Carlos Silva',
    },
    {
        id: 4,
        movement_date: '2025-01-10T14:25:00Z',
        movement_type: 'TRANSFER',
        product: MOCK_PRODUCTOS[2],
        warehouse: MOCK_BODEGAS[1],
        quantity: 5,
        reference: 'TRF-2025-001-IN',
        notes: 'Recepción desde Bodega Central',
        created_by: 'Ana López',
    },
    {
        id: 5,
        movement_date: '2025-01-10T16:00:00Z',
        movement_type: 'ADJUSTMENT',
        product: MOCK_PRODUCTOS[3],
        warehouse: MOCK_BODEGAS[2],
        quantity: -3,
        reference: 'ADJ-2025-001',
        notes: 'Ajuste por inventario físico - productos dañados',
        created_by: 'Roberto Díaz',
    },
];

const MOCK_STOCK_ITEMS = [
    {
        id: 1,
        product_id: 1,
        warehouse_id: 1,
        product: MOCK_PRODUCTOS[0],
        warehouse: MOCK_BODEGAS[0],
        current_stock: 15,
        available_stock: 12,
        reserved_stock: 3,
        min_stock: 5,
        max_stock: 50,
        status: 'IN_STOCK',
        last_updated: '2025-01-10T16:30:00Z',
        unit_cost: 1200000,
        total_value: 18000000,
    },
    {
        id: 2,
        product_id: 2,
        warehouse_id: 1,
        product: MOCK_PRODUCTOS[1],
        warehouse: MOCK_BODEGAS[0],
        current_stock: 8,
        available_stock: 8,
        reserved_stock: 0,
        min_stock: 3,
        max_stock: 20,
        status: 'IN_STOCK',
        last_updated: '2025-01-10T15:20:00Z',
        unit_cost: 350000,
        total_value: 2800000,
    },
    {
        id: 3,
        product_id: 3,
        warehouse_id: 2,
        product: MOCK_PRODUCTOS[2],
        warehouse: MOCK_BODEGAS[1],
        current_stock: 2,
        available_stock: 2,
        reserved_stock: 0,
        min_stock: 5,
        max_stock: 30,
        status: 'LOW_STOCK',
        last_updated: '2025-01-10T14:25:00Z',
        unit_cost: 85000,
        total_value: 170000,
    },
    {
        id: 4,
        product_id: 4,
        warehouse_id: 2,
        product: MOCK_PRODUCTOS[3],
        warehouse: MOCK_BODEGAS[2],
        current_stock: 0,
        available_stock: 0,
        reserved_stock: 0,
        min_stock: 2,
        max_stock: 15,
        status: 'OUT_OF_STOCK',
        last_updated: '2025-01-10T16:00:00Z',
        unit_cost: 120000,
        total_value: 0,
    },
    {
        id: 5,
        product_id: 5,
        warehouse_id: 3,
        product: MOCK_PRODUCTOS[4],
        warehouse: MOCK_BODEGAS[2],
        current_stock: 4,
        available_stock: 3,
        reserved_stock: 1,
        min_stock: 2,
        max_stock: 10,
        status: 'IN_STOCK',
        last_updated: '2025-01-09T09:00:00Z',
        unit_cost: 450000,
        total_value: 1800000,
    },
];

const MOCK_TRANSFERENCIAS = [
    {
        id: 1,
        transfer_number: 'TRF-2025-001',
        from_warehouse_id: 1,
        to_warehouse_id: 2,
        from_warehouse: MOCK_BODEGAS[0],
        to_warehouse: MOCK_BODEGAS[1],
        status: 'COMPLETED',
        estado: 'completada',
        origen: MOCK_BODEGAS[0].name,
        destino: MOCK_BODEGAS[1].name,
        created_date: '2025-01-10T14:00:00Z',
        completed_date: '2025-01-10T14:30:00Z',
        fecha: '2025-01-10T14:00:00Z',
        created_by: 'Carlos Silva',
        items: [
            {
                product: MOCK_PRODUCTOS[2],
                quantity: 5,
                unit_cost: 85000,
            },
        ],
    },
    {
        id: 2,
        transfer_number: 'TRF-2025-002',
        from_warehouse_id: 2,
        to_warehouse_id: 3,
        from_warehouse: MOCK_BODEGAS[1],
        to_warehouse: MOCK_BODEGAS[2],
        status: 'PENDING',
        estado: 'pendiente',
        origen: MOCK_BODEGAS[1].name,
        destino: MOCK_BODEGAS[2].name,
        created_date: '2025-01-11T09:00:00Z',
        fecha: '2025-01-11T09:00:00Z',
        created_by: 'Ana López',
        items: [
            {
                product: MOCK_PRODUCTOS[1],
                quantity: 2,
                unit_cost: 350000,
            },
        ],
    },
];

// Mock data para garantías
const MOCK_GARANTIAS = [
    {
        id: 1,
        product: MOCK_PRODUCTOS[0], // Laptop Dell XPS 13
        product_id: 1,
        warranty_type: 'Fabricante',
        start_date: '2025-01-10T00:00:00Z',
        end_date: '2025-07-10T00:00:00Z', // 6 meses
        status: 'Activa',
        claim_date: null,
        resolution_date: null,
        notes: 'Garantía estándar de 6 meses por defectos de fabricación. Cubre hardware y software.',
        created_by: 'Juan Pérez',
        created_at: '2025-01-10T10:30:00Z',
        updated_at: '2025-01-10T10:30:00Z',
    },
    {
        id: 2,
        product: MOCK_PRODUCTOS[1], // Monitor Samsung 24"
        product_id: 2,
        warranty_type: 'Extendida',
        start_date: '2025-01-05T00:00:00Z',
        end_date: '2025-07-05T00:00:00Z', // 6 meses
        status: 'Activa',
        claim_date: null,
        resolution_date: null,
        notes: 'Garantía extendida con cobertura completa incluye pixels muertos y retroiluminación.',
        created_by: 'María García',
        created_at: '2025-01-05T14:20:00Z',
        updated_at: '2025-01-05T14:20:00Z',
    },
    {
        id: 3,
        product: MOCK_PRODUCTOS[2], // Mouse Logitech MX Master
        product_id: 3,
        warranty_type: 'Fabricante',
        start_date: '2024-12-15T00:00:00Z',
        end_date: '2025-06-15T00:00:00Z', // 6 meses
        status: 'Usada',
        claim_date: '2025-01-08T00:00:00Z',
        resolution_date: '2025-01-09T00:00:00Z',
        notes: 'Problema con el sensor óptico resuelto. Producto reemplazado bajo garantía exitosamente.',
        created_by: 'Carlos Silva',
        created_at: '2024-12-15T09:15:00Z',
        updated_at: '2025-01-09T14:30:00Z',
    },
    {
        id: 4,
        product: MOCK_PRODUCTOS[3], // Teclado Mecánico
        product_id: 4,
        warranty_type: 'Fabricante',
        start_date: '2024-08-01T00:00:00Z',
        end_date: '2025-02-01T00:00:00Z', // 6 meses
        status: 'Expirada',
        claim_date: null,
        resolution_date: null,
        notes: 'Garantía vencida sin reclamos. Producto funcionó perfectamente durante todo el período.',
        created_by: 'Roberto Díaz',
        created_at: '2024-08-01T16:45:00Z',
        updated_at: '2025-02-01T00:00:01Z',
    },
    {
        id: 5,
        product: MOCK_PRODUCTOS[4], // Impresora HP LaserJet
        product_id: 5,
        warranty_type: 'Comercial',
        start_date: '2025-01-12T00:00:00Z',
        end_date: '2025-07-12T00:00:00Z', // 6 meses
        status: 'Activa',
        claim_date: null,
        resolution_date: null,
        notes: 'Garantía comercial con servicio técnico incluido. Mantenimiento preventivo cada 2 meses.',
        created_by: 'Ana López',
        created_at: '2025-01-12T08:15:00Z',
        updated_at: '2025-01-12T08:15:00Z',
    },
    {
        id: 6,
        product: MOCK_PRODUCTOS[0], // Laptop Dell XPS 13 (segunda unidad)
        product_id: 1,
        warranty_type: 'Extendida',
        start_date: '2024-12-20T00:00:00Z',
        end_date: '2025-06-20T00:00:00Z', // 6 meses
        status: 'Anulada',
        claim_date: null,
        resolution_date: null,
        notes: 'Garantía anulada por daño intencional del usuario. Líquidos derramados sobre el teclado.',
        created_by: 'Pedro Martinez',
        created_at: '2024-12-20T11:30:00Z',
        updated_at: '2025-01-15T09:45:00Z',
    },
    {
        id: 7,
        product: MOCK_PRODUCTOS[1], // Monitor Samsung 24" (segunda unidad)
        product_id: 2,
        warranty_type: 'Fabricante',
        start_date: '2024-12-01T00:00:00Z',
        end_date: '2025-06-01T00:00:00Z', // 6 meses
        status: 'Activa',
        claim_date: null,
        resolution_date: null,
        notes: 'Garantía activa próxima a vencer. Producto en perfecto estado de funcionamiento.',
        created_by: 'Sofia Ruiz',
        created_at: '2024-12-01T13:20:00Z',
        updated_at: '2024-12-01T13:20:00Z',
    },
    {
        id: 8,
        product: MOCK_PRODUCTOS[2], // Mouse Logitech MX Master (tercera unidad)
        product_id: 3,
        warranty_type: 'Extendida',
        start_date: '2025-02-01T00:00:00Z',
        end_date: '2025-08-01T00:00:00Z', // 6 meses
        status: 'Activa',
        claim_date: null,
        resolution_date: null,
        notes: 'Garantía extendida premium con reemplazo inmediato incluido. Servicio 24/7.',
        created_by: 'Luis González',
        created_at: '2025-02-01T16:30:00Z',
        updated_at: '2025-02-01T16:30:00Z',
    },
    {
        id: 9,
        product: MOCK_PRODUCTOS[3], // Teclado Mecánico (segunda unidad)
        product_id: 4,
        warranty_type: 'Comercial',
        start_date: '2025-01-15T00:00:00Z',
        end_date: '2025-07-15T00:00:00Z', // 6 meses
        status: 'Activa',
        claim_date: null,
        resolution_date: null,
        notes: 'Garantía comercial con limpieza y mantenimiento incluido cada mes.',
        created_by: 'Elena Rodriguez',
        created_at: '2025-01-15T12:45:00Z',
        updated_at: '2025-01-15T12:45:00Z',
    },
];

const MOCK_ESTADISTICAS = {
    totalProductos: MOCK_PRODUCTOS.length,
    totalBodegas: MOCK_BODEGAS.length,
    totalMovimientos: MOCK_MOVIMIENTOS.length,
    totalTransferencias: MOCK_TRANSFERENCIAS.length,
    stockTotal: MOCK_STOCK_ITEMS.reduce((sum, item) => sum + item.current_stock, 0),
    valorTotal: MOCK_STOCK_ITEMS.reduce((sum, item) => sum + item.total_value, 0),
    productosEnStock: MOCK_STOCK_ITEMS.filter(item => item.status === 'IN_STOCK').length,
    productosStockBajo: MOCK_STOCK_ITEMS.filter(item => item.status === 'LOW_STOCK').length,
    productosAgotados: MOCK_STOCK_ITEMS.filter(item => item.status === 'OUT_OF_STOCK').length,
    movimientosEntrada: MOCK_MOVIMIENTOS.filter(mov => mov.movement_type === 'IN' || mov.quantity > 0).length,
    movimientosSalida: MOCK_MOVIMIENTOS.filter(mov => mov.movement_type === 'OUT' || mov.quantity < 0).length,
    transferenciasActivas: MOCK_TRANSFERENCIAS.filter(t => t.status === 'PENDING').length,
    ultimaActualizacion: new Date().toISOString(),
};

/**
 * Hook consolidado para gestión de datos de inventario
 * Integra todas las funcionalidades de CU014 con datos mock mejorados
 */
export const useInventoryData = () => {
    const [loading, setLoading] = useState(false);

    // Función para simular delay de carga
    const simulateLoading = (ms: number = 800) => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                setLoading(false);
                resolve(true);
            }, ms);
        });
    };

    // Obtener movimientos con filtros
    const getMovements = async (filtros: any = {}) => {
        await simulateLoading();

        let movimientos = [...MOCK_MOVIMIENTOS];

        // Aplicar filtros si existen
        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase();
            movimientos = movimientos.filter(mov =>
                mov.product?.name.toLowerCase().includes(busqueda) ||
                mov.reference?.toLowerCase().includes(busqueda) ||
                mov.notes?.toLowerCase().includes(busqueda)
            );
        }

        if (filtros.bodega) {
            movimientos = movimientos.filter(mov => mov.warehouse?.id.toString() === filtros.bodega);
        }

        if (filtros.tipoMovimiento) {
            movimientos = movimientos.filter(mov => mov.movement_type === filtros.tipoMovimiento);
        }

        if (filtros.fechaDesde) {
            movimientos = movimientos.filter(mov => new Date(mov.movement_date) >= new Date(filtros.fechaDesde));
        }

        if (filtros.fechaHasta) {
            movimientos = movimientos.filter(mov => new Date(mov.movement_date) <= new Date(filtros.fechaHasta));
        }

        return movimientos.sort((a, b) => new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime());
    };

    // Obtener items de stock
    const getItems = async (filtros: any = {}) => {
        await simulateLoading();

        let items = [...MOCK_STOCK_ITEMS];

        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase();
            items = items.filter(item =>
                item.product?.name.toLowerCase().includes(busqueda) ||
                item.product?.sku.toLowerCase().includes(busqueda)
            );
        }

        if (filtros.bodega) {
            items = items.filter(item => item.warehouse_id.toString() === filtros.bodega);
        }

        if (filtros.estado) {
            items = items.filter(item => item.status === filtros.estado);
        }

        return items;
    };

    // Obtener niveles de stock con alertas
    const getStockLevels = async () => {
        await simulateLoading();
        return MOCK_STOCK_ITEMS.map(item => ({
            ...item,
            alert_level: item.current_stock <= item.min_stock ? 'HIGH' :
                item.current_stock <= item.min_stock * 1.5 ? 'MEDIUM' : 'LOW',
        }));
    };

    // Obtener estadísticas consolidadas
    const getStatistics = async () => {
        await simulateLoading();
        return {
            ...MOCK_ESTADISTICAS,
            ultimaActualizacion: new Date().toISOString(),
        };
    };

    // Crear un movimiento de inventario
    const createMovement = async (movementData: any) => {
        await simulateLoading();

        const newMovement = {
            id: Math.max(...MOCK_MOVIMIENTOS.map(m => m.id)) + 1,
            movement_date: new Date().toISOString(),
            created_by: 'Usuario Actual',
            ...movementData,
        };

        // En una implementación real, esto se enviaría al backend
        MOCK_MOVIMIENTOS.unshift(newMovement);

        console.log('Movimiento creado:', newMovement);
        return newMovement;
    };

    // Ajustar stock de un producto
    const adjustStock = async (adjustmentData: {
        productId: number;
        warehouseId: number;
        newQuantity: number;
        reason: string;
        notes?: string;
    }) => {
        await simulateLoading();

        // Buscar el item de stock
        const stockItemIndex = MOCK_STOCK_ITEMS.findIndex(
            item => item.product_id === adjustmentData.productId &&
                item.warehouse_id === adjustmentData.warehouseId
        );

        if (stockItemIndex !== -1) {
            const currentStock = MOCK_STOCK_ITEMS[stockItemIndex].current_stock;
            const difference = adjustmentData.newQuantity - currentStock;

            // Actualizar stock
            MOCK_STOCK_ITEMS[stockItemIndex].current_stock = adjustmentData.newQuantity;
            MOCK_STOCK_ITEMS[stockItemIndex].available_stock = adjustmentData.newQuantity;
            MOCK_STOCK_ITEMS[stockItemIndex].last_updated = new Date().toISOString();

            // Actualizar estado
            const item = MOCK_STOCK_ITEMS[stockItemIndex];
            if (item.current_stock === 0) {
                item.status = 'OUT_OF_STOCK';
            } else if (item.current_stock <= item.min_stock) {
                item.status = 'LOW_STOCK';
            } else {
                item.status = 'IN_STOCK';
            }

            // Crear movimiento de ajuste
            await createMovement({
                movement_type: 'ADJUSTMENT',
                product: item.product,
                warehouse: item.warehouse,
                quantity: difference,
                reference: `ADJ-${Date.now()}`,
                notes: `Ajuste de stock: ${adjustmentData.reason}. ${adjustmentData.notes || ''}`,
            });
        }

        return true;
    };

    // Transferir stock entre bodegas
    const transferStock = async (transferData: {
        productId: number;
        fromWarehouseId: number;
        toWarehouseId: number;
        quantity: number;
        reason: string;
    }) => {
        await simulateLoading();

        const product = MOCK_PRODUCTOS.find(p => p.id === transferData.productId);
        const fromWarehouse = MOCK_BODEGAS.find(w => w.id === transferData.fromWarehouseId);
        const toWarehouse = MOCK_BODEGAS.find(w => w.id === transferData.toWarehouseId);

        if (product && fromWarehouse && toWarehouse) {
            const transferId = Date.now();

            // Crear movimiento de salida
            await createMovement({
                movement_type: 'TRANSFER',
                product,
                warehouse: fromWarehouse,
                quantity: -transferData.quantity,
                reference: `TRF-${transferId}-OUT`,
                notes: `Transferencia hacia ${toWarehouse.name}: ${transferData.reason}`,
            });

            // Crear movimiento de entrada
            await createMovement({
                movement_type: 'TRANSFER',
                product,
                warehouse: toWarehouse,
                quantity: transferData.quantity,
                reference: `TRF-${transferId}-IN`,
                notes: `Recepción desde ${fromWarehouse.name}: ${transferData.reason}`,
            });

            // Actualizar stocks
            const fromItem = MOCK_STOCK_ITEMS.find(
                item => item.product_id === transferData.productId &&
                    item.warehouse_id === transferData.fromWarehouseId
            );
            const toItem = MOCK_STOCK_ITEMS.find(
                item => item.product_id === transferData.productId &&
                    item.warehouse_id === transferData.toWarehouseId
            );

            if (fromItem) {
                fromItem.current_stock -= transferData.quantity;
                fromItem.available_stock -= transferData.quantity;
                fromItem.last_updated = new Date().toISOString();
            }

            if (toItem) {
                toItem.current_stock += transferData.quantity;
                toItem.available_stock += transferData.quantity;
                toItem.last_updated = new Date().toISOString();
            }
        }

        return true;
    };

    // Obtener transferencias
    const getTransfers = async (filtros: any = {}) => {
        await simulateLoading();
        return [...MOCK_TRANSFERENCIAS];
    };

    // CU014.2 - Editar movimiento de stock
    const editMovement = async (movementId: number, updatedData: {
        product_id: number;
        movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
        warehouse_id: number;
        quantity: number;
        reference?: string;
        notes?: string;
        unit_cost?: number;
        serial_number?: string;
    }) => {
        await simulateLoading();

        // Buscar el movimiento original
        const movementIndex = MOCK_MOVIMIENTOS.findIndex(m => m.id === movementId);
        if (movementIndex === -1) {
            throw new Error('Movimiento no encontrado o no puede editarse');
        }

        const originalMovement = MOCK_MOVIMIENTOS[movementIndex];

        // Validar que el movimiento no esté bloqueado
        // (en un sistema real, esto podría verificar ventas cerradas, etc.)
        if (originalMovement.reference?.includes('SALE-') && originalMovement.movement_type === 'OUT') {
            throw new Error('No se puede editar: el movimiento está asociado a una venta cerrada');
        }

        // Obtener productos y bodegas
        const newProduct = MOCK_PRODUCTOS.find(p => p.id === updatedData.product_id);
        const newWarehouse = MOCK_BODEGAS.find(b => b.id === updatedData.warehouse_id);

        if (!newProduct || !newWarehouse) {
            throw new Error('Producto o bodega no válidos');
        }

        // Validaciones de negocio
        if (updatedData.quantity <= 0) {
            throw new Error('La cantidad debe ser mayor a 0');
        }

        // PASO CRÍTICO: Revertir el efecto del movimiento anterior en el stock
        const originalStockItem = MOCK_STOCK_ITEMS.find(
            item => item.product_id === originalMovement.product.id &&
                item.warehouse_id === originalMovement.warehouse.id
        );

        if (originalStockItem) {
            // Revertir el movimiento anterior
            if (originalMovement.movement_type === 'IN' || originalMovement.quantity > 0) {
                // Si era entrada, la restamos para revertir
                originalStockItem.current_stock -= Math.abs(originalMovement.quantity);
                originalStockItem.available_stock -= Math.abs(originalMovement.quantity);
            } else {
                // Si era salida, la sumamos para revertir
                originalStockItem.current_stock += Math.abs(originalMovement.quantity);
                originalStockItem.available_stock += Math.abs(originalMovement.quantity);
            }
        }

        // Aplicar el nuevo movimiento
        let finalQuantity = updatedData.quantity;
        if (updatedData.movement_type === 'OUT' && finalQuantity > 0) {
            finalQuantity = -finalQuantity; // Convertir a negativo para salidas
        }

        // Buscar o crear el stock item para el nuevo producto/bodega
        let newStockItem = MOCK_STOCK_ITEMS.find(
            item => item.product_id === updatedData.product_id &&
                item.warehouse_id === updatedData.warehouse_id
        );

        if (!newStockItem) {
            // Crear nuevo stock item si no existe
            newStockItem = {
                id: MOCK_STOCK_ITEMS.length + 1,
                product_id: updatedData.product_id,
                warehouse_id: updatedData.warehouse_id,
                product: newProduct,
                warehouse: newWarehouse,
                current_stock: 0,
                available_stock: 0,
                reserved_stock: 0,
                min_stock: 5,
                max_stock: 100,
                status: 'OUT_OF_STOCK' as const,
                last_updated: new Date().toISOString(),
                unit_cost: updatedData.unit_cost || 0,
                total_value: 0
            };
            MOCK_STOCK_ITEMS.push(newStockItem);
        }

        // Validar stock suficiente para salidas
        if ((updatedData.movement_type === 'OUT' || updatedData.movement_type === 'TRANSFER') &&
            finalQuantity < 0 &&
            newStockItem.current_stock < Math.abs(finalQuantity)) {
            throw new Error('Stock insuficiente para realizar la salida');
        }

        // Aplicar el nuevo movimiento al stock
        newStockItem.current_stock += finalQuantity;
        newStockItem.available_stock += finalQuantity;

        // Actualizar estado del stock
        if (newStockItem.current_stock <= 0) {
            newStockItem.status = 'OUT_OF_STOCK';
        } else if (newStockItem.current_stock <= newStockItem.min_stock) {
            newStockItem.status = 'LOW_STOCK';
        } else {
            newStockItem.status = 'IN_STOCK';
        }

        // Recalcular valor total
        newStockItem.total_value = newStockItem.current_stock * newStockItem.unit_cost;
        newStockItem.last_updated = new Date().toISOString();

        // Actualizar stocks de la bodega original si cambió
        if (originalStockItem && originalStockItem.id !== newStockItem.id) {
            // Actualizar estado de la bodega original
            if (originalStockItem.current_stock <= 0) {
                originalStockItem.status = 'OUT_OF_STOCK';
            } else if (originalStockItem.current_stock <= originalStockItem.min_stock) {
                originalStockItem.status = 'LOW_STOCK';
            } else {
                originalStockItem.status = 'IN_STOCK';
            }
            originalStockItem.total_value = originalStockItem.current_stock * originalStockItem.unit_cost;
            originalStockItem.last_updated = new Date().toISOString();
        }

        // Actualizar el movimiento con los nuevos datos
        const updatedMovement = {
            ...originalMovement,
            product: newProduct,
            warehouse: newWarehouse,
            movement_type: updatedData.movement_type,
            quantity: finalQuantity,
            reference: updatedData.reference || originalMovement.reference,
            notes: updatedData.notes || originalMovement.notes,
            unit_cost: updatedData.unit_cost || originalMovement.unit_cost,
            total_cost: updatedData.unit_cost ? Math.abs(finalQuantity) * updatedData.unit_cost : originalMovement.total_cost,
            updated_at: new Date().toISOString(),
            updated_by: 'Usuario Actual', // En el sistema real vendría del contexto de auth
        };

        // Asignar usando any para evitar problemas de tipado con campos opcionales
        (MOCK_MOVIMIENTOS as any)[movementIndex] = updatedMovement;

        return MOCK_MOVIMIENTOS[movementIndex];
    };

    // CU014.3 - Eliminar movimiento de stock
    const deleteMovement = async (movementId: number) => {
        await simulateLoading();

        // Buscar el movimiento a eliminar
        const movementIndex = MOCK_MOVIMIENTOS.findIndex(m => m.id === movementId);
        if (movementIndex === -1) {
            throw new Error('Movimiento no encontrado');
        }

        const movementToDelete = MOCK_MOVIMIENTOS[movementIndex];

        // Validar que el movimiento se puede eliminar
        // (movimientos asociados a ventas cerradas no pueden eliminarse)
        if (movementToDelete.reference?.includes('SALE-') && movementToDelete.movement_type === 'OUT') {
            throw new Error('No se puede eliminar: el movimiento está asociado a una venta cerrada');
        }

        // Validar que no esté referenciado por otros procesos
        // En un sistema real esto verificaría referencias en facturas, órdenes, etc.
        const hasReferences = MOCK_MOVIMIENTOS.some(mov =>
            mov.id !== movementId &&
            mov.reference === movementToDelete.reference &&
            mov.reference?.includes('TRF-') // Transferencias tienen movimientos relacionados
        );

        if (hasReferences && movementToDelete.reference?.includes('TRF-')) {
            throw new Error('No se puede eliminar: el movimiento es parte de una transferencia con movimientos relacionados');
        }

        // PASO CRÍTICO: Revertir el efecto del movimiento en el stock
        const stockItem = MOCK_STOCK_ITEMS.find(
            item => item.product_id === movementToDelete.product.id &&
                item.warehouse_id === movementToDelete.warehouse.id
        );

        if (stockItem) {
            // Revertir el movimiento
            if (movementToDelete.movement_type === 'IN' || movementToDelete.quantity > 0) {
                // Si era entrada, restamos para revertir
                const quantityToRevert = Math.abs(movementToDelete.quantity);

                // Validar que no quedaría stock negativo
                if (stockItem.current_stock < quantityToRevert) {
                    throw new Error('No se puede eliminar: la reversión del movimiento resultaría en stock negativo. ' +
                        `Stock actual: ${stockItem.current_stock}, Cantidad a revertir: ${quantityToRevert}`);
                }

                stockItem.current_stock -= quantityToRevert;
                stockItem.available_stock -= quantityToRevert;
            } else {
                // Si era salida, sumamos para revertir
                const quantityToRevert = Math.abs(movementToDelete.quantity);
                stockItem.current_stock += quantityToRevert;
                stockItem.available_stock += quantityToRevert;
            }

            // Actualizar estado del stock después de la reversión
            if (stockItem.current_stock <= 0) {
                stockItem.status = 'OUT_OF_STOCK';
            } else if (stockItem.current_stock <= stockItem.min_stock) {
                stockItem.status = 'LOW_STOCK';
            } else {
                stockItem.status = 'IN_STOCK';
            }

            // Recalcular valor total
            stockItem.total_value = stockItem.current_stock * stockItem.unit_cost;
            stockItem.last_updated = new Date().toISOString();
        }

        // Eliminar el movimiento del array
        MOCK_MOVIMIENTOS.splice(movementIndex, 1);

        return {
            success: true,
            message: 'Movimiento eliminado correctamente',
            revertedQuantity: Math.abs(movementToDelete.quantity),
            revertedProduct: movementToDelete.product.name,
            revertedWarehouse: movementToDelete.warehouse.name
        };
    };

    // ===============================
    // FUNCIONES DE GARANTÍAS
    // ===============================

    // Listar garantías con filtros
    const getWarranties = async (filtros: any = {}) => {
        await simulateLoading();

        let warranties = [...MOCK_GARANTIAS];

        // Aplicar filtros
        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase();
            warranties = warranties.filter(warranty =>
                warranty.product.name.toLowerCase().includes(busqueda) ||
                warranty.warranty_type.toLowerCase().includes(busqueda) ||
                warranty.notes?.toLowerCase().includes(busqueda)
            );
        }

        if (filtros.producto) {
            warranties = warranties.filter(warranty => warranty.product.id === parseInt(filtros.producto));
        }

        if (filtros.tipoGarantia) {
            warranties = warranties.filter(warranty => warranty.warranty_type === filtros.tipoGarantia);
        }

        if (filtros.estado) {
            warranties = warranties.filter(warranty => warranty.status === filtros.estado);
        }

        if (filtros.fechaDesde) {
            warranties = warranties.filter(warranty =>
                new Date(warranty.start_date) >= new Date(filtros.fechaDesde)
            );
        }

        if (filtros.fechaHasta) {
            warranties = warranties.filter(warranty =>
                new Date(warranty.end_date) <= new Date(filtros.fechaHasta)
            );
        }

        return warranties;
    };

    // Crear nueva garantía
    const createWarranty = async (warrantyData: {
        product_id: number;
        warranty_type: string;
        start_date: string;
        end_date: string;
        status: 'Activa' | 'Expirada' | 'Usada' | 'Anulada';
        claim_date?: string;
        resolution_date?: string;
        notes?: string;
    }) => {
        await simulateLoading();

        // Validaciones
        if (!warrantyData.product_id || !warrantyData.warranty_type ||
            !warrantyData.start_date || !warrantyData.end_date || !warrantyData.status) {
            throw new Error('Campos obligatorios: Producto, Tipo de garantía, Fecha de inicio, Fecha de término, Estado');
        }

        // Validar fechas
        const startDate = new Date(warrantyData.start_date);
        const endDate = new Date(warrantyData.end_date);

        if (startDate > endDate) {
            throw new Error('La fecha de inicio debe ser menor o igual a la fecha de término');
        }

        if (warrantyData.claim_date) {
            const claimDate = new Date(warrantyData.claim_date);
            if (claimDate < startDate || claimDate > endDate) {
                throw new Error('La fecha de reclamo debe estar entre la fecha de inicio y término');
            }
        }

        if (warrantyData.resolution_date && warrantyData.claim_date) {
            const resolutionDate = new Date(warrantyData.resolution_date);
            const claimDate = new Date(warrantyData.claim_date);
            if (resolutionDate < claimDate) {
                throw new Error('La fecha de resolución debe ser mayor o igual a la fecha de reclamo');
            }
        }

        // Validar estado
        const validStatuses = ['Activa', 'Expirada', 'Usada', 'Anulada'];
        if (!validStatuses.includes(warrantyData.status)) {
            throw new Error(`Estado debe ser uno de: ${validStatuses.join(', ')}`);
        }

        // Validar duplicidad
        const duplicate = MOCK_GARANTIAS.find(warranty =>
            warranty.product.id === warrantyData.product_id &&
            warranty.warranty_type === warrantyData.warranty_type &&
            warranty.start_date === warrantyData.start_date &&
            warranty.end_date === warrantyData.end_date
        );

        if (duplicate) {
            throw new Error('Ya existe una garantía con la misma combinación de producto, tipo y fechas');
        }

        // Obtener producto
        const product = MOCK_PRODUCTOS.find(p => p.id === warrantyData.product_id);
        if (!product) {
            throw new Error('Producto no encontrado');
        }

        // Crear nueva garantía
        const newWarranty = {
            id: Math.max(...MOCK_GARANTIAS.map(w => w.id)) + 1,
            product,
            warranty_type: warrantyData.warranty_type,
            start_date: warrantyData.start_date,
            end_date: warrantyData.end_date,
            status: warrantyData.status,
            claim_date: warrantyData.claim_date || null,
            resolution_date: warrantyData.resolution_date || null,
            notes: warrantyData.notes || '',
            created_by: 'Usuario Actual',
            created_at: new Date().toISOString(),
        };

        (MOCK_GARANTIAS as any).push(newWarranty);
        return newWarranty;
    };

    // Editar garantía existente
    const editWarranty = async (warrantyId: number, warrantyData: {
        product_id: number;
        warranty_type: string;
        start_date: string;
        end_date: string;
        status: 'Activa' | 'Expirada' | 'Usada' | 'Anulada';
        claim_date?: string;
        resolution_date?: string;
        notes?: string;
    }) => {
        await simulateLoading();

        // Buscar garantía
        const warrantyIndex = MOCK_GARANTIAS.findIndex(w => w.id === warrantyId);
        if (warrantyIndex === -1) {
            throw new Error('Garantía no encontrada');
        }

        // Aplicar las mismas validaciones que en crear, excluyendo el registro actual
        const duplicate = MOCK_GARANTIAS.find((warranty, index) =>
            index !== warrantyIndex &&
            warranty.product.id === warrantyData.product_id &&
            warranty.warranty_type === warrantyData.warranty_type &&
            warranty.start_date === warrantyData.start_date &&
            warranty.end_date === warrantyData.end_date
        );

        if (duplicate) {
            throw new Error('Ya existe otra garantía con la misma combinación de producto, tipo y fechas');
        }

        const product = MOCK_PRODUCTOS.find(p => p.id === warrantyData.product_id);
        if (!product) {
            throw new Error('Producto no encontrado');
        }

        // Actualizar garantía
        const updatedWarranty = {
            ...MOCK_GARANTIAS[warrantyIndex],
            product,
            warranty_type: warrantyData.warranty_type,
            start_date: warrantyData.start_date,
            end_date: warrantyData.end_date,
            status: warrantyData.status,
            claim_date: warrantyData.claim_date || null,
            resolution_date: warrantyData.resolution_date || null,
            notes: warrantyData.notes || '',
            updated_at: new Date().toISOString(),
            updated_by: 'Usuario Actual',
        };

        (MOCK_GARANTIAS as any)[warrantyIndex] = updatedWarranty;
        return MOCK_GARANTIAS[warrantyIndex];
    };

    // Eliminar garantía
    const deleteWarranty = async (warrantyId: number) => {
        await simulateLoading();

        const warrantyIndex = MOCK_GARANTIAS.findIndex(w => w.id === warrantyId);
        if (warrantyIndex === -1) {
            throw new Error('Garantía no encontrada');
        }

        const warrantyToDelete = MOCK_GARANTIAS[warrantyIndex];

        // Validar si se puede eliminar (políticas de auditoría)
        if (warrantyToDelete.status === 'Usada' && warrantyToDelete.resolution_date) {
            throw new Error('No se puede eliminar: la garantía fue usada y tiene resolución registrada (auditoría)');
        }

        // Eliminar la garantía
        MOCK_GARANTIAS.splice(warrantyIndex, 1);

        return {
            success: true,
            message: 'Garantía eliminada correctamente',
            deletedWarranty: warrantyToDelete.product.name
        };
    };

    return {
        loading,
        // Funciones principales
        getMovements,
        getItems,
        getStockLevels,
        getStatistics,
        getTransfers,
        createMovement,
        editMovement, // CU014.2 - Nueva función para editar movimientos
        deleteMovement, // CU014.3 - Nueva función para eliminar movimientos
        // Funciones de garantías
        getWarranties, // Listar garantías
        createWarranty, // Crear garantía
        editWarranty, // Editar garantía
        deleteWarranty, // Eliminar garantía
        adjustStock,
        transferStock,
        simulateLoading,
        // Datos estáticos
        bodegas: MOCK_BODEGAS,
        productos: MOCK_PRODUCTOS,
    };
};
