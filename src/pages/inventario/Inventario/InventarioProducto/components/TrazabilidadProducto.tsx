import OperacionesTable from '@/pages/inventario/Inventario/components/trazabilidad/OperacionesTable';
import useTrazabilidadProducto, {
	type ITrazabilidadProductoOptions,
} from '@/pages/inventario/Inventario/InventarioProducto/hooks/useTrazabilidadProducto';

/**
 * Historial del producto en la sucursal: cada operación que lo movió, con el
 * saldo de cada ubicación antes y después. Al desplegar una operación se ve
 * completa y el producto queda destacado entre los demás.
 */
const TrazabilidadProducto = (props: ITrazabilidadProductoOptions) => {
	const { data, warehouses, paginate } = useTrazabilidadProducto(props);
	return (
		<OperacionesTable
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

export default TrazabilidadProducto;
