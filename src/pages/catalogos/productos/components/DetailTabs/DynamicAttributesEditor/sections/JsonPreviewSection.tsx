import React from 'react';
import type { AttributesData } from '../types';

interface JsonPreviewSectionProps {
	attributes: AttributesData;
}

const JsonPreviewSection: React.FC<JsonPreviewSectionProps> = ({ attributes }) => {
	return (
		<div className='rounded-lg border p-4'>
			<h4 className='mb-4 text-sm font-medium'>Vista previa del JSON</h4>
			<pre className='max-h-60 overflow-auto rounded border bg-gray-50 p-3 text-xs'>
				{JSON.stringify(attributes, null, 2)}
			</pre>
		</div>
	);
};

export default JsonPreviewSection;
