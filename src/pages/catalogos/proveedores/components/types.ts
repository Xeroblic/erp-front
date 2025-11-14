// Filtros para la búsqueda de suppliers
export interface ISupplierFilters {
  search: string;
}

// Estadísticas simplificadas de suppliers
export interface ISupplierStats {
  total_suppliers: number;
  with_customers: number;
  without_customers: number;
  total_customer_relations: number;
}