import React from 'react';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import Select from '@/components/form/Select';
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import type { IProduct } from '@/interface/product.interface';

interface ProductSelectorCardProps {
	products: IProduct[];
	selectedProductId: string;
	quantity: string;
	onProductChange: (value: string) => void;
	onQuantityChange: (value: string) => void;
	onAddProduct: () => void;
}

const ProductSelectorCard: React.FC<ProductSelectorCardProps> = ({
	products,
	selectedProductId,
	quantity,
	onProductChange,
	onQuantityChange,
	onAddProduct,
}) => (
	<Card>
		<CardHeader>
			<CardTitle className='flex items-center gap-3'>
				<span>
					<svg className='h-6 w-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth='2'
							d='M12 6v6m0 0v6m0-6h6m-6 0H6'
						/>
					</svg>
				</span>
				Agregar Productos
			</CardTitle>
		</CardHeader>
		<CardBody>
			<div className='space-y-4'>
				<div>
					<label className='mb-2 block text-sm font-medium'>Producto</label>
					<Select
						name='product_id'
						value={selectedProductId}
						onChange={(e) => onProductChange(e.target.value)}>
						<option value=''>Seleccionar producto</option>
						{products.map((product) => (
							<option key={product.id} value={product.id.toString()}>
								{product.name} ({product.sku}) - Stock: {product.stock ?? 0}
							</option>
						))}
					</Select>
				</div>
				<div>
					<label className='mb-2 block text-sm font-medium'>Cantidad</label>
					<Input
						name='quantity'
						type='number'
						min='1'
						step='1'
						placeholder='Cantidad a transferir'
						value={quantity}
						onChange={(e) => onQuantityChange(e.target.value)}
					/>
				</div>
				<Button
					onClick={onAddProduct}
					icon='HeroPlus'
					color='emerald'
					variant='solid'
					isDisable={!selectedProductId || !quantity}>
					Agregar Producto
				</Button>
			</div>
		</CardBody>
	</Card>
);

export default ProductSelectorCard;
