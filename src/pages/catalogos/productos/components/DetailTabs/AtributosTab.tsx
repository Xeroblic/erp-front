import React from 'react';
import { useFormikContext } from 'formik';
import type { ProductDetailForm } from '../../types/products.types';

const AtributosTab: React.FC = () => {
	const { values } = useFormikContext<ProductDetailForm>();

	return (
		<div className='space-y-4'>
			<div className='rounded-lg border p-4'>
				<h4 className='mb-3 text-sm font-medium'>Atributos del producto</h4>
				<div className='space-y-3'>
					<div className='text-sm text-gray-600'>
						Los atributos están gestionados por el sistema de atributos dinámicos.
					</div>

					{values.attributes_json && (
						<div className='space-y-2'>
							<h5 className='text-xs font-medium uppercase tracking-wide text-gray-700'>
								Atributos configurados:
							</h5>
							<pre className='max-h-40 overflow-auto rounded border bg-gray-50 p-3 text-xs'>
								{JSON.stringify(values.attributes_json, null, 2)}
							</pre>
						</div>
					)}

					<div className='border-t pt-3 text-xs text-gray-500'>
						<p>
							Los atributos se configuran mediante el editor de atributos dinámicos.
							Este sistema permite definir propiedades personalizadas según el tipo de
							producto.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AtributosTab;
