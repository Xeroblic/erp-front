import { ICategory, ICategoryStats } from '../types';

export const mockCategories: ICategory[] = [
  {
    id: 1,
    company_id: 1,
    name: 'Electrónica',
    description: 'Dispositivos y accesorios electrónicos',
    is_active: true,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2025-05-10T10:00:00Z',
    products_count: 120,
  },
  {
    id: 2,
    company_id: 1,
    name: 'Computadores',
    description: 'Portátiles, de escritorio y accesorios',
    parent_id: 1,
    parent_name: 'Electrónica',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2025-05-10T10:10:00Z',
    products_count: 48,
  },
  {
    id: 3,
    company_id: 1,
    name: 'Telefonía',
    description: 'Celulares y accesorios',
    parent_id: 1,
    parent_name: 'Electrónica',
    is_active: true,
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2025-05-10T10:20:00Z',
    products_count: 35,
  },
  {
    id: 4,
    company_id: 1,
    name: 'Hogar',
    description: 'Artículos para el hogar',
    is_active: false,
    created_at: '2024-03-05T10:00:00Z',
    updated_at: '2025-05-09T11:00:00Z',
    products_count: 12,
  },
  {
    id: 5,
    company_id: 1,
    name: 'Cocina',
    description: 'Utensilios y electrodomésticos de cocina',
    parent_id: 4,
    parent_name: 'Hogar',
    is_active: true,
    created_at: '2024-03-10T10:00:00Z',
    updated_at: '2025-05-10T10:30:00Z',
    products_count: 25,
  },
];

export const mockCategoryStats: ICategoryStats = {
  total_categories: mockCategories.length,
  active_categories: mockCategories.filter((c) => c.is_active).length,
  inactive_categories: mockCategories.filter((c) => !c.is_active).length,
  products_total: mockCategories.reduce((acc, c) => acc + (c.products_count || 0), 0),
};

