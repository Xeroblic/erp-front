import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { IBrand } from '@/interface/brand.interface';
import type { ICategory } from '@/interface/category.interface';
import type { ProductResourcePayload } from '@/interface/product.interface';
import { computeStats } from '@/components/helper/brand.helper';
import { computeCategoryStats } from '@/components/helper/category.helper';
import { computeProductStats, normalizeProduct } from '@/components/helper/product.helper';
import brandsReducer, { fetchBrands, toggleBrandStatus } from '@/store/slices/brands/brandsSlice';
import categoriesReducer, {
	fetchCategories,
	toggleCategoryStatus,
} from '@/store/slices/categories/categoriesSlice';
import productsReducer, {
	fetchProductsList,
	toggleProductStatus,
} from '@/store/slices/products/productsSlice';
import { makeIntegrationStore } from '@/test-utils/integrationStore';

vi.mock('@/store', () => ({
	default: {
		getState: () => ({ auth: { access: 'test-token' } }),
		dispatch: vi.fn(),
	},
	logout: vi.fn(() => ({ type: 'auth/logout' })),
	setToken: vi.fn((payload: unknown) => ({ type: 'auth/setToken', payload })),
}));

const BRANCH_ID = 4;
const SUBSIDIARY_ID = 8;
const PERMISSION_MESSAGE = 'No tienes permiso para realizar esta acción.';

const brand: IBrand = {
	id: 11,
	branch_id: BRANCH_ID,
	name: 'Marca preservada',
	code: 'MAR-11',
	is_active: true,
	created_at: '2026-08-01T10:00:00Z',
	updated_at: '2026-08-01T10:00:00Z',
	products_count: 3,
	total_sales: 25,
};

const category: ICategory = {
	id: 12,
	name: 'Categoría preservada',
	description: 'Descripción que no debe perderse',
	is_active: true,
	created_at: '2026-08-01T10:00:00Z',
	updated_at: '2026-08-01T10:00:00Z',
	products_count: 2,
};

const rawProduct: ProductResourcePayload = {
	id: 13,
	branch_id: BRANCH_ID,
	parent_product_id: null,
	sku: 'PROD-13',
	commercial_sku: null,
	barcode: null,
	name: 'Producto preservado',
	grade: null,
	product_type: 'general',
	warranty_months: 6,
	serial_tracking: false,
	short_description: 'Descripción corta',
	long_description: null,
	snippet_description: null,
	stock: 5,
	cost: '700',
	price: '1000',
	offer_price: null,
	product_status: 'validated',
	attributes_json: null,
	marketplace_external_ids: null,
	is_active: true,
	image: null,
	gallery: [],
	created_at: '2026-08-01T10:00:00Z',
	updated_at: '2026-08-01T10:00:00Z',
};

const product = normalizeProduct(rawProduct);

const server = setupServer(
	http.patch(`*/branches/${BRANCH_ID}/brands/${brand.id}/toggle-status`, async ({ request }) => {
		expect(await request.text()).toBe('');
		return HttpResponse.json({
			success: true,
			message: 'Marca desactivada',
			data: { is_active: false },
		});
	}),
	http.patch(`*/categories/${category.id}/toggle-status`, async ({ request }) => {
		expect(await request.text()).toBe('');
		return HttpResponse.json({
			success: true,
			message: 'Categoría desactivada',
			data: { is_active: false },
		});
	}),
	http.patch(
		`*/branches/${BRANCH_ID}/products/${product.id}/toggle-status`,
		async ({ request }) => {
			expect(await request.text()).toBe('');
			return HttpResponse.json({
				success: true,
				message: 'Producto desactivado',
				data: { is_active: false },
			});
		},
	),
	http.patch(`*/subsidiaries/${SUBSIDIARY_ID}/products/${product.id}/toggle-status`, () =>
		HttpResponse.json({
			is_active: false,
			product: {
				...rawProduct,
				branch_id: null,
				is_active: false,
				name: 'Producto actualizado',
			},
		}),
	),
);

const makeStore = () =>
	makeIntegrationStore({
		brands: brandsReducer,
		categories: categoriesReducer,
		products: productsReducer,
	});

const seedStore = (store: ReturnType<typeof makeStore>) => {
	store.dispatch(
		fetchBrands.fulfilled({ items: [brand], stats: computeStats([brand]) }, 'seed-brands', {
			branchId: BRANCH_ID,
		}),
	);
	store.dispatch(
		fetchCategories.fulfilled(
			{ items: [category], stats: computeCategoryStats([category]) },
			'seed-categories',
			undefined,
		),
	);
	store.dispatch(
		fetchProductsList.fulfilled(
			{
				items: [product],
				meta: { total: 1, current_page: 1, per_page: 15, last_page: 1 },
				stats: computeProductStats([product]),
			},
			'seed-products',
			{ entityParam: 'branches', entityId: BRANCH_ID, params: {} },
		),
	);
};

describe('contrato de toggle-status', () => {
	beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
	afterEach(() => server.resetHandlers());
	afterAll(() => server.close());

	it('marca mezcla el estado parcial sin perder sus campos', async () => {
		const store = makeStore();
		seedStore(store);

		await store.dispatch(toggleBrandStatus({ branchId: BRANCH_ID, brand })).unwrap();

		expect(store.getState().brands.items[0]).toMatchObject({
			id: brand.id,
			name: brand.name,
			code: brand.code,
			products_count: brand.products_count,
			is_active: false,
		});
		expect(store.getState().brands.stats.inactive_brands).toBe(1);
	});

	it('categoría mezcla el estado parcial sin perder sus campos', async () => {
		const store = makeStore();
		seedStore(store);

		await store.dispatch(toggleCategoryStatus(category)).unwrap();

		expect(store.getState().categories.items[0]).toMatchObject({
			id: category.id,
			name: category.name,
			description: category.description,
			products_count: category.products_count,
			is_active: false,
		});
		expect(store.getState().categories.stats.inactive_categories).toBe(1);
	});

	it('producto por sucursal mezcla el estado parcial sin perder sus campos', async () => {
		const store = makeStore();
		seedStore(store);

		await store
			.dispatch(
				toggleProductStatus({
					entityParam: 'branches',
					entityId: BRANCH_ID,
					productId: product.id,
				}),
			)
			.unwrap();

		expect(store.getState().products.items[0]).toMatchObject({
			id: product.id,
			sku: product.sku,
			name: product.name,
			price: product.price,
			is_active: false,
		});
		expect(store.getState().products.stats.inactives).toBe(1);
	});

	it('propaga el message del 403 en marca, categoría y producto', async () => {
		server.use(
			http.patch(`*/branches/${BRANCH_ID}/brands/${brand.id}/toggle-status`, () =>
				HttpResponse.json({ message: PERMISSION_MESSAGE }, { status: 403 }),
			),
			http.patch(`*/categories/${category.id}/toggle-status`, () =>
				HttpResponse.json({ message: PERMISSION_MESSAGE }, { status: 403 }),
			),
			http.patch(`*/branches/${BRANCH_ID}/products/${product.id}/toggle-status`, () =>
				HttpResponse.json({ message: PERMISSION_MESSAGE }, { status: 403 }),
			),
		);
		const store = makeStore();
		seedStore(store);

		await expect(
			store.dispatch(toggleBrandStatus({ branchId: BRANCH_ID, brand })).unwrap(),
		).rejects.toBe(PERMISSION_MESSAGE);
		await expect(store.dispatch(toggleCategoryStatus(category)).unwrap()).rejects.toBe(
			PERMISSION_MESSAGE,
		);
		await expect(
			store
				.dispatch(
					toggleProductStatus({
						entityParam: 'branches',
						entityId: BRANCH_ID,
						productId: product.id,
					}),
				)
				.unwrap(),
		).rejects.toBe(PERMISSION_MESSAGE);

		expect(store.getState().brands.error).toBe(PERMISSION_MESSAGE);
		expect(store.getState().categories.error).toBe(PERMISSION_MESSAGE);
		expect(store.getState().products.error).toBe(PERMISSION_MESSAGE);
	});

	it('producto por subsidiaria conserva su URL y usa la entidad completa', async () => {
		const store = makeStore();
		seedStore(store);

		await store
			.dispatch(
				toggleProductStatus({
					entityParam: 'subsidiaries',
					entityId: SUBSIDIARY_ID,
					productId: product.id,
				}),
			)
			.unwrap();

		expect(store.getState().products.items[0]).toMatchObject({
			id: product.id,
			name: 'Producto actualizado',
			is_active: false,
		});
	});
});
