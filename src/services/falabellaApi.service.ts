// Servicio para conectar con el backend Laravel que maneja la API de Falabella
//
// 🎯 BACKEND IMPLEMENTADO:
// - 9 endpoints listos para usar
// - Modo mock/real configurable
// - Seguridad HMAC manejada en el backend
// - Sin problemas de CORS
//
// 🚀 ENDPOINTS DISPONIBLES:
// - GET /api/falabella/products
// - GET /api/falabella/inventory-summary
// - GET /api/falabella/low-stock
// - GET /api/falabella/best-sellers
// - Y más...

export interface Product {
	SellerSku: string;
	ShopSku: string;
	Name: string;
	Description: string;
	Brand: string;
	Price: number;
	SalePrice?: number;
	Quantity: number;
	Status: string;
	Images: string[];
	CategoryId: number;
	Attributes: Record<string, any>;
	CreatedAt: string;
	UpdatedAt: string;
}

export interface InventorySummary {
	totalProducts: number;
	totalValue: number;
	lowStockCount: number;
	outOfStockCount: number;
	averagePrice: number;
}

export interface BestSellingProduct {
	product: Product;
	totalSold: number;
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
	message?: string;
	error?: string;
}

class FalabellaBackendService {
	private baseUrl: string;

	constructor() {
		// URL base del backend Laravel - usa la variable VITE_API_URL configurada
		const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
		this.baseUrl = baseApiUrl.replace('/api', ''); // Remover /api si ya está incluido
	}

	private async makeRequest<T>(endpoint: string): Promise<T> {
		const url = `${this.baseUrl}/api/falabella${endpoint}`;

		console.log(`🔄 Petición al backend: ${url}`);

		try {
			// Try multiple possible token storage keys
			const token =
				localStorage.getItem('auth_token') ||
				localStorage.getItem('token') ||
				localStorage.getItem('access_token') ||
				sessionStorage.getItem('auth_token') ||
				sessionStorage.getItem('token');

			const headers: Record<string, string> = {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			};

			// Add authentication header if token exists
			if (token) {
				headers.Authorization = `Bearer ${token}`;
				console.log(`Token encontrado, agregando autorización`);
			} else {
				console.warn(`No se encontró token de autenticación`);
			}

			const response = await fetch(url, {
				method: 'GET',
				headers,
			});

			console.log(`Respuesta del backend:`, {
				status: response.status,
				statusText: response.statusText,
				ok: response.ok,
			});

			if (!response.ok) {
				// Handle 401 specifically
				if (response.status === 401) {
					// Optionally clear invalid tokens
					localStorage.removeItem('auth_token');
					localStorage.removeItem('token');
					sessionStorage.removeItem('auth_token');
					sessionStorage.removeItem('token');
				}
				throw new Error(`Backend Error: ${response.status} ${response.statusText}`);
			}

			const result = (await response.json()) as ApiResponse<T>;

			console.log(`Datos del backend:`, result);

			if (!result.success) {
				throw new Error(result.error || result.message || 'Error en el backend');
			}

			return result.data;
		} catch (error) {
			console.error(`Error conectando con backend:`, {
				error,
				message: error instanceof Error ? error.message : 'Error desconocido',
				url,
			});

			// For 401 errors, use fallback immediately
			if (error instanceof Error && error.message.includes('401')) {
				console.log(`Error de autenticación, usando datos mock temporales...`);
				return this.getMockFallback<T>(endpoint);
			}

			// Si es error de conexión con el backend, usar fallback temporal
			if (error instanceof TypeError && error.message.includes('fetch')) {
				console.log(`🔄 Backend no disponible, usando datos mock temporales...`);
				return this.getMockFallback<T>(endpoint);
			}

			throw error;
		}
	}

	// Fallback temporal si el backend no está disponible
	private getMockFallback<T>(endpoint: string): T {
		console.log(`🎭 Usando datos mock para: ${endpoint}`);

		if (endpoint.includes('/products')) {
			return [
				{
					SellerSku: 'ECO-LAP-001',
					ShopSku: 'FAL123456',
					Name: 'Laptop ASUS VivoBook 15 X1502ZA',
					Description: 'Laptop ASUS VivoBook 15 con procesador Intel Core i5',
					Brand: 'ASUS',
					Price: 599990,
					SalePrice: 549990,
					Quantity: 3,
					Status: 'active',
					Images: ['https://placehold.co/300x300/1F2937/FFFFFF?text=ASUS+Laptop'],
					CategoryId: 1001,
					Attributes: { Color: 'Gris Pizarra', RAM: '8GB', Storage: '256GB SSD' },
					CreatedAt: '2024-01-15T10:00:00Z',
					UpdatedAt: '2024-08-30T15:30:00Z',
				},
				{
					SellerSku: 'ECO-MON-002',
					ShopSku: 'FAL789012',
					Name: 'Monitor Samsung Odyssey G3 24"',
					Description: 'Monitor gaming Samsung 24" curvo Full HD 144Hz',
					Brand: 'Samsung',
					Price: 189990,
					SalePrice: 169990,
					Quantity: 1,
					Status: 'active',
					Images: ['https://placehold.co/300x300/1F2937/FFFFFF?text=Samsung+Monitor'],
					CategoryId: 1002,
					Attributes: { Size: '24"', Resolution: 'Full HD', Type: 'Curvo' },
					CreatedAt: '2024-02-10T09:00:00Z',
					UpdatedAt: '2024-08-29T12:15:00Z',
				},
				{
					SellerSku: 'ECO-KEY-003',
					ShopSku: 'FAL345678',
					Name: 'Teclado Razer BlackWidow V3',
					Description: 'Teclado mecánico gaming con retroiluminación RGB',
					Brand: 'Razer',
					Price: 89990,
					Quantity: 0,
					Status: 'active',
					Images: ['https://placehold.co/300x300/1F2937/FFFFFF?text=Razer+Teclado'],
					CategoryId: 1003,
					Attributes: { Type: 'Mecánico', Backlight: 'RGB Chroma' },
					CreatedAt: '2024-03-05T14:20:00Z',
					UpdatedAt: '2024-08-28T16:45:00Z',
				},
			] as T;
		}

		if (endpoint.includes('/inventory-summary')) {
			return {
				totalProducts: 7,
				totalValue: 2945950,
				lowStockCount: 4,
				outOfStockCount: 1,
				averagePrice: 420850,
			} as T;
		}

		if (endpoint.includes('/low-stock')) {
			return [
				{
					SellerSku: 'ECO-LAP-001',
					Name: 'Laptop ASUS VivoBook 15 X1502ZA',
					Brand: 'ASUS',
					Price: 549990,
					Quantity: 3,
					Status: 'active',
				},
				{
					SellerSku: 'ECO-MON-002',
					Name: 'Monitor Samsung Odyssey G3 24"',
					Brand: 'Samsung',
					Price: 169990,
					Quantity: 1,
					Status: 'active',
				},
				{
					SellerSku: 'ECO-KEY-003',
					Name: 'Teclado Razer BlackWidow V3',
					Brand: 'Razer',
					Price: 89990,
					Quantity: 0,
					Status: 'active',
				},
			] as T;
		}

		if (endpoint.includes('/best-sellers')) {
			return [
				{
					product: {
						SellerSku: 'ECO-LAP-001',
						Name: 'Laptop ASUS VivoBook 15 X1502ZA',
						Brand: 'ASUS',
						Price: 549990,
					},
					totalSold: 6,
				},
				{
					product: {
						SellerSku: 'ECO-MOU-004',
						Name: 'Mouse Logitech G502 HERO',
						Brand: 'Logitech',
						Price: 49990,
					},
					totalSold: 4,
				},
				{
					product: {
						SellerSku: 'ECO-MON-002',
						Name: 'Monitor Samsung Odyssey G3 24"',
						Brand: 'Samsung',
						Price: 169990,
					},
					totalSold: 3,
				},
			] as T;
		}

		return {} as T;
	}

	// Obtener lista de productos
	async getProducts(): Promise<Product[]> {
		return this.makeRequest<Product[]>('/products');
	}

	// Obtener resumen de inventario
	async getInventorySummary(): Promise<InventorySummary> {
		return this.makeRequest<InventorySummary>('/inventory-summary');
	}

	// Obtener productos con stock bajo
	async getLowStockProducts(threshold: number = 5): Promise<Product[]> {
		return this.makeRequest<Product[]>(`/low-stock?threshold=${threshold}`);
	}

	// Obtener productos más vendidos
	async getBestSellingProducts(days: number = 30): Promise<BestSellingProduct[]> {
		return this.makeRequest<BestSellingProduct[]>(`/best-sellers?days=${days}`);
	}

	// Obtener datos de ventas
	async getSalesData(startDate?: string, endDate?: string): Promise<any[]> {
		let endpoint = '/sales';
		const params = new URLSearchParams();

		if (startDate) params.append('start_date', startDate);
		if (endDate) params.append('end_date', endDate);

		if (params.toString()) {
			endpoint += `?${params.toString()}`;
		}

		return this.makeRequest<any[]>(endpoint);
	}

	// Obtener stock de productos
	async getProductStock(): Promise<any[]> {
		return this.makeRequest<any[]>('/stock');
	}

	// Obtener categorías
	async getCategories(): Promise<any[]> {
		return this.makeRequest<any[]>('/categories');
	}

	// Actualizar precio de producto
	async updateProductPrice(sku: string, price: number): Promise<any> {
		const url = `${this.baseUrl}/api/falabella/products/${sku}/price`;

		const response = await fetch(url, {
			method: 'PUT',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...(localStorage.getItem('auth_token') && {
					Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
				}),
			},
			body: JSON.stringify({ price }),
		});

		if (!response.ok) {
			throw new Error(`Error updating price: ${response.status}`);
		}

		return response.json();
	}

	// Actualizar stock de producto
	async updateProductStock(sku: string, quantity: number): Promise<any> {
		const url = `${this.baseUrl}/api/falabella/products/${sku}/stock`;

		const response = await fetch(url, {
			method: 'PUT',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...(localStorage.getItem('auth_token') && {
					Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
				}),
			},
			body: JSON.stringify({ quantity }),
		});

		if (!response.ok) {
			throw new Error(`Error updating stock: ${response.status}`);
		}

		return response.json();
	}
}

export default FalabellaBackendService;
