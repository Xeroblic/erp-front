import type {
	IInventoryAdjustmentPayload,
	IProcurementProduct,
	IWarehouseCompact,
	IWarehouseStockMovementPayload,
} from '@/interface/procurement.interface';
import {
	ecopcWarehouse,
	invoiceDocument,
	pcExpressSupplier,
	receiptDocument,
} from '@/mocks/db/procurement.db';
import type { IInventorySeedOrigin } from '@/mocks/db/inventoryStock.db';

/**
 * Productos de ejemplo de la sucursal Ecopc (`branch_id: 1`, la de la sesión
 * del equipo en desarrollo) para revisar la vista de Inventario con datos
 * variados: precio y oferta, sin marca ni precio, varias bodegas, sin
 * ubicación, bajo el umbral, sin disponible por reservas, no vendibles y con
 * y sin documento de compra.
 *
 * Las procedencias son el punto de partida de la trazabilidad; el historial
 * (`ecopcDemoHistory`, al final) las lleva al stock que muestra Inventario.
 *
 * Viven aparte de `inventoryStock.db.ts` porque ningún test depende de ellos:
 * son sólo para navegar. IDs 2001+ y procedencias 400+, fuera de los rangos
 * que usan los fixtures de los tests.
 */

const ECOPC_BRANCH_ID = 1;

/**
 * Segunda ubicación de Ecopc, sólo para Inventario (no recibe mercadería en
 * Recepciones): permite revisar productos repartidos entre varias bodegas.
 */
export const ecopcShowroomWarehouse: IWarehouseCompact = { id: 21, name: 'Sala de ventas Ecopc' };

const base = (
	product: Pick<IProcurementProduct, 'id' | 'sku' | 'name'> & Partial<IProcurementProduct>,
): IProcurementProduct => ({
	commercial_sku: null,
	short_description: null,
	serial_tracking: false,
	grade: null,
	currency_code: 'CLP',
	price: null,
	offer_price: null,
	cost: null,
	cost_basis: 'unknown',
	brand: null,
	categories: [],
	image: null,
	is_active: true,
	...product,
});

const monitores = { id: 21, name: 'Monitores', slug: 'monitores' };
const audio = { id: 22, name: 'Audio', slug: 'audio' };
const almacenamiento = { id: 23, name: 'Almacenamiento', slug: 'almacenamiento' };
const accesorios = { id: 24, name: 'Accesorios', slug: 'accesorios' };
const energia = { id: 25, name: 'Energía', slug: 'energia' };

export const ecopcDemoProducts: IProcurementProduct[] = [
	base({
		id: 2001,
		sku: 'MON-LG-24',
		commercial_sku: '24MK600M',
		name: 'Monitor LG 24" Full HD',
		short_description: 'Monitor IPS de 24 pulgadas, 75 Hz',
		price: '129990.00',
		offer_price: '119990.00',
		cost: '92000.00',
		brand: { id: 31, name: 'LG', slug: 'lg' },
		categories: [monitores],
	}),
	base({
		id: 2002,
		sku: 'AUD-SONY-BT',
		name: 'Audífonos Bluetooth Sony',
		short_description: 'Over-ear con cancelación de ruido',
		price: '89990.00',
		cost: '61000.00',
		brand: { id: 32, name: 'Sony', slug: 'sony' },
		categories: [audio],
	}),
	base({
		id: 2003,
		sku: 'SSD-KING-1TB',
		name: 'Disco SSD 1 TB Kingston',
		short_description: 'SATA III, 2,5 pulgadas',
		price: '54990.00',
		cost: '38000.00',
		brand: { id: 33, name: 'Kingston', slug: 'kingston' },
		categories: [almacenamiento],
	}),
	base({
		id: 2004,
		sku: 'CARG-USBC-65',
		name: 'Cargador USB-C 65 W',
		price: '24990.00',
		brand: { id: 34, name: 'Baseus', slug: 'baseus' },
		categories: [energia, accesorios],
	}),
	base({
		id: 2005,
		sku: 'PAD-XL-001',
		name: 'Mouse pad XL',
		short_description: 'Base de goma, 90 × 40 cm',
		price: '9990.00',
		brand: { id: 14, name: 'Redragon', slug: 'redragon' },
		categories: [accesorios],
	}),
	base({
		id: 2006,
		sku: 'CAM-LOGI-C920',
		commercial_sku: 'C920',
		name: 'Webcam Logitech C920',
		short_description: 'Full HD 1080p con micrófono estéreo',
		price: '69990.00',
		cost: '48000.00',
		brand: { id: 3, name: 'Logitech', slug: 'logitech' },
		categories: [accesorios],
	}),
	base({
		id: 2007,
		sku: 'HUB-USB-7P',
		name: 'Hub USB 3.0 de 7 puertos',
		price: '19990.00',
		categories: [accesorios],
	}),
	base({
		id: 2008,
		sku: 'ALRG-PODER-18',
		name: 'Alargador de poder 1,8 m',
	}),
];

/** Umbral crítico (§13) de los ejemplos; los ausentes quedan «Sin umbral». */
export const ecopcDemoThresholds: Record<number, number> = {
	2001: 5, // 11 disponibles: normal
	2002: 5, // 2 disponibles: bajo el umbral
	2003: 2, // 4 físicos y 4 reservados: sin disponible
	2005: 5, // 12 vendibles de 15: normal, con 3 no vendibles
	2006: 2, // 6 disponibles: normal
	2007: 3, // 1 disponible: bajo el umbral
};

/** Reservas vigentes: dejan el SSD sin nada para vender. */
export const ecopcDemoHolds = [
	{ branch_id: ECOPC_BRANCH_ID, product_id: 2003, reserved_quantity: 4 },
];

type TOriginSeed = Pick<
	IInventorySeedOrigin,
	'product_id' | 'warehouse_id' | 'physical_quantity' | 'fit_quantity' | 'unfit_quantity'
> &
	Partial<IInventorySeedOrigin>;

let nextOriginId = 400;
const origin = (seed: TOriginSeed): IInventorySeedOrigin => {
	const originId = nextOriginId;
	nextOriginId += 1;
	return {
		origin_id: originId,
		origin_type: 'initial_stock',
		stock_receipt_id: null,
		received_on: null,
		supplier: null,
		purchase_document: null,
		branch_id: ECOPC_BRANCH_ID,
		fifo_at: originId,
		...seed,
	};
};

const recibido = {
	origin_type: 'stock_receipt' as const,
	received_on: '2026-09-10',
	supplier: pcExpressSupplier,
	purchase_document: invoiceDocument,
};

export const ecopcDemoOrigins: IInventorySeedOrigin[] = [
	// Monitor: entran 10 a bodega y 2 pasan a la sala (8 + 3); parte documentado.
	origin({
		...recibido,
		stock_receipt_id: 95,
		product_id: 2001,
		warehouse_id: ecopcWarehouse.id,
		physical_quantity: 10,
		fit_quantity: 10,
		unfit_quantity: 0,
	}),
	origin({
		product_id: 2001,
		warehouse_id: ecopcShowroomWarehouse.id,
		physical_quantity: 1,
		fit_quantity: 1,
		unfit_quantity: 0,
	}),
	// Audífonos: entran 4 y se dan de baja 2; quedan 2, bajo el umbral de 5.
	origin({
		...recibido,
		stock_receipt_id: 96,
		purchase_document: receiptDocument,
		product_id: 2002,
		warehouse_id: ecopcShowroomWarehouse.id,
		physical_quantity: 4,
		fit_quantity: 4,
		unfit_quantity: 0,
	}),
	// SSD: 4 físicos, todos reservados.
	origin({
		...recibido,
		stock_receipt_id: 97,
		product_id: 2003,
		warehouse_id: ecopcWarehouse.id,
		physical_quantity: 4,
		fit_quantity: 4,
		unfit_quantity: 0,
	}),
	// Cargador: conteo inicial sin ubicar ni documentar; después se ubican 12. Sin umbral.
	origin({
		product_id: 2004,
		warehouse_id: null,
		physical_quantity: 20,
		fit_quantity: 20,
		unfit_quantity: 0,
	}),
	// Mouse pad: 3 de 15 dañados (no vendibles), que después pasan a bodega.
	origin({
		product_id: 2005,
		warehouse_id: ecopcShowroomWarehouse.id,
		physical_quantity: 15,
		fit_quantity: 12,
		unfit_quantity: 3,
	}),
	// Webcam: todo documentado por factura; 2 pasan a la sala.
	origin({
		...recibido,
		stock_receipt_id: 98,
		product_id: 2006,
		warehouse_id: ecopcWarehouse.id,
		physical_quantity: 6,
		fit_quantity: 6,
		unfit_quantity: 0,
	}),
	// Hub: un conteo encuentra 1 de 2; queda bajo el umbral de 3.
	origin({
		product_id: 2007,
		warehouse_id: ecopcWarehouse.id,
		physical_quantity: 2,
		fit_quantity: 2,
		unfit_quantity: 0,
	}),
	// Alargador: sin marca, sin categoría y sin precio; un conteo suma 6 (24 + 6).
	origin({
		product_id: 2008,
		warehouse_id: null,
		physical_quantity: 24,
		fit_quantity: 24,
		unfit_quantity: 0,
	}),
];

/* =================================================
   Historial para la trazabilidad
   ================================================= */

/**
 * Operación ya confirmada en la sucursal después de sus procedencias.
 * `inventoryStock.service` las aplica al sembrar la sucursal con la misma
 * lógica que los traslados y ajustes reales, así que el stock de Inventario y
 * la trazabilidad cuentan la misma historia.
 */
export type TInventoryDemoEvent =
	| ({ kind: 'movement'; id: string; created_at: string } & IWarehouseStockMovementPayload)
	| ({ kind: 'adjustment'; id: string; created_at: string } & IInventoryAdjustmentPayload)
	| {
			/** Recepción que ingresó y se revirtió entera: no deja saldo. */
			kind: 'reversed_receipt';
			subsidiary_id: number;
			stock_receipt_id: number;
			warehouse_id: number;
			applied_at: string;
			reversed_at: string;
			items: { product_id: number; quantity: number }[];
	  };

/** Filial de Ecopc: la de `/perfil` en desarrollo. */
const ECOPC_SUBSIDIARY_ID = 1;

/** Fecha y hora local, como las demás semillas de la trazabilidad. */
const at = (businessDate: string, time: string): string =>
	new Date(`${businessDate}T${time}:00`).toISOString();

const demoOperationId = (index: number): string =>
	`ec0bc000-0000-4000-8000-${String(index).padStart(12, '0')}`;

const [, , audioReceipt] = ecopcDemoOrigins;

/** Historial por sucursal, en orden cronológico. */
export const ecopcDemoHistory: Record<number, TInventoryDemoEvent[]> = {
	[ECOPC_BRANCH_ID]: [
		{
			kind: 'movement',
			id: demoOperationId(1),
			created_at: at('2026-09-11', '09:40'),
			from_warehouse_id: ecopcWarehouse.id,
			to_warehouse_id: ecopcShowroomWarehouse.id,
			reason: 'Reposición de la vitrina de monitores',
			items: [{ product_id: 2001, condition: 'fit', quantity: 2 }],
		},
		{
			kind: 'movement',
			id: demoOperationId(2),
			created_at: at('2026-09-12', '11:15'),
			from_warehouse_id: null,
			to_warehouse_id: ecopcWarehouse.id,
			reason: 'Ubicación de cargadores contados sin ubicar',
			items: [{ product_id: 2004, condition: 'fit', quantity: 12 }],
		},
		{
			// Ingresó por error a la bodega y se revirtió la misma tarde.
			kind: 'reversed_receipt',
			subsidiary_id: ECOPC_SUBSIDIARY_ID,
			stock_receipt_id: 99,
			warehouse_id: ecopcWarehouse.id,
			applied_at: at('2026-09-13', '10:20'),
			reversed_at: at('2026-09-13', '16:45'),
			items: [
				{ product_id: 2002, quantity: 5 },
				{ product_id: 2006, quantity: 2 },
			],
		},
		{
			kind: 'adjustment',
			id: demoOperationId(3),
			created_at: at('2026-09-15', '18:05'),
			warehouse_id: null,
			reason: 'Sobrante en conteo de cierre',
			notes: 'Seis alargadores sin registrar en el pasillo de despacho.',
			items: [{ product_id: 2008, condition: 'fit', quantity_delta: 6 }],
		},
		{
			kind: 'movement',
			id: demoOperationId(4),
			created_at: at('2026-09-16', '12:30'),
			from_warehouse_id: ecopcShowroomWarehouse.id,
			to_warehouse_id: ecopcWarehouse.id,
			reason: 'Mouse pads dañados a bodega para revisión',
			items: [{ product_id: 2005, condition: 'unfit', quantity: 3 }],
		},
		{
			kind: 'adjustment',
			id: demoOperationId(5),
			created_at: at('2026-09-17', '17:50'),
			warehouse_id: ecopcWarehouse.id,
			reason: 'Faltante en conteo cíclico',
			notes: 'Se revisó la bodega completa: falta un hub.',
			items: [{ product_id: 2007, condition: 'fit', quantity_delta: -1 }],
		},
		{
			kind: 'adjustment',
			id: demoOperationId(6),
			created_at: at('2026-09-18', '15:10'),
			warehouse_id: ecopcShowroomWarehouse.id,
			reason: 'Baja por daño en exhibición',
			related_stock_receipt_id: audioReceipt.stock_receipt_id,
			items: [
				{
					product_id: audioReceipt.product_id,
					condition: 'fit',
					quantity_delta: -2,
					origin_id: audioReceipt.origin_id,
				},
			],
		},
		{
			kind: 'movement',
			id: demoOperationId(7),
			created_at: at('2026-09-20', '10:00'),
			from_warehouse_id: ecopcWarehouse.id,
			to_warehouse_id: ecopcShowroomWarehouse.id,
			reason: 'Reposición semanal de la sala de ventas',
			items: [
				{ product_id: 2006, condition: 'fit', quantity: 2 },
				{ product_id: 2003, condition: 'fit', quantity: 1 },
			],
		},
		{
			kind: 'movement',
			id: demoOperationId(8),
			created_at: at('2026-09-22', '09:25'),
			from_warehouse_id: ecopcShowroomWarehouse.id,
			to_warehouse_id: ecopcWarehouse.id,
			reason: 'SSD reservado para despacho: vuelve a bodega',
			items: [{ product_id: 2003, condition: 'fit', quantity: 1 }],
		},
	],
};
