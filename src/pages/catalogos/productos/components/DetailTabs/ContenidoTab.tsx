import React from 'react';
import { useFormikContext } from 'formik';
import RichTextEditor from '@/components/ui/RichTextEditor';
import type { ProductDetailForm } from '../../types/products.types';
import Label from '@/components/form/Label';

const ContenidoTab = () => {
	const { values, errors, touched, setFieldValue } = useFormikContext<ProductDetailForm>();

	return (
		<div className='space-y-6'>
			{/* Descripción corta - Editor compacto */}
			<div className='space-y-2'>
				<Label htmlFor='snippet_description' className='text-sm font-medium'>
					Descripción corta
					<span className='ml-2 text-xs text-zinc-500'>
						(Ideal para listados y previsualizaciones)
					</span>
				</Label>
				<RichTextEditor
					value={values.snippet_description || ''}
					onChange={(html) => setFieldValue('snippet_description', html)}
					placeholder='Escribe una descripción breve del producto (1-2 líneas)...'
					minHeight='120px'
					maxHeight='200px'
					compact={false}
					resizable
				/>
				{touched.snippet_description && errors.snippet_description && (
					<p className='text-xs text-red-500'>{errors.snippet_description}</p>
				)}
			</div>

			{/* Descripción resumida - Editor medio */}
			<div className='space-y-2'>
				<Label htmlFor='short_description' className='text-sm font-medium'>
					Descripción resumida
					<span className='ml-2 text-xs text-zinc-500'>
						(Resumen de características principales)
					</span>
				</Label>
				<RichTextEditor
					value={values.short_description || ''}
					onChange={(html) => setFieldValue('short_description', html)}
					placeholder='Describe las características principales del producto...'
					minHeight='200px'
					maxHeight='300px'
					compact={false}
					resizable
				/>
				{touched.short_description && errors.short_description && (
					<p className='text-xs text-red-500'>{errors.short_description}</p>
				)}
			</div>

			{/* Descripción detallada - Editor completo */}
			<div className='space-y-2'>
				<Label htmlFor='long_description' className='text-sm font-medium'>
					Descripción detallada
					<span className='ml-2 text-xs text-zinc-500'>
						(Información completa con especificaciones técnicas)
					</span>
				</Label>
				<RichTextEditor
					value={values.long_description || ''}
					onChange={(html) => setFieldValue('long_description', html)}
					placeholder='Describe detalladamente todas las características, especificaciones técnicas, beneficios y cualquier información relevante del producto...'
					minHeight='300px'
					maxHeight='600px'
					compact={false}
					resizable
				/>
				{touched.long_description && errors.long_description && (
					<p className='text-xs text-red-500'>{errors.long_description}</p>
				)}
			</div>
		</div>
	);
};

export default ContenidoTab;
