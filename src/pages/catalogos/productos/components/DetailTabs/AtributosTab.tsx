import React from 'react';
import DynamicAttributesEditor from './DynamicAttributesEditor';
import type { IProduct } from '@/interface/product.interface';

interface AtributosTabProps {
	loading?: boolean;
	product?: IProduct | null;
	updateProduct?: (payload: { data: Partial<IProduct>; categoryIds?: number[] }) => Promise<void>;
}

const AtributosTab: React.FC<AtributosTabProps> = ({
	loading = false,
	product = null,
	updateProduct,
}) => {
	return (
		<div className='space-y-6'>
			<div className='rounded-lg'>
				<div className='mb-4 pb-4'>
					<h3 className='text-lg font-semibold text-gray-900'>Atributos del producto</h3>
					<p className='text-sm text-gray-600'>
						Configure las especificaciones tecnicas del producto segun su tipo
					</p>
				</div>

				{loading ? (
					<div className='flex items-center gap-3 text-sm text-neutral-500'>
						<div className='h-4 w-4 animate-spin rounded-full' />
						Cargando atributos del producto...
					</div>
				) : (
					<DynamicAttributesEditor product={product} updateProduct={updateProduct} />
				)}
			</div>
		</div>
	);
};

export default AtributosTab;
