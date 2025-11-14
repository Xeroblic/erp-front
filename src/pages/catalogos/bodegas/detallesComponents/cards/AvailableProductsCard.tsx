import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import AvailableProductsTable from '../tables/AvailableProductsTable';
import type { IProduct } from '@/interface/product.interface';

interface AvailableProductsCardProps {
	products: IProduct[];
	loading: boolean;
	onAttachProduct: (product: IProduct) => void;
}

const AvailableProductsCard: React.FC<AvailableProductsCardProps> = ({
	products,
	loading,
	onAttachProduct,
}) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Productos Disponibles</CardTitle>
			</CardHeader>
			<CardBody>
				<AvailableProductsTable
					products={products}
					loading={loading}
					onAttachProduct={onAttachProduct}
				/>
			</CardBody>
		</Card>
	);
};

export default AvailableProductsCard;
