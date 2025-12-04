export type CreateCategoryPayload = {
	name: string;
	description?: string;
	parent_id?: number | null;
	is_active: boolean;
	image?: File | null;
};

export type UpdateCategoryPayload = CreateCategoryPayload & {
	id: number;
};

export interface FetchCategoriesParams {
	search?: string;
	parent_id?: number;
	page?: number;
}

export interface ICategory {
	id: number;
	company_id?: number;
	name: string;
	slug?: string;
	description?: string | null;
	parent_id?: number | null;
	parent_name?: string | null;
	children_count?: number;
	products_count?: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	image?: ICategoryImage | null;
	gallery?: ICategoryImage[];
}

export interface ICategoryFilters {
	search: string;
	parent_id?: number;
	is_active?: boolean;
	branch_id?: number;
}

export interface ICategoryStats {
	total_categories: number;
	active_categories: number;
	inactive_categories: number;
	products_total: number;
}

export interface ICategoryTreeNode {
	id: number;
	name: string;
	children?: ICategoryTreeNode[];
}

export interface ICategoryImage {
	id?: number;
	url: string;
	thumb?: string | null;
	alt?: string | null;
}
