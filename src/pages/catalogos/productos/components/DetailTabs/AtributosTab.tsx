import React from 'react';
import DynamicAttributesEditor from './DynamicAttributesEditor';

const AtributosTab: React.FC = () => {
	return (
		<div className='space-y-6'>
			<div className='rounded-lg border border-gray-200 bg-white p-6'>
				<div className='mb-4 border-b border-gray-200 pb-4'>
					<h3 className='text-lg font-semibold text-gray-900'>Atributos del producto</h3>
					<p className='text-sm text-gray-600'>
						Configure las especificaciones tecnicas del producto segun su tipo
					</p>
				</div>

				<DynamicAttributesEditor />
			</div>
		</div>
	);
};

export default AtributosTab;
