/**
 * EJEMPLOS DE USO DEL RICH TEXT EDITOR
 * ====================================
 *
 * Este archivo contiene ejemplos completos de cómo usar el RichTextEditor
 * en diferentes contextos.
 */

import React, { useState } from 'react';
import { useFormikContext, Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useDebouncedCallback } from 'use-debounce';
import RichTextEditor from '@/components/ui/RichTextEditor';
import Button from '@/components/ui/Button';
import Label from '@/components/form/Label';

// ============================================
// EJEMPLO 5: Con Debounce (Performance)
// ============================================

// ============================================
// EJEMPLO 9: Editor en Modal
// ============================================
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';

// ============================================
// EJEMPLO 1: Uso Simple con useState
// ============================================
export const SimpleExample = () => {
	const [content, setContent] = useState('<p>Contenido inicial</p>');

	return (
		<div className='space-y-4'>
			<RichTextEditor
				value={content}
				onChange={setContent}
				placeholder='Escribe algo...'
				minHeight='200px'
			/>
			<Button onClick={() => console.log(content)}>Ver HTML</Button>
		</div>
	);
};

// ============================================
// EJEMPLO 2: Con Formik (Recomendado)
// ============================================
const validationSchema = Yup.object({
	title: Yup.string().required('Título requerido'),
	description: Yup.string().required('Descripción requerida'),
});

const EditorFormField = () => {
	const { values, errors, touched, setFieldValue } = useFormikContext<{
		title: string;
		description: string;
	}>();

	return (
		<div className='space-y-2'>
			<Label htmlFor='description'>Descripción *</Label>
			<RichTextEditor
				value={values.description}
				onChange={(html) => setFieldValue('description', html)}
				placeholder='Escribe la descripción del producto...'
				minHeight='300px'
				maxHeight='600px'
			/>
			{touched.description && errors.description && (
				<p className='text-xs text-red-500'>{errors.description}</p>
			)}
		</div>
	);
};

export const FormikExample = () => {
	return (
		<Formik
			initialValues={{
				title: '',
				description: '',
			}}
			validationSchema={validationSchema}
			onSubmit={(values) => {
				console.log('Submitted:', values);
				// values.description ya es HTML listo para guardar
			}}>
			<Form className='space-y-4'>
				<EditorFormField />
				<Button type='submit'>Guardar</Button>
			</Form>
		</Formik>
	);
};

// ============================================
// EJEMPLO 3: Múltiples Editores (3 descripciones)
// ============================================
export const MultipleEditorsExample = () => {
	const { values, setFieldValue } = useFormikContext<{
		snippet_description: string;
		short_description: string;
		long_description: string;
	}>();

	return (
		<div className='space-y-6'>
			{/* Descripción Corta - Compacta */}
			<div className='space-y-2'>
				<Label htmlFor='snippet_description'>
					Descripción Corta
					<span className='ml-2 text-xs text-zinc-500'>(Para listados)</span>
				</Label>
				<RichTextEditor
					value={values.snippet_description}
					onChange={(html) => setFieldValue('snippet_description', html)}
					placeholder='1-2 líneas breves...'
					minHeight='120px'
					maxHeight='200px'
					compact // Toolbar simplificado
				/>
			</div>

			{/* Descripción Media */}
			<div className='space-y-2'>
				<Label htmlFor='short_description'>
					Descripción Resumida
					<span className='ml-2 text-xs text-zinc-500'>
						(Características principales)
					</span>
				</Label>
				<RichTextEditor
					value={values.short_description}
					onChange={(html) => setFieldValue('short_description', html)}
					placeholder='Características principales...'
					minHeight='200px'
					maxHeight='350px'
				/>
			</div>

			{/* Descripción Larga - Completa */}
			<div className='space-y-2'>
				<Label htmlFor='long_description'>
					Descripción Detallada
					<span className='ml-2 text-xs text-zinc-500'>(Especificaciones completas)</span>
				</Label>
				<RichTextEditor
					value={values.long_description}
					onChange={(html) => setFieldValue('long_description', html)}
					placeholder='Descripción completa con especificaciones técnicas...'
					minHeight='300px'
					maxHeight='700px'
				/>
			</div>
		</div>
	);
};

// ============================================
// EJEMPLO 4: Editor de Solo Lectura
// ============================================
export const ReadOnlyExample = ({ htmlContent }: { htmlContent: string }) => {
	return (
		<RichTextEditor
			value={htmlContent}
			onChange={() => {}} // No hace nada
			disabled
			showToolbar={false} // Sin toolbar
			minHeight='auto'
		/>
	);
};

export const DebouncedExample = () => {
	const { setFieldValue } = useFormikContext();

	// Debounce para evitar demasiados re-renders
	const debouncedOnChange = useDebouncedCallback(
		(html: string) => {
			setFieldValue('description', html);
			// Aquí podrías hacer auto-save a la DB
		},
		500, // 500ms de delay
	);

	return (
		<RichTextEditor
			onChange={debouncedOnChange}
			placeholder='Los cambios se guardan automáticamente...'
		/>
	);
};

// ============================================
// EJEMPLO 6: Con Auto-Save
// ============================================
export const AutoSaveExample = ({ productId }: { productId: number }) => {
	const [isSaving, setIsSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	const handleChange = useDebouncedCallback(async (html: string) => {
		setIsSaving(true);
		try {
			await fetch(`/api/products/${productId}`, {
				method: 'PATCH',
				body: JSON.stringify({ description: html }),
			});
			setLastSaved(new Date());
		} finally {
			setIsSaving(false);
		}
	}, 1000);

	return (
		<div className='space-y-2'>
			<div className='flex items-center justify-between'>
				<Label htmlFor='auto_save_description'>Descripción</Label>
				<span className='text-xs text-zinc-500'>
					{isSaving
						? 'Guardando...'
						: lastSaved
							? `Guardado ${lastSaved.toLocaleTimeString()}`
							: ''}
				</span>
			</div>
			<RichTextEditor
				onChange={handleChange}
				placeholder='Los cambios se guardan automáticamente...'
			/>
		</div>
	);
};

// ============================================
// EJEMPLO 7: Editor Condicional (Expandible)
// ============================================
export const ExpandableExample = () => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [content, setContent] = useState('');

	return (
		<div className='space-y-2'>
			<div className='flex items-center justify-between'>
				<Label htmlFor='expandable_description'>Descripción</Label>
				<Button variant='outline' size='sm' onClick={() => setIsExpanded(!isExpanded)}>
					{isExpanded ? 'Contraer' : 'Expandir'}
				</Button>
			</div>
			<RichTextEditor
				value={content}
				onChange={setContent}
				minHeight={isExpanded ? '500px' : '200px'}
				maxHeight={isExpanded ? '1000px' : '400px'}
				compact={!isExpanded}
			/>
		</div>
	);
};

// ============================================
// EJEMPLO 8: Con Contador de Palabras
// ============================================
export const WordCountExample = () => {
	const [content, setContent] = useState('');

	const wordCount = content
		.replace(/<[^>]*>/g, '') // Quitar HTML tags
		.trim()
		.split(/\s+/)
		.filter(Boolean).length;

	return (
		<div className='space-y-2'>
			<div className='flex items-center justify-between'>
				<Label htmlFor='word_count_description'>Descripción</Label>
				<span className='text-xs text-zinc-500'>{wordCount} palabras</span>
			</div>
			<RichTextEditor
				value={content}
				onChange={setContent}
				placeholder='Escribe tu contenido...'
			/>
		</div>
	);
};

export const ModalExample = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [content, setContent] = useState('');

	return (
		<>
			<Button onClick={() => setIsOpen(true)}>Editar Descripción</Button>

			<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='xl'>
				<ModalHeader>Editar Descripción del Producto</ModalHeader>
				<ModalBody>
					<RichTextEditor
						value={content}
						onChange={setContent}
						minHeight='400px'
						placeholder='Escribe la descripción completa...'
					/>
				</ModalBody>
				<ModalFooter>
					<Button variant='outline' onClick={() => setIsOpen(false)}>
						Cancelar
					</Button>
					<Button
						color='blue'
						onClick={() => {
							console.log('Guardando:', content);
							setIsOpen(false);
						}}>
						Guardar
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
};

// ============================================
// EJEMPLO 10: Preview Side-by-Side
// ============================================
export const PreviewExample = () => {
	const [content, setContent] = useState('<p>Escribe aquí...</p>');

	return (
		<div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
			{/* Editor */}
			<div className='space-y-2'>
				<Label htmlFor='preview_editor'>Editor</Label>
				<RichTextEditor value={content} onChange={setContent} minHeight='400px' />
			</div>

			{/* Preview */}
			<div className='space-y-2'>
				<Label htmlFor='preview_view'>Vista Previa</Label>
				<div
					className='prose rounded-lg border p-4 dark:prose-invert'
					dangerouslySetInnerHTML={{ __html: content }}
				/>
			</div>
		</div>
	);
};
