import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch } from '@/store';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { fetchItems } from '@/store/slices/technicalReviews';
import type { IItem } from '@/store/slices/technicalReviews';
import type { ProductReviewRow, ProductReviewsState } from '../types';
import { fetchAllProductSeries } from '../services/productSeries.service';

const ITEMS_PER_PAGE = 1000;

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

const toStr = (value: unknown): string | null =>
	typeof value === 'string' && value.trim() !== '' ? value : null;

/**
 * Lee el valor de un enum que puede venir como string plano (endpoint /series)
 * o como objeto `{ value, label }` (TechnicalReviewItemResource del /items).
 * Devuelve siempre el `value` en minúsculas o null.
 */
const readEnumValue = (value: unknown): string | null => {
	const direct = toStr(value);
	if (direct) return direct.toLowerCase();
	const nested = toStr(asRecord(value)?.value);
	return nested ? nested.toLowerCase() : null;
};

const toNumberOrNull = (value: unknown): number | null =>
	typeof value === 'number' && Number.isFinite(value) ? value : null;

const isReviewed = (status: string | null): boolean =>
	status === 'reviewed' || status === 'approved';

const buildRow = (serie: unknown, item: IItem | undefined): ProductReviewRow | null => {
	const record = asRecord(serie);
	if (!record) return null;
	const serialNumber = toStr(record.serial_number);
	if (!serialNumber) return null;

	const branchRecord = asRecord(record.branch);
	return {
		serialNumber,
		grade: toStr(record.grade) ?? item?.grade ?? null,
		branchId: toNumberOrNull(record.branch_id),
		branchName: toStr(record.branch_name) ?? (branchRecord ? toStr(branchRecord.name) : null),
		// La serie (endpoint /series) ya trae review_status y current_status como
		// strings; los preferimos. El equipment_type NO viene en /series, solo en
		// el item de revisión técnica (y ahí llega como objeto { value, label }).
		inventoryStatus:
			toStr(record.current_status) ??
			toStr(record.status) ??
			readEnumValue(item?.current_status),
		reviewStatus: readEnumValue(record.review_status) ?? readEnumValue(item?.review_status),
		commercialStatus: readEnumValue(item?.current_status),
		equipmentType: readEnumValue(item?.equipment_type),
		reviewedAt: item?.reviewed_at ?? null,
		itemId: item?.id ?? null,
	};
};

export const useProductReviews = (productIds: number[]): ProductReviewsState => {
	const dispatch = useAppDispatch();
	const { subsidiaryId, branchId } = useCurrentBranch();

	const [rows, setRows] = useState<ProductReviewRow[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [reloadToken, setReloadToken] = useState(0);

	const reload = useCallback(() => setReloadToken((token) => token + 1), []);

	const idsKey = productIds.join(',');

	useEffect(() => {
		let active = true;

		const ids = idsKey
			.split(',')
			.map((value) => Number(value))
			.filter((value) => Number.isFinite(value) && value > 0);

		if (subsidiaryId === null || ids.length === 0) {
			setRows([]);
			setError(null);
			return () => {
				active = false;
			};
		}

		const load = async () => {
			setIsLoading(true);
			setError(null);

			// Lanzamos ambas peticiones EN PARALELO. Los items de revisión técnica
			// se piden por sucursal (payload pesado) y no dependen de las series,
			// así que arrancan de una y no bloquean el primer render.
			const itemsPromise: Promise<Map<string, IItem>> =
				branchId === null
					? Promise.resolve(new Map<string, IItem>())
					: dispatch(
							fetchItems({
								subsidiaryId,
								branchId,
								params: { per_page: ITEMS_PER_PAGE },
							}),
						)
							.unwrap()
							.then(({ items }) => {
								const map = new Map<string, IItem>();
								items.forEach((item) => map.set(item.serial_number, item));
								return map;
							})
							.catch(() => new Map<string, IItem>());

			try {
				const seriesGroups = await Promise.all(
					ids.map((id) =>
						fetchAllProductSeries(subsidiaryId, id).catch(() => [] as unknown[]),
					),
				);
				if (!active) return;

				const seriesBySerial = new Map<string, unknown>();
				seriesGroups.flat().forEach((serie) => {
					const serial = toStr(asRecord(serie)?.serial_number);
					if (serial && !seriesBySerial.has(serial)) {
						seriesBySerial.set(serial, serie);
					}
				});

				// PRIMER RENDER: pintamos las series de inmediato (rápido y liviano).
				// La tabla ya es usable; el estado de revisión llega enseguida.
				setRows(
					Array.from(seriesBySerial.values())
						.map((serie) => buildRow(serie, undefined))
						.filter((row): row is ProductReviewRow => row !== null),
				);
				setIsLoading(false);

				// ENRIQUECIMIENTO: cuando lleguen los items, mezclamos el estado de
				// revisión sin volver a bloquear la tabla.
				const itemsBySerial = await itemsPromise;
				if (!active) return;
				setRows(
					Array.from(seriesBySerial.entries())
						.map(([serial, serie]) => buildRow(serie, itemsBySerial.get(serial)))
						.filter((row): row is ProductReviewRow => row !== null),
				);
			} catch (err) {
				if (!active) return;
				setRows([]);
				setError(
					err instanceof Error
						? err.message
						: 'No se pudieron cargar las series del producto',
				);
				setIsLoading(false);
			}
		};

		void load();
		return () => {
			active = false;
		};
	}, [dispatch, subsidiaryId, branchId, idsKey, reloadToken]);

	const { total, reviewedCount, pendingCount, gradeBreakdown } = useMemo(() => {
		const reviewed = rows.filter((row) => isReviewed(row.reviewStatus)).length;
		const grades = new Map<string, number>();
		rows.forEach((row) => {
			const key = row.grade ?? 'Sin grado';
			grades.set(key, (grades.get(key) ?? 0) + 1);
		});
		return {
			total: rows.length,
			reviewedCount: reviewed,
			pendingCount: rows.length - reviewed,
			gradeBreakdown: Array.from(grades.entries())
				.map(([grade, count]) => ({ grade, count }))
				.sort((a, b) => a.grade.localeCompare(b.grade)),
		};
	}, [rows]);

	return {
		rows,
		total,
		reviewedCount,
		pendingCount,
		gradeBreakdown,
		isLoading,
		error,
		reload,
	};
};
