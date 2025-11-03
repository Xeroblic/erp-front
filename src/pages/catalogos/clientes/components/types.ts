// Filtros para la búsqueda de customer-suppliers
export interface ICustomerSupplierFilters {
  search: string;
}

// Estadísticas simplificadas de customer-suppliers
export interface ICustomerSupplierStats {
  total_customers: number;
  with_suppliers: number;
  without_suppliers: number;
  total_suppliers_relations: number;
}
