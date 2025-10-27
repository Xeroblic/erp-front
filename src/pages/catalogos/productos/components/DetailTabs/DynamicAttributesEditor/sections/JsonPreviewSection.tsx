import React from 'react';
import { useFormikContext } from 'formik';
import { formatAttributesPreview } from '@/pages/catalogos/productos/utils/dynamicAttributes.utils';
import type { ProductDetailForm } from '../../../../types/products.types';

const JsonPreviewSection: React.FC = () => {
	const { values } = useFormikContext<ProductDetailForm>();

	const preview = formatAttributesPreview(values.attributes_json);
	const hasContent = preview.trim().length > 0;

	return (
		<div className='rounded-lg border p-4'>
			<div className='mb-2 flex items-center justify-between'>
				<h4 className='text-sm font-medium'>Vista previa del JSON</h4>
				<span className='text-xs text-neutral-500'>Solo lectura</span>
			</div>
			<pre className='max-h-60 overflow-auto rounded border p-3 text-xs'>
				{hasContent ? preview : 'Sin atributos cargados'}
			</pre>
		</div>
	);
};

export default JsonPreviewSection;
