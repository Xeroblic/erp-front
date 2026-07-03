import type {
	CommercialStatus,
	EquipmentType,
	ReviewStatus,
} from '@/store/slices/technicalReviews';

export interface ProductReviewRow {
	serialNumber: string;
	grade: string | null;
	branchId: number | null;
	branchName: string | null;
	inventoryStatus: string | null;
	reviewStatus: ReviewStatus | null;
	commercialStatus: CommercialStatus | null;
	equipmentType: EquipmentType | null;
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

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
	pending: 'Pendiente',
	in_review: 'En revisión',
	reviewed: 'Revisado',
	approved: 'Aprobado',
};

export const EQUIPMENT_TYPE_LABEL: Record<EquipmentType, string> = {
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
