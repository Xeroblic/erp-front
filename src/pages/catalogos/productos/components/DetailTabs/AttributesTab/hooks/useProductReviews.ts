import { useQuery } from '@tanstack/react-query';
import ApiService from '@/services/ApiService';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';

interface ReviewGrade {
	value: string;
	label: string;
	description?: string;
}

interface ReviewEquipmentType {
	value: string;
	label: string;
}

export interface ReviewItemMatch {
	id: number;
	serial_number: string;
	grade: ReviewGrade | null;
	equipment_type: ReviewEquipmentType;
	review_status: { value: string; label: string };
	product: { id: number; name: string; sku: string } | null;
	details: Record<string, unknown> | null;
	reviewed_by: { name: string } | null;
	approved_at: string | null;
}

const PRODUCT_KIND_TO_EQUIPMENT: Record<string, string> = {
	notebook: 'notebook',
	desktop_pc: 'desktop',
	aio: 'aio',
	monitor: 'monitor',
	docking: 'docking',
};

const fetchItems = async (
	branchId: number,
	search: string,
	equipmentType?: string,
): Promise<ReviewItemMatch[]> => {
	const params: Record<string, unknown> = { search, per_page: 50 };
	if (equipmentType) params.equipment_type = equipmentType;
	const resp = await ApiService.fetchData<{ data?: unknown[] }>({
		url: `/branches/${branchId}/technical-reviews/items`,
		method: 'get',
		params,
	});
	const raw = resp.data?.data ?? resp.data;
	return Array.isArray(raw) ? (raw as ReviewItemMatch[]) : [];
};

const buildSearchTerms = (name?: string, sku?: string): string[] => {
	const terms: string[] = [];

	if (name) {
		const words = name
			.replace(/[-–—]/g, ' ')
			.split(/\s+/)
			.filter((w) => w.length >= 2)
			.filter(
				(w) =>
					!['grado', 'grade', 'con', 'sin', 'para', 'the', 'de'].includes(
						w.toLowerCase(),
					),
			);

		if (words.length > 2) {
			terms.push(words.slice(0, 3).join(' '));
		}

		const modelPattern = /\b([A-Za-z]?\d{2,}[A-Za-z]*\b)/;
		const modelMatch = name.match(modelPattern);
		if (modelMatch) {
			terms.push(modelMatch[1]);
		}

		if (terms.length === 0) {
			terms.push(name);
		}
	}

	if (sku && !terms.some((t) => t.toLowerCase() === sku.toLowerCase())) {
		terms.push(sku);
	}

	return [...new Set(terms.map((t) => t.trim()).filter(Boolean))];
};

interface UseProductReviewsParams {
	productId?: number;
	productName?: string;
	productSku?: string;
	productType?: string;
}

export const useProductReviews = ({
	productId,
	productName,
	productSku,
	productType,
}: UseProductReviewsParams) => {
	const { branchId } = useCurrentBranch();
	const equipmentType = productType ? PRODUCT_KIND_TO_EQUIPMENT[productType] : undefined;

	const query = useQuery({
		queryKey: ['product-reviews', branchId, productId, productName, productSku, equipmentType],
		queryFn: async () => {
			if (!branchId || !productId) return [];

			const searchTerms = buildSearchTerms(productName, productSku);
			if (searchTerms.length === 0) return [];

			for (const term of searchTerms) {
				const items = await fetchItems(branchId, term, equipmentType);

				const byProductId = items.filter((i) => i.product?.id === productId);
				if (byProductId.length > 0) return byProductId;

				if (items.length > 0) return items;
			}

			return [];
		},
		enabled: !!branchId && !!productId && !!(productName || productSku),
		staleTime: 120_000,
	});

	return {
		reviews: query.data ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
	};
};
