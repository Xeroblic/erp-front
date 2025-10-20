import React, { useRef } from 'react';
import { useFormikContext } from 'formik';
import Textarea from '@/components/form/Textarea';
import type { ProductDetailForm } from '../../types/products.types';

interface ContenidoTabProps {
	onUploadFile?: (file?: File | null) => Promise<void>;
	onOpenLibrary?: () => void;
}

const ContenidoTab: React.FC<ContenidoTabProps> = ({ onUploadFile, onOpenLibrary }) => {
	const { values, errors, touched, setFieldValue } = useFormikContext<ProductDetailForm>();
	const fileRef = useRef<HTMLInputElement | null>(null);

	return (
		<div className='space-y-4'>
			<div className='space-y-1'>
				<label className='text-sm font-medium'>Descripción corta</label>
				<Textarea
					name='snippet_description'
					placeholder='Descripción breve del producto...'
					value={values.snippet_description}
					onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
						setFieldValue('snippet_description', event.target.value)
					}
					rows={3}
				/>
				{touched.snippet_description && errors.snippet_description && (
					<p className='text-xs text-red-500'>{errors.snippet_description}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>Descripción resumida</label>
				<Textarea
					name='short_description'
					placeholder='Descripción resumida del producto...'
					value={values.short_description}
					onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
						setFieldValue('short_description', event.target.value)
					}
					rows={4}
				/>
				{touched.short_description && errors.short_description && (
					<p className='text-xs text-red-500'>{errors.short_description}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>Descripción detallada</label>
				<Textarea
					name='long_description'
					placeholder='Descripción completa del producto con todas sus características...'
					value={values.long_description}
					onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
						setFieldValue('long_description', event.target.value)
					}
					rows={6}
				/>
				{touched.long_description && errors.long_description && (
					<p className='text-xs text-red-500'>{errors.long_description}</p>
				)}
			</div>

			<div className='space-y-1'>
				<label className='text-sm font-medium'>Imágenes / Media</label>
				<div className='flex items-center gap-2'>
					<input
						ref={fileRef}
						type='file'
						accept='image/*'
						className='hidden'
						id='product-image-input'
					/>
					<button
						className='rounded border px-3 py-2 text-sm'
						onClick={() => fileRef.current?.click()}>
						Seleccionar imagen
					</button>
					<button
						className='rounded bg-blue-600 px-3 py-2 text-sm text-white'
						onClick={async () => {
							const file = fileRef.current?.files?.[0] ?? null;
							if (!file) return;
							await onUploadFile?.(file);
							if (fileRef.current) fileRef.current.value = '';
						}}>
						Subir imagen
					</button>
					<button
						className='rounded border px-3 py-2 text-sm'
						onClick={() => onOpenLibrary?.()}>
						Abrir biblioteca
					</button>
				</div>
			</div>
		</div>
	);
};

export default ContenidoTab;
