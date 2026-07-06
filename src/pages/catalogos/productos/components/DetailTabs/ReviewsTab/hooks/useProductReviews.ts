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
		inventoryStatus: toStr(record.current_status) ?? toStr(record.status),
		reviewStatus: toStr(item?.review_status)?.toLowerCase() ?? null,
		commercialStatus: toStr(item?.current_status)?.toLowerCase() ?? null,
		equipmentType: toStr(item?.equipment_type)?.toLowerCase() ?? null,
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
			try {
				const seriesGroups = await Promise.all(
					ids.map((id) =>
						fetchAllProductSeries(subsidiaryId, id).catch(() => [] as unknown[]),
					),
				);

				const seriesBySerial = new Map<string, unknown>();
				seriesGroups.flat().forEach((serie) => {
					const serial = toStr(asRecord(serie)?.serial_number);
					if (serial && !seriesBySerial.has(serial)) {
						seriesBySerial.set(serial, serie);
					}
				});

				const itemsBySerial = new Map<string, IItem>();
				if (branchId !== null) {
					const { items } = await dispatch(
						fetchItems({
							subsidiaryId,
							branchId,
							params: { per_page: ITEMS_PER_PAGE },
						}),
					)
						.unwrap()
						.catch(() => ({ items: [] as IItem[] }));
					items.forEach((item) => itemsBySerial.set(item.serial_number, item));
				}

				if (!active) return;
				const mapped = Array.from(seriesBySerial.entries())
					.map(([serial, serie]) => buildRow(serie, itemsBySerial.get(serial)))
					.filter((row): row is ProductReviewRow => row !== null);
				setRows(mapped);
			} catch (err) {
				if (!active) return;
				setRows([]);
				setError(
					err instanceof Error
						? err.message
						: 'No se pudieron cargar las series del producto',
				);
			} finally {
				if (active) setIsLoading(false);
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
