/**
 * Hook para gestión de cotizaciones contra el backend real
 * Se apoya en el slice Redux de cotizaciones y expone la misma API
 * que consumen los componentes actuales del módulo.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
	IQuote,
	type IQuoteItem,
	QuoteStatus,
	type QuoteCreateDTO,
	type QuoteUpdateDTO,
	type QuoteItemDTO,
} from '../../../../interface';
import { normalizeQuoteStatusValue } from '../constants/quoteStatuses';
import { getCustomerDisplayName } from '../utils/customerDisplay';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectEffectiveSubsidiaryId } from '@/store/selectors/subsidiarySelectors';
import {
	fetchQuotes,
	fetchQuoteById,
	createQuote,
	updateQuote,
	deleteQuote,
	fetchQuoteItems,
	addQuoteItem,
	updateQuoteItem,
	deleteQuoteItem,
	convertQuoteToSale as convertQuoteToSaleThunk,
	selectQuotes,
	selectQuotesLoading,
	selectQuoteActionsLoading,
} from '@/store/slices/quotes/quotesSlice';

export interface QuotationsFilters {
	status?: QuoteStatus;
	search?: string;
	customer?: string;
	dateFrom?: string;
	dateTo?: string;
	customerId?: number;
	minAmount?: number;
	maxAmount?: number;
}

export interface UseQuotationsManagerReturn {
	quotations: IQuote[];
	filteredQuotations: IQuote[];
	loading: boolean;
	error: string | null;
	totalItems: number;
	filters: QuotationsFilters;
	setFilters: (filters: QuotationsFilters) => void;
	currentPage: number;
	setCurrentPage: (page: number) => void;
	itemsPerPage: number;
	setItemsPerPage: (items: number) => void;
	stats: {
		total: number;
		byStatus: Record<string, number>;
		totalAmount: number;
		avgAmount: number;
	};
	createQuotation: (quotation: Partial<IQuote>) => Promise<void>;
	updateQuotation: (id: number, quotation: Partial<IQuote>) => Promise<void>;
	deleteQuotation: (id: number) => Promise<void>;
	duplicateQuotation: (id: number) => Promise<void>;
	changeStatus: (id: number, status: QuoteStatus) => Promise<void>;
	convertToSale: (id: number) => Promise<void>;
	refreshData: () => void;
	exportQuotations: () => void;
	getQuotationById: (id: number) => IQuote | undefined;
	resetFilters: () => void;
	loadQuotationDetails: (id: number) => Promise<IQuote>;
}

const initialFilters: QuotationsFilters = {
	status: undefined,
	search: '',
	customer: '',
	dateFrom: '',
	dateTo: '',
	customerId: undefined,
	minAmount: undefined,
	maxAmount: undefined,
};

const useQuotationsManager = (): UseQuotationsManagerReturn => {
	const dispatch = useAppDispatch();
	const quotations = useAppSelector(selectQuotes);
	const listLoading = useAppSelector(selectQuotesLoading);
	const actionsLoading = useAppSelector(selectQuoteActionsLoading);
	// Siempre usamos la sucursal/filial efectiva seleccionada (selector global/personalización).
	// Si el usuario cambia de sucursal, este valor cambia y el hook recarga datos.
	const subsidiaryId = useAppSelector(selectEffectiveSubsidiaryId);

	const [filters, setFilters] = useState<QuotationsFilters>(initialFilters);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(5);
	const [error, setError] = useState<string | null>(null);
	const API_FETCH_LIMIT = 500;

	const effectiveLoading =
		listLoading ||
		actionsLoading.creating ||
		actionsLoading.updating ||
		actionsLoading.deleting ||
		actionsLoading.itemsSaving ||
		actionsLoading.itemsDeleting ||
		actionsLoading.convertLoading;

	const requestQuotes = useCallback(async () => {
		if (!subsidiaryId) return;
		try {
			await dispatch(
				fetchQuotes({
					subsidiaryId,
					page: 1,
					perPage: API_FETCH_LIMIT,
					status: filters.status,
					search: filters.search,
				}),
			).unwrap();
			setError(null);
		} catch (err: any) {
			const message = err?.message || 'No se pudieron obtener las cotizaciones';
			setError(message);
			toast.error(message);
		}
	}, [dispatch, subsidiaryId, filters.status, filters.search, API_FETCH_LIMIT]);

	useEffect(() => {
		requestQuotes();
	}, [requestQuotes]);

	const filteredQuotations = useMemo(() => {
		let data = [...quotations];
		const customerTerm = (filters.customer ?? '').trim().toLowerCase();
		const customerNumericId = Number(customerTerm);

		if (filters.dateFrom) {
			data = data.filter((q) => q.quote_date >= filters.dateFrom!);
		}
		if (filters.dateTo) {
			data = data.filter((q) => q.quote_date <= filters.dateTo!);
		}
		if (customerTerm) {
			data = data.filter((q) => {
				const customerName = getCustomerDisplayName(q.customer).toLowerCase();
				const matchesId = Number.isFinite(customerNumericId) && customerNumericId > 0
					? Number(q.customer_id) === customerNumericId
					: false;
				return matchesId || customerName.includes(customerTerm);
			});
		}
		if (filters.customerId) {
			data = data.filter((q) => q.customer_id === filters.customerId);
		}
		if (filters.minAmount !== undefined) {
			data = data.filter((q) => Number(q.total_amount ?? 0) >= filters.minAmount!);
		}
		if (filters.maxAmount !== undefined) {
			data = data.filter((q) => Number(q.total_amount ?? 0) <= filters.maxAmount!);
		}
		if (filters.search) {
			const term = filters.search.toLowerCase();
			data = data.filter(
				(q) =>
					String(q.id).includes(term) ||
					(q.notes && q.notes.toLowerCase().includes(term)),
			);
		}
		return data;
	}, [quotations, filters]);

	const stats = useMemo(() => {
		const total = quotations.length;
		const totalAmount = quotations.reduce(
			(sum: number, quote: IQuote) => sum + Number(quote.total_amount ?? 0),
			0,
		);
		const byStatus = quotations.reduce<Record<string, number>>((acc, quote) => {
			const key = normalizeQuoteStatusValue(quote.status);
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		}, {});
		return {
			total,
			byStatus,
			totalAmount,
			avgAmount: total > 0 ? totalAmount / total : 0,
		};
	}, [quotations]);

	const normalizeStatus = (status?: QuoteStatus): QuoteStatus | undefined => {
		if (!status) return undefined;
		return status.toString().toLowerCase() as QuoteStatus;
	};

	type QuoteItemPayload = QuoteItemDTO & { id?: number };

	const normalizeQuoteItems = (items?: IQuoteItem[] | null): QuoteItemPayload[] => {
		if (!items || items.length === 0) return [];
		const mapped = items.map((item) => {
			const hasProduct = Boolean(item.product_id);
			const baseName = item.customer_name ?? item.product?.name ?? '';
			const baseSku = item.customer_sku ?? item.product?.sku ?? '';
			const quantity = Math.max(1, Number(item.quantity) || 1);
			const rawUnitPrice = Number(
				item.unit_price ??
				(item as any).unit_net ??
				(item as any).unitPrice ??
				(item as any).unit ??
				0,
			);
			const unitPrice =
				hasProduct && rawUnitPrice <= 0
					? undefined
					: rawUnitPrice > 0
						? rawUnitPrice
						: undefined;
			const discountAmount =
				item.discount_amount !== undefined && item.discount_amount !== null
					? Number(item.discount_amount)
					: undefined;

			if (!hasProduct && !baseName.trim()) {
				return null;
			}
			if (!hasProduct && (!unitPrice || unitPrice <= 0)) {
				throw new Error(
					'Los ítems sin producto asociado deben incluir un nombre y un precio neto mayor a 0.',
				);
			}

			return {
				id: item.id && item.id > 0 ? item.id : undefined,
				product_id: item.product_id ?? null,
				customer_name: baseName.trim() || undefined,
				customer_sku: baseSku.trim() || undefined,
				description: item.description ?? undefined,
				notes: item.notes ?? undefined,
				quantity,
				unit_price: unitPrice,
				metadata: item.metadata ?? undefined,
				discount_amount:
					discountAmount && discountAmount > 0
						? Number(discountAmount.toFixed(2))
						: undefined,
			};
		});
		return mapped.filter(Boolean) as QuoteItemPayload[];
	};

	// Helpers para mapToCreateDTO, mapToUpdateDTO y syncQuoteItems
	function mapToCreateDTO(quotation: Partial<IQuote>): QuoteCreateDTO {
		// Ajusta los campos según la definición real de QuoteCreateDTO
		const { customer_id, quote_date, status, notes, ...rest } = quotation;
		return {
			customer_id: customer_id!,
			quote_date: quote_date!,
			status: status!,
			notes: notes ?? '',
			...rest,
		} as QuoteCreateDTO;
	}

	function mapToUpdateDTO(quotation: Partial<IQuote>): QuoteUpdateDTO {
		// Ajusta los campos según la definición real de QuoteUpdateDTO
		const { customer_id, quote_date, status, notes, ...rest } = quotation;
		return {
			customer_id: customer_id!,
			quote_date: quote_date!,
			status: status!,
			notes: notes ?? '',
			...rest,
		} as QuoteUpdateDTO;
	}

	const syncQuoteItems = useCallback(
		async (quoteId: number, desiredItems?: IQuoteItem[]) => {
			if (!subsidiaryId) throw new Error('No hay una filial seleccionada');
			let desiredPayload: QuoteItemPayload[] = [];
			try {
				desiredPayload = normalizeQuoteItems(desiredItems);
			} catch (error: any) {
				const message =
					error?.message || 'Uno de los ítems no tiene la información mínima requerida.';
				toast.error(message);
				throw error;
			}

			const hasInputItems = Array.isArray(desiredItems) && desiredItems.length > 0;
			if (hasInputItems && desiredPayload.length === 0) {
				throw new Error('Debes agregar al menos un ítem válido a la cotización.');
			}

			const existing: IQuoteItem[] = await dispatch(
				fetchQuoteItems({ subsidiaryId, quoteId }),
			).unwrap();

			const toUpdate = desiredPayload.filter((item) => item.id && item.id > 0);
			const toCreate = desiredPayload.filter((item) => !item.id || item.id <= 0);
			const toDelete =
				desiredPayload.length === 0
					? existing
					: existing.filter(
						(item) => !toUpdate.some((desiredItem) => desiredItem.id === item.id),
					);

			if (!toUpdate.length && !toCreate.length && !toDelete.length) {
				return;
			}

			for (const item of toUpdate) {
				await dispatch(
					updateQuoteItem({
						subsidiaryId,
						quoteId,
						itemId: item.id!,
						data: item,
					}),
				).unwrap();
			}

			for (const item of toCreate) {
				await dispatch(
					addQuoteItem({
						subsidiaryId,
						quoteId,
						data: item,
					}),
				).unwrap();
			}

			for (const item of toDelete) {
				await dispatch(
					deleteQuoteItem({
						subsidiaryId,
						quoteId,
						itemId: item.id,
					}),
				).unwrap();
			}
		},
		[dispatch, subsidiaryId],
	);

	const createQuotation = useCallback(
		async (quotationData: Partial<IQuote>) => {
			if (!subsidiaryId) {
				toast.error('Selecciona una subsidiaria antes de crear cotizaciones');
				return;
			}
			try {
				const payload = mapToCreateDTO(quotationData);
				const createdQuote = await dispatch(
					createQuote({ subsidiaryId, data: payload }),
				).unwrap();
				await syncQuoteItems(createdQuote.id, quotationData.items as IQuoteItem[]);
				await requestQuotes();
			} catch (err: any) {
				const message = err?.message || 'Error al crear la cotización';
				setError(message);
				toast.error(message);
			}
		},
		[dispatch, subsidiaryId, requestQuotes, syncQuoteItems],
	);

	const updateQuotationHandler = useCallback(
		async (id: number, updates: Partial<IQuote>) => {
			if (!subsidiaryId) return;
			try {
				const payload = mapToUpdateDTO(updates);
				await dispatch(updateQuote({ subsidiaryId, quoteId: id, data: payload })).unwrap();
				await syncQuoteItems(id, updates.items);
				await requestQuotes();
			} catch (err: any) {
				const message = err?.message || 'Error al actualizar la cotización';
				setError(message);
				toast.error(message);
			}
		},
		[dispatch, subsidiaryId, requestQuotes, syncQuoteItems],
	);

	const deleteQuotationHandler = useCallback(
		async (id: number) => {
			if (!subsidiaryId) return;
			try {
				await dispatch(deleteQuote({ subsidiaryId, quoteId: id })).unwrap();
				await requestQuotes();
			} catch (err: any) {
				const message = err?.message || 'Error al eliminar la cotización';
				setError(message);
				toast.error(message);
			}
		},
		[dispatch, subsidiaryId, requestQuotes],
	);

	const duplicateQuotation = useCallback(
		async (id: number) => {
			if (!subsidiaryId) return;
			try {
				let baseQuote = quotations.find((q) => q.id === id);
				if (!baseQuote) {
					baseQuote = await dispatch(
						fetchQuoteById({ subsidiaryId, quoteId: id }),
					).unwrap();
				}
				let baseItems = baseQuote.items ?? [];
				if (!baseItems.length) {
					try {
						baseItems = await dispatch(
							fetchQuoteItems({ subsidiaryId, quoteId: id }),
						).unwrap();
					} catch (e) {
						baseItems = [];
					}
				}
				const payload = mapToCreateDTO({
					...baseQuote,
					quote_date: new Date().toISOString().split('T')[0],
				});
				payload.quote_number = undefined;
				const createdQuote = await dispatch(
					createQuote({ subsidiaryId, data: payload }),
				).unwrap();
				if (baseItems.length) {
					await syncQuoteItems(createdQuote.id, baseItems);
				}
				toast.success('Cotización duplicada exitosamente');
				await requestQuotes();
			} catch (err: any) {
				const message = err?.message || 'Error al duplicar la cotización';
				setError(message);
				toast.error(message);
			}
		},
		[dispatch, subsidiaryId, quotations, requestQuotes, syncQuoteItems],
	);

	const changeStatus = useCallback(
		async (id: number, status: QuoteStatus) => {
			await updateQuotationHandler(id, { status });
		},
		[updateQuotationHandler],
	);

	const convertToSale = useCallback(
		async (id: number) => {
			if (!subsidiaryId) return;
			try {
				await dispatch(convertQuoteToSaleThunk({ subsidiaryId, quoteId: id })).unwrap();
				await requestQuotes();
			} catch (err: any) {
				const message = err?.message || 'Error al convertir la cotización';
				setError(message);
				toast.error(message);
			}
		},
		[dispatch, subsidiaryId, requestQuotes],
	);

	const refreshData = useCallback(() => {
		requestQuotes();
	}, [requestQuotes]);

	const loadQuotationDetails = useCallback(
		async (id: number) => {
			if (!subsidiaryId) {
				throw new Error('No hay una filial seleccionada');
			}
			const detail = await dispatch(fetchQuoteById({ subsidiaryId, quoteId: id })).unwrap();
			if (!detail.items || detail.items.length === 0) {
				try {
					const items = await dispatch(
						fetchQuoteItems({ subsidiaryId, quoteId: id }),
					).unwrap();
					return { ...detail, items };
				} catch (error) {
					return detail;
				}
			}
			return detail;
		},
		[dispatch, subsidiaryId],
	);

	const exportQuotations = useCallback(() => {
		const csvContent = filteredQuotations
			.map((q) => `${q.id},${q.customer_id},${q.quote_date},${q.status},${q.total_amount}`)
			.join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `cotizaciones_${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
		toast.success('Cotizaciones exportadas');
	}, [filteredQuotations]);

	const getQuotationById = useCallback(
		(id: number) => quotations.find((q) => q.id === id),
		[quotations],
	);

	const resetFilters = useCallback(() => {
		setFilters(initialFilters);
		setCurrentPage(1);
	}, []);

	return {
		quotations,
		filteredQuotations,
		loading: effectiveLoading,
		error,
		totalItems: filteredQuotations.length,
		filters,
		setFilters,
		currentPage,
		setCurrentPage,
		itemsPerPage,
		setItemsPerPage,
		stats,
		createQuotation,
		updateQuotation: updateQuotationHandler,
		deleteQuotation: deleteQuotationHandler,
		duplicateQuotation,
		changeStatus,
		convertToSale,
		refreshData,
		exportQuotations,
		getQuotationById,
		resetFilters,
		loadQuotationDetails,
	};
};

export default useQuotationsManager;
