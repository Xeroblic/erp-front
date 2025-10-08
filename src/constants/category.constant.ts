export interface CategoryStatsShape {
  total_categories: number;
  active_categories: number;
  inactive_categories: number;
  products_total: number;
}

export const CATEGORY_EMPTY_STATS: CategoryStatsShape = Object.freeze({
  total_categories: 0,
  active_categories: 0,
  inactive_categories: 0,
  products_total: 0,
});

