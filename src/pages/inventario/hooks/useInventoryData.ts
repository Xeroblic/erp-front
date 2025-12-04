import { useState, useMemo } from 'react';
import {
	mockMovements,
	mockItems,
	mockStockLevels,
	mockStockAlerts,
	mockStatistics,
	MockInventoryMovement,
	MockInventoryItem,
	MockStockLevel,
	MockStockAlert,
	MockInventoryStatistics,
} from '../data/mockData';

export const useInventoryData = () => {
	const [loading, setLoading] = useState(false);

	// Simulamos delay para mostrar que está "cargando"
	const simulateLoading = (duration: number = 1000) => {
		setLoading(true);
		setTimeout(() => setLoading(false), duration);
	};

	// Obtener movimientos con filtros
	const getMovements = (filters?: {
		type?: string;
		dateFrom?: string;
		dateTo?: string;
		productId?: number;
		warehouseId?: number;
	}): MockInventoryMovement[] => {
		let filteredMovements = [...mockMovements];

		if (filters) {
			if (filters.type && filters.type !== 'ALL') {
				filteredMovements = filteredMovements.filter(
					(m) => m.movement_type === filters.type,
				);
			}
			if (filters.productId) {
				filteredMovements = filteredMovements.filter(
					(m) => m.product.id === filters.productId,
				);
			}
			if (filters.warehouseId) {
				filteredMovements = filteredMovements.filter(
					(m) => m.warehouse.id === filters.warehouseId,
				);
			}
			if (filters.dateFrom) {
				filteredMovements = filteredMovements.filter(
					(m) => new Date(m.movement_date) >= new Date(filters.dateFrom!),
				);
			}
			if (filters.dateTo) {
				filteredMovements = filteredMovements.filter(
					(m) => new Date(m.movement_date) <= new Date(filters.dateTo!),
				);
			}
		}

		return filteredMovements.sort(
			(a, b) => new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime(),
		);
	};

	// Obtener items con filtros
	const getItems = (filters?: {
		status?: string;
		warehouseId?: number;
		productId?: number;
		lowStock?: boolean;
	}): MockInventoryItem[] => {
		let filteredItems = [...mockItems];

		if (filters) {
			if (filters.status && filters.status !== 'ALL') {
				filteredItems = filteredItems.filter((item) => item.status === filters.status);
			}
			if (filters.warehouseId) {
				filteredItems = filteredItems.filter(
					(item) => item.warehouse.id === filters.warehouseId,
				);
			}
			if (filters.productId) {
				filteredItems = filteredItems.filter(
					(item) => item.product.id === filters.productId,
				);
			}
			if (filters.lowStock) {
				filteredItems = filteredItems.filter(
					(item) => item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK',
				);
			}
		}

		return filteredItems.sort((a, b) => a.product.name.localeCompare(b.product.name));
	};

	// Obtener niveles de stock con filtros
	const getStockLevels = (filters?: {
		status?: string;
		warehouseId?: number;
		productId?: number;
	}): MockStockLevel[] => {
		let filteredLevels = [...mockStockLevels];

		if (filters) {
			if (filters.status && filters.status !== 'ALL') {
				filteredLevels = filteredLevels.filter((level) => level.status === filters.status);
			}
			if (filters.warehouseId) {
				filteredLevels = filteredLevels.filter(
					(level) => level.warehouse.id === filters.warehouseId,
				);
			}
			if (filters.productId) {
				filteredLevels = filteredLevels.filter(
					(level) => level.product.id === filters.productId,
				);
			}
		}

		return filteredLevels.sort((a, b) => a.product.name.localeCompare(b.product.name));
	};

	// Obtener alertas de stock
	const getStockAlerts = (level?: string): MockStockAlert[] => {
		let filteredAlerts = [...mockStockAlerts];

		if (level && level !== 'ALL') {
			filteredAlerts = filteredAlerts.filter((alert) => alert.alert_level === level);
		}

		return filteredAlerts.sort(
			(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
		);
	};

	// Obtener estadísticas
	const getStatistics = (): MockInventoryStatistics => {
		return mockStatistics;
	};

	// Crear un movimiento (simulado)
	const createMovement = async (movementData: Partial<MockInventoryMovement>) => {
		simulateLoading(500);

		// Simular creación
		const newMovement: MockInventoryMovement = {
			...(movementData as MockInventoryMovement),
			id: Math.max(...mockMovements.map((m) => m.id)) + 1,
			movement_date: movementData.movement_date || new Date().toISOString(),
			created_by: movementData.created_by || 'Usuario Actual',
		};

		// En una app real, esto iría al backend
		mockMovements.unshift(newMovement);

		return newMovement;
	};

	// Ajustar stock (simulado)
	const adjustStock = async (adjustmentData: {
		productId: number;
		warehouseId: number;
		quantity: number;
		reason: string;
	}) => {
		simulateLoading(500);

		// Simular ajuste
		const itemIndex = mockItems.findIndex(
			(item) =>
				item.product_id === adjustmentData.productId &&
				item.warehouse_id === adjustmentData.warehouseId,
		);

		if (itemIndex !== -1) {
			mockItems[itemIndex].current_stock += adjustmentData.quantity;
			mockItems[itemIndex].available_stock += adjustmentData.quantity;
			mockItems[itemIndex].last_updated = new Date().toISOString();

			// Actualizar estado
			if (mockItems[itemIndex].current_stock === 0) {
				mockItems[itemIndex].status = 'OUT_OF_STOCK';
			} else if (mockItems[itemIndex].current_stock < 10) {
				mockItems[itemIndex].status = 'LOW_STOCK';
			} else {
				mockItems[itemIndex].status = 'IN_STOCK';
			}
		}

		// Crear movimiento de ajuste
		const product = mockItems[itemIndex]?.product;
		const warehouse = mockItems[itemIndex]?.warehouse;

		if (product && warehouse) {
			await createMovement({
				movement_type: 'ADJUSTMENT',
				product,
				warehouse,
				quantity: adjustmentData.quantity,
				reference: `ADJ-${Date.now()}`,
				notes: adjustmentData.reason,
			});
		}

		return true;
	};

	return {
		loading,
		getMovements,
		getItems,
		getStockLevels,
		getStockAlerts,
		getStatistics,
		createMovement,
		adjustStock,
		simulateLoading,
	};
};
