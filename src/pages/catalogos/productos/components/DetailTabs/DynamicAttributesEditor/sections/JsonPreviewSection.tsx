import React from 'react';
import { useFormikContext } from 'formik';
import type { ProductDetailForm } from '../../../../types/products.types';
import type { AttributesJson } from '../../../../types/attributes.types';

const toRecord = (value: AttributesJson): Record<string, unknown> | null => {
	if (!value || typeof value !== 'object') {
		return null;
	}

	return value as unknown as Record<string, unknown>;
};

const JsonPreviewSection: React.FC = () => {
	const { values } = useFormikContext<ProductDetailForm>();

	const preview = toRecord(values.attributes_json);
	const hasContent = preview ? Object.keys(preview).length > 0 : false;

	return (
		<div className='rounded-lg border p-4'>
			<div className='mb-2 flex items-center justify-between'>
				<h4 className='text-sm font-medium'>Vista previa del JSON</h4>
				<span className='text-xs text-neutral-500'>Solo lectura</span>
			</div>
			<pre className='max-h-60 overflow-auto rounded border p-3 text-xs'>
				{hasContent ? JSON.stringify(preview, null, 2) : 'Sin atributos cargados'}
			</pre>
		</div>
	);
};

export default JsonPreviewSection;
