import React, { useRef } from 'react';
import { useFormikContext } from 'formik';
import RichTextEditor from '@/components/ui/RichTextEditor';
import type { ProductDetailForm } from '../../types/products.types';
import Input from '@/components/form/Input';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';

interface ContenidoTabProps {
	onUploadFile?: (file?: File | null) => Promise<void>;
	onOpenLibrary?: () => void;
}

const ContenidoTab: React.FC<ContenidoTabProps> = ({ onUploadFile, onOpenLibrary }) => {
	const { values, errors, touched, setFieldValue } = useFormikContext<ProductDetailForm>();
	const fileRef = useRef<HTMLInputElement | null>(null);

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
					compact={true}
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
				/>
				{touched.long_description && errors.long_description && (
					<p className='text-xs text-red-500'>{errors.long_description}</p>
				)}
			</div>

			{/* Sección de imágenes */}
			<div className='space-y-2 border-t pt-6'>
				<Label htmlFor='imagenes_media' className='text-sm font-medium'>
					Imágenes / Media
				</Label>
				<div className='flex flex-wrap items-center gap-2'>
					<Input
						name='imagen'
						ref={fileRef}
						type='file'
						accept='image/*'
						className='hidden'
						id='product-image-input'
					/>
					<Button variant='outline' onClick={() => fileRef.current?.click()}>
						Seleccionar imagen
					</Button>
					<Button
						color='blue'
						onClick={async () => {
							const file = fileRef.current?.files?.[0] ?? null;
							if (!file) return;
							await onUploadFile?.(file);
							if (fileRef.current) fileRef.current.value = '';
						}}>
						Subir imagen
					</Button>
					<Button variant='outline' onClick={() => onOpenLibrary?.()}>
						Abrir biblioteca
					</Button>
				</div>
			</div>
		</div>
	);
};

export default ContenidoTab;
