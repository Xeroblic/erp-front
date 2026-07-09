import React, { useMemo } from 'react';
import { useFormikContext } from 'formik';
import type { ProductDetailForm } from '@/pages/catalogos/productos/types/products.types';

const JsonPreviewSection: React.FC = () => {
	const { values } = useFormikContext<ProductDetailForm>();

	const json = useMemo(() => {
		try {
			return JSON.stringify(values.attributes_json ?? {}, null, 2);
		} catch {
			return '{}';
		}
	}, [values.attributes_json]);

	return (
		<div className='space-y-2'>
			<p className='text-xs text-neutral-500 dark:text-neutral-400'>
				Vista previa del JSON que se guardará en <code>attributes_json</code>.
			</p>
			<pre className='max-h-[500px] overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'>
				{json}
			</pre>
		</div>
	);
};

export default JsonPreviewSection;
