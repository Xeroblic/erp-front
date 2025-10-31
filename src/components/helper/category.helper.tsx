import { CATEGORY_EMPTY_STATS, type CategoryStatsShape } from '@/constants/category.constant';
import { ensureAbsoluteUrl } from '@/components/helper/brand.helper';
import type {
	CreateCategoryPayload,
	ICategory,
	ICategoryTreeNode,
	ICategoryImage,
} from '@/interface/category.interface';

export type CategoryTableRow = {
	category: ICategory;
	depth: number;
	parentNames: string[];
};

const resolveMediaCandidate = (value: any): any => {
	if (!value) return null;
	if (typeof value === 'string') return value;
	if (Array.isArray(value)) return value[0] ?? null;
	if (Array.isArray(value?.data)) return value.data[0] ?? null;
	if (Array.isArray(value?.media)) return value.media[0] ?? null;
	return value;
};

const normalizeCategoryImage = (input: any): ICategoryImage | null => {
	if (!input) return null;
	if (typeof input === 'string') {
		const absolute = ensureAbsoluteUrl(input);
		if (!absolute) return null;
		return { url: absolute, thumb: absolute, alt: null };
	}

	const candidate = resolveMediaCandidate(input);
	if (!candidate || typeof candidate !== 'object') return null;

	const url =
		candidate.url ??
		candidate.original_url ??
		candidate.full_url ??
		candidate.preview_url ??
		candidate.thumbnail_url ??
		candidate.thumb ??
		null;

	if (!url || typeof url !== 'string') return null;

	const thumb =
		candidate.thumb ??
		candidate.thumbnail_url ??
		candidate.preview_url ??
		candidate.conversion_url ??
		url;

	const idValue = candidate.id ?? candidate.media_id ?? candidate.pivot?.media_id;
	const parsedId = typeof idValue === 'number' ? idValue : Number(idValue);

	const absoluteUrl = ensureAbsoluteUrl(url);
	if (!absoluteUrl) return null;

	const absoluteThumb = ensureAbsoluteUrl(typeof thumb === 'string' ? thumb : undefined);

	return {
		id: Number.isFinite(parsedId) ? Number(parsedId) : undefined,
		url: absoluteUrl,
		thumb: absoluteThumb ?? absoluteUrl,
		alt: candidate.alt ?? candidate.alt_text ?? candidate.custom_properties?.alt ?? null,
	};
};

export const normalizeCategory = (category: any): ICategory => {
	const primaryImage =
		normalizeCategoryImage(category.image) ??
		normalizeCategoryImage(category.primary_image) ??
		normalizeCategoryImage(category.primaryImage) ??
		null;

	const rawGallery =
		category.gallery ??
		category.images ??
		category.media ??
		(category.image && Array.isArray(category.image) ? category.image : []);

	const gallery: ICategoryImage[] = Array.isArray(rawGallery)
		? rawGallery
				.map((item: any) => normalizeCategoryImage(item))
				.filter((v): v is ICategoryImage => Boolean(v?.url))
		: [];

	return {
		id: Number(category.id),
		company_id: category.company_id ?? category.company?.id ?? undefined,
		name: category.name ?? '',
		slug: category.slug ?? undefined,
		// Some backends send description under different keys
		description:
			(typeof category.description === 'string' && category.description.length
				? category.description
				: typeof category.content === 'string' && category.content.length
				? category.content
				: typeof category.details === 'string' && category.details.length
				? category.details
				: typeof category.summary === 'string' && category.summary.length
				? category.summary
				: typeof category.meta?.description === 'string' && category.meta.description.length
				? category.meta.description
				: null),
		parent_id: category.parent_id ?? category.parent?.id ?? null,
		parent_name: category.parent_name ?? category.parent?.name ?? null,
		children_count: category.children_count ?? category.children?.length ?? 0,
		// Some endpoints return the product count as `associated_products`.
		// Normalize all variants into `products_count` used by the UI.
		products_count: Number(
			category.products_count ??
			category.associated_products ??
			category.products_total ??
			0,
		),
		is_active: Boolean(category.is_active ?? category.active ?? true),
		created_at: category.created_at ?? new Date().toISOString(),
		updated_at: category.updated_at ?? new Date().toISOString(),
		image: primaryImage,
		gallery,
	};
};

export const computeCategoryStats = (items: ICategory[]): CategoryStatsShape => {
	if (!items.length) return { ...CATEGORY_EMPTY_STATS };

	const total_categories = items.length;
	const active_categories = items.filter((category) => category.is_active).length;
	const inactive_categories = total_categories - active_categories;
	const products_total = items.reduce((sum, category) => sum + (category.products_count || 0), 0);

	return {
		total_categories,
		active_categories,
		inactive_categories,
		products_total,
	};
};

export const buildCategoryPayload = (
	data: Partial<CreateCategoryPayload>,
): CreateCategoryPayload => ({
	name: data.name ?? '',
	description: data.description ?? undefined,
	parent_id: (() => {
		if (data.parent_id === undefined) return undefined;
		if (data.parent_id === null) return null;
		const value = Number(data.parent_id);
		return Number.isFinite(value) ? value : undefined;
	})(),
	is_active: data.is_active ?? true,
});

export const normalizeCategoryTree = (nodes: any[]): ICategoryTreeNode[] =>
	(nodes ?? []).map((node) => ({
		id: Number(node.id),
		name: node.name ?? '',
		children: normalizeCategoryTree(node.children ?? []),
	}));

export const flattenCategoryTree = (
	nodes: ICategoryTreeNode[],
	depth = 0,
): Array<{ id: number; name: string }> => {
	const result: Array<{ id: number; name: string }> = [];
	nodes.forEach((node) => {
		result.push({
			id: node.id,
			name: `${'-- '.repeat(depth)}${node.name}`,
		});
		if (node.children?.length) {
			result.push(...flattenCategoryTree(node.children, depth + 1));
		}
	});

	return result;
};

const resolveFallbackParentNames = (
	category: ICategory,
	categoriesMap: Map<number, ICategory>,
): string[] => {
	const parentNames: string[] = [];
	const visited = new Set<number>();
	let current: ICategory | undefined = category;

	while (current?.parent_id !== null && current?.parent_id !== undefined) {
		const parent = categoriesMap.get(current.parent_id);
		if (!parent || visited.has(parent.id)) break;
		parentNames.unshift(parent.name);
		visited.add(parent.id);
		current = parent;
	}

	if (!parentNames.length && category.parent_name) {
		parentNames.push(category.parent_name);
	}

	return parentNames;
};

const buildChildrenMap = (categories: ICategory[]): Map<number | null, ICategory[]> => {
	const map = new Map<number | null, ICategory[]>();
	categories.forEach((category) => {
		const key = category.parent_id ?? null;
		const list = map.get(key);
		if (list) {
			list.push(category);
		} else {
			map.set(key, [category]);
		}
	});
	return map;
};

const normalizeParentNames = (names: string[]): string[] =>
	names
		.map((name) => (typeof name === 'string' ? name.trim() : ''))
		.filter((name) => Boolean(name.length));

const buildTreeParentNamesMap = (nodes: ICategoryTreeNode[]): Map<number, string[]> => {
	const parentNamesMap = new Map<number, string[]>();

	const traverse = (currentNodes: ICategoryTreeNode[], ancestorNames: string[]) => {
		currentNodes.forEach((node) => {
			const id = Number(node.id);
			parentNamesMap.set(id, [...ancestorNames]);

			const nextAncestorNames = [...ancestorNames, node.name ?? ''];
			traverse(node.children ?? [], nextAncestorNames);
		});
	};

	traverse(nodes ?? [], []);
	return parentNamesMap;
};

const buildAncestorChain = (
	category: ICategory,
	categoriesMap: Map<number, ICategory>,
): ICategory[] => {
	const chain: ICategory[] = [];
	const visited = new Set<number>();
	let current: ICategory | undefined = category;

	while (current?.parent_id !== null && current?.parent_id !== undefined) {
		const parent = categoriesMap.get(current.parent_id);
		if (!parent || visited.has(parent.id)) break;
		chain.unshift(parent);
		visited.add(parent.id);
		current = parent;
	}

	return chain;
};

export const buildCategoryTableRows = (
	categories: ICategory[],
	tree: ICategoryTreeNode[],
): CategoryTableRow[] => {
	if (!categories.length) return [];

	const categoriesMap = new Map<number, ICategory>();
	categories.forEach((category) => {
		categoriesMap.set(category.id, category);
	});

	const treeParentNamesMap = buildTreeParentNamesMap(tree ?? []);
	const childrenMap = buildChildrenMap(categories);

	const rows: CategoryTableRow[] = [];
	const visited = new Set<number>();

	const visit = (category: ICategory, ancestorCategories: ICategory[]) => {
		if (visited.has(category.id)) return;

		const parentNamesFromTree = normalizeParentNames(treeParentNamesMap.get(category.id) ?? []);
		const ancestorNames = normalizeParentNames(
			ancestorCategories.map((ancestor) => ancestor.name),
		);
		const fallbackParentNames = normalizeParentNames(
			resolveFallbackParentNames(category, categoriesMap),
		);

		const parentNames = parentNamesFromTree.length
			? parentNamesFromTree
			: ancestorNames.length
				? ancestorNames
				: fallbackParentNames;
		const normalizedParentNames = parentNames;

		rows.push({
			category,
			depth: normalizedParentNames.length,
			parentNames: normalizedParentNames,
		});
		visited.add(category.id);

		const children = childrenMap.get(category.id) ?? [];
		if (!children.length) return;

		const nextAncestors = [...ancestorCategories, category];
		children.forEach((child) => visit(child, nextAncestors));
	};

	const roots: ICategory[] = [];
	const seenRootIds = new Set<number>();

	categories.forEach((category) => {
		const parentId = category.parent_id ?? null;
		const hasParent = parentId !== null;
		const parentExists = hasParent ? categoriesMap.has(parentId) : false;

		if (!hasParent || !parentExists) {
			if (!seenRootIds.has(category.id)) {
				roots.push(category);
				seenRootIds.add(category.id);
			}
		}
	});

	roots.forEach((root) => visit(root, []));

	categories.forEach((category) => {
		if (visited.has(category.id)) return;
		const ancestorChain = buildAncestorChain(category, categoriesMap);
		visit(category, ancestorChain);
	});

	return rows;
};

export const buildCategoryParentOptions = (
	categories: ICategory[],
	tree: ICategoryTreeNode[],
): Array<{ id: number; name: string }> => {
	const rows = buildCategoryTableRows(categories, tree);
	if (!rows.length) {
		return categories.map((category) => ({
			id: category.id,
			name: category.name,
		}));
	}

	return rows.map(({ category, depth }) => ({
		id: category.id,
		name: `${'-- '.repeat(depth)}${category.name}`,
	}));
};
