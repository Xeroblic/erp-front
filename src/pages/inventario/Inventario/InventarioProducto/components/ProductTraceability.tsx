import OperationsTable from '@/pages/inventario/Inventario/components/traceability/OperationsTable';
import useProductTraceability, {
	type IProductTraceabilityOptions,
} from '@/pages/inventario/Inventario/InventarioProducto/hooks/useProductTraceability';

/**
 * Historial del producto en la sucursal: cada operación que lo movió, con el
 * saldo de cada ubicación antes y después. Al desplegar una operación se ve
 * completa y el producto queda destacado entre los demás.
 */
const ProductTraceability = (props: IProductTraceabilityOptions) => {
	const { data, warehouses, paginate } = useProductTraceability(props);
	return (
		<OperationsTable
			title='Trazabilidad'
			description='Cada operación que movió o documentó este producto en la sucursal, de la más nueva a la más antigua.'
			data={data}
			warehouses={warehouses}
			hasFilters={false}
			highlightMatches
			onPaginate={paginate}
		/>
	);
};

export default ProductTraceability;
