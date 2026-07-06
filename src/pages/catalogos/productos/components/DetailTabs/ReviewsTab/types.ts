export interface ProductReviewRow {
	serialNumber: string;
	grade: string | null;
	branchId: number | null;
	branchName: string | null;
	inventoryStatus: string | null;
	reviewStatus: string | null;
	commercialStatus: string | null;
	equipmentType: string | null;
	reviewedAt: string | null;
	itemId: number | null;
}

export interface GradeCount {
	grade: string;
	count: number;
}

export interface ProductReviewsState {
	rows: ProductReviewRow[];
	total: number;
	reviewedCount: number;
	pendingCount: number;
	gradeBreakdown: GradeCount[];
	isLoading: boolean;
	error: string | null;
	reload: () => void;
}

export const REVIEW_STATUS_LABEL: Record<string, string> = {
	pending: 'Pendiente',
	received: 'Ingresado',
	in_review: 'En revisión',
	reviewed: 'Revisado',
	approved: 'Aprobado',
};

export const EQUIPMENT_TYPE_LABEL: Record<string, string> = {
	notebook: 'Notebook',
	desktop: 'Desktop',
	docking: 'Docking',
	aio: 'All in One',
	monitor: 'Monitor',
};

export const INVENTORY_STATUS_LABEL: Record<string, string> = {
	available: 'Disponible',
	available_for_sale: 'Disponible',
	reserved: 'Reservada',
	sold: 'Vendida',
	defective: 'Defectuosa',
	returned: 'Devuelta',
	scrapped: 'De baja',
};

export const humanizeStatus = (value: string): string => {
	const normalized = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
	if (normalized === '') return value;
	return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};
