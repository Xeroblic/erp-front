import type {
	IEquipmentWithdrawalListItem,
	IWithdrawalsListResponse,
	IFetchWithdrawalsParams,
	IWithdrawalTotals,
} from '@/interface/equipmentWithdrawals.interface';

/**
 * Datos mock del listado con la forma EXACTA del contrato §9: los elementos
 * omiten `items` y `stock_impact` y conservan `totals`. Se reemplazan por la
 * respuesta real al apagar WITHDRAWALS_USE_MOCKS.
 */

const entity = {
	subsidiary: { id: 3, name: 'Zentria Retail' },
	branch: { id: 12, name: 'Providencia' },
};

const customerFtImportaciones = { id: 7, name: 'FT Importaciones' };
const customerTecnoClima = { id: 21, name: 'TecnoClima SpA' };

const userCamila = { id: 44, name: 'Camila Rojas' };
const userMatias = { id: 58, name: 'Matías Soto' };

const contactNicolas = {
	id: 31,
	name: 'Nicolás Fuentes',
	identifier: '18.442.901-K',
	email: null,
	phone: '+56 9 8123 4567',
	is_active: true,
};

const contactValentina = {
	id: 36,
	name: 'Valentina Reyes',
	identifier: '16.223.554-7',
	email: 'vreyes@tecnoclima.cl',
	phone: '+56 9 7411 2200',
	is_active: true,
};

const totals = (items: number, pendingReturn: number, returned: number): IWithdrawalTotals => ({
	items,
	pending_return: pendingReturn,
	returned,
});

export const MOCK_WITHDRAWALS: IEquipmentWithdrawalListItem[] = [
	{
		id: 848,
		code: 'RET-000848',
		status: { value: 'draft', label: 'Borrador' },
		type: { value: 'loan', label: 'Préstamo' },
		...entity,
		customer_supplier: customerTecnoClima,
		contact: contactValentina,
		created_by: userMatias,
		delivered_by: null,
		expected_return_at: '2026-09-30',
		confirmed_at: null,
		returned_at: null,
		cancelled_at: null,
		is_stale: true,
		notes: 'Equipos para feria Tecnocalle. El bodeguero quedó a media carga.',
		totals: totals(12, 0, 0),
		created_at: '2026-08-24T09:15:00-04:00',
		updated_at: '2026-08-24T10:02:31-04:00',
	},
	{
		id: 847,
		code: 'RET-000847',
		status: { value: 'draft', label: 'Borrador' },
		type: { value: 'permanent', label: 'Definitivo' },
		...entity,
		customer_supplier: customerFtImportaciones,
		contact: null,
		created_by: userCamila,
		delivered_by: null,
		expected_return_at: null,
		confirmed_at: null,
		returned_at: null,
		cancelled_at: null,
		is_stale: false,
		notes: 'Venta directa, retiro en bodega esta tarde.',
		totals: totals(3, 0, 0),
		created_at: '2026-08-26T08:40:12-04:00',
		updated_at: '2026-08-26T09:05:44-04:00',
	},
	{
		id: 846,
		code: 'RET-000846',
		status: { value: 'confirmed', label: 'Confirmado' },
		type: { value: 'permanent', label: 'Definitivo' },
		...entity,
		customer_supplier: customerFtImportaciones,
		contact: contactNicolas,
		created_by: userCamila,
		delivered_by: userCamila,
		expected_return_at: null,
		confirmed_at: '2026-08-25T14:32:07-04:00',
		returned_at: null,
		cancelled_at: null,
		is_stale: false,
		notes: 'Retiro definitivo de notebooks grado B.',
		totals: totals(5, 0, 0),
		created_at: '2026-08-25T11:02:44-04:00',
		updated_at: '2026-08-25T14:32:07-04:00',
	},
	{
		id: 845,
		code: 'RET-000845',
		status: { value: 'confirmed', label: 'Confirmado' },
		type: { value: 'loan', label: 'Préstamo' },
		...entity,
		customer_supplier: customerFtImportaciones,
		contact: contactNicolas,
		created_by: userCamila,
		delivered_by: userCamila,
		expected_return_at: '2026-09-15',
		confirmed_at: '2026-08-25T14:32:07-04:00',
		returned_at: null,
		cancelled_at: null,
		is_stale: false,
		notes: 'Retira para demo en cliente final Santiago Centro.',
		totals: totals(9, 6, 3),
		created_at: '2026-08-25T11:02:44-04:00',
		updated_at: '2026-08-26T08:12:03-04:00',
	},
	{
		id: 844,
		code: 'RET-000844',
		status: { value: 'returned', label: 'Devuelto' },
		type: { value: 'loan', label: 'Préstamo' },
		...entity,
		customer_supplier: customerTecnoClima,
		contact: contactValentina,
		created_by: userMatias,
		delivered_by: userCamila,
		expected_return_at: '2026-08-20',
		confirmed_at: '2026-08-13T10:20:00-04:00',
		returned_at: '2026-08-20T17:45:19-04:00',
		cancelled_at: null,
		is_stale: false,
		notes: 'Préstamo para capacitación interna.',
		totals: totals(4, 0, 4),
		created_at: '2026-08-12T09:30:11-04:00',
		updated_at: '2026-08-20T17:45:19-04:00',
	},
	{
		id: 843,
		code: 'RET-000843',
		status: { value: 'cancelled', label: 'Anulado' },
		type: { value: 'permanent', label: 'Definitivo' },
		...entity,
		customer_supplier: customerFtImportaciones,
		contact: contactNicolas,
		created_by: userCamila,
		delivered_by: null,
		expected_return_at: null,
		confirmed_at: null,
		returned_at: null,
		cancelled_at: '2026-08-11T16:08:52-04:00',
		is_stale: false,
		notes: 'Se anuló: el cliente retirará junto a su próxima compra.',
		totals: totals(0, 0, 0),
		created_at: '2026-08-11T10:12:40-04:00',
		updated_at: '2026-08-11T16:08:52-04:00',
	},
];

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

/** Simula GET /withdrawals (§9) contra los mocks: mismos filtros y paginación. */
export const fetchWithdrawalsMock = async (
	params: IFetchWithdrawalsParams = {},
): Promise<IWithdrawalsListResponse> => {
	await new Promise<void>((resolve) => {
		setTimeout(resolve, 350);
	});

	const perPage = Math.min(params.per_page ?? DEFAULT_PER_PAGE, MAX_PER_PAGE);
	const page = params.page ?? 1;

	const filtered = MOCK_WITHDRAWALS.filter((withdrawal) => {
		if (params.status && withdrawal.status.value !== params.status) return false;
		if (params.type && withdrawal.type.value !== params.type) return false;
		if (params.stale != null && withdrawal.is_stale !== params.stale) return false;
		if (
			params.customer_supplier_id &&
			withdrawal.customer_supplier.id !== params.customer_supplier_id
		)
			return false;
		if (
			params.customer_supplier_contact_id &&
			withdrawal.contact?.id !== params.customer_supplier_contact_id
		)
			return false;
		if (params.q) {
			const needle = params.q.toLowerCase();
			const haystack = [withdrawal.code, withdrawal.notes ?? ''].join(' ').toLowerCase();
			if (!haystack.includes(needle)) return false;
		}
		return true;
	});

	const start = (page - 1) * perPage;
	const data = filtered.slice(start, start + perPage);

	return {
		data,
		links: { first: null, last: null, prev: null, next: null },
		meta: {
			current_page: page,
			from: data.length > 0 ? start + 1 : null,
			last_page: Math.max(1, Math.ceil(filtered.length / perPage)),
			path: '/mock/withdrawals',
			per_page: perPage,
			to: data.length > 0 ? start + data.length : null,
			total: filtered.length,
		},
	};
};
