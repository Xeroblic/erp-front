import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import AssociatedProductsTable from '../tables/AssociatedProductsTable';
import type { IWarehouseProduct } from '@/interface/warehouse.interface';
import type { IProduct } from '@/interface/product.interface';

interface AssociatedProductsCardProps {
	products: IWarehouseProduct[];
	allProducts: IProduct[];
	branchId: number;
	onRemoveProduct: (product: IWarehouseProduct) => void;
}

const AssociatedProductsCard: React.FC<AssociatedProductsCardProps> = ({
	products,
	allProducts,
	branchId,
	onRemoveProduct,
}) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Productos Asociados ({products?.length || 0})</CardTitle>
			</CardHeader>
			<CardBody>
				<AssociatedProductsTable
					products={products}
					allProducts={allProducts}
					branchId={branchId}
					onRemoveProduct={onRemoveProduct}
				/>
			</CardBody>
		</Card>
	);
};

export default AssociatedProductsCard;
