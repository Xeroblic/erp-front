import React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle, FontFamily, FontSize } from '@tiptap/extension-text-style';
import './RichTextEditor.css';

interface RichTextEditorProps {
	value?: string;
	onChange?: (html: string) => void;
	placeholder?: string;
	minHeight?: string;
	maxHeight?: string;
	disabled?: boolean;
	className?: string;
	showToolbar?: boolean;
	compact?: boolean;
}

interface MenuBarProps {
	editor: Editor | null;
	compact?: boolean;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor, compact = false }) => {
	if (!editor) return null;

	const ToolbarButton = ({
		onClick,
		isActive,
		children,
		title,
	}: {
		onClick: () => void;
		isActive: boolean;
		children: React.ReactNode;
		title: string;
	}) => (
		<button
			type='button'
			onClick={onClick}
			title={title}
			className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors ${
				isActive
					? 'bg-blue-500 text-white'
					: 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
			} `}>
			{children}
		</button>
	);

	const ToolbarDivider = () => <div className='mx-1 h-6 w-px bg-zinc-300 dark:bg-zinc-600' />;

	const fontFamilies = [
		{ value: '', label: 'Fuente' },
		{ value: 'Inter, system-ui, sans-serif', label: 'Inter (Default)' },
		{ value: 'Arial, sans-serif', label: 'Arial' },
		{ value: 'Georgia, serif', label: 'Georgia' },
		{ value: 'Times New Roman, serif', label: 'Times New Roman' },
		{ value: 'Courier New, monospace', label: 'Courier New' },
		{ value: 'Comic Sans MS, cursive', label: 'Comic Sans' },
		{ value: 'Verdana, sans-serif', label: 'Verdana' },
	];

	const fontSizes = [
		{ value: '', label: 'Tamaño' },
		{ value: '12px', label: '12px' },
		{ value: '14px', label: '14px' },
		{ value: '16px', label: '16px' },
		{ value: '18px', label: '18px' },
		{ value: '20px', label: '20px' },
		{ value: '24px', label: '24px' },
		{ value: '28px', label: '28px' },
		{ value: '32px', label: '32px' },
	];

	return (
		<div className='flex flex-col border-b border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800'>
			{/* Font Controls Row */}
			{!compact && (
				<div className='flex items-center gap-2 border-b border-zinc-200 p-2 dark:border-zinc-700'>
					<select
						onChange={(e) => {
							if (e.target.value) {
								editor.chain().focus().setFontFamily(e.target.value).run();
							} else {
								editor.chain().focus().unsetFontFamily().run();
							}
						}}
						className='h-8 rounded border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
						value={editor.getAttributes('textStyle').fontFamily || ''}>
						{fontFamilies.map((font) => (
							<option key={font.value} value={font.value}>
								{font.label}
							</option>
						))}
					</select>

					<select
						onChange={(e) => {
							if (e.target.value) {
								editor.chain().focus().setFontSize(e.target.value).run();
							} else {
								editor.chain().focus().unsetFontSize().run();
							}
						}}
						className='h-8 rounded border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'>
						{fontSizes.map((size) => (
							<option key={size.value} value={size.value}>
								{size.label}
							</option>
						))}
					</select>
				</div>
			)}

			{/* Main Toolbar */}
			<div className='flex flex-wrap items-center gap-1 p-2'>
				{/* Text Formatting */}
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBold().run()}
					isActive={editor.isActive('bold')}
					title='Bold (Ctrl+B)'>
					<strong>B</strong>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleItalic().run()}
					isActive={editor.isActive('italic')}
					title='Italic (Ctrl+I)'>
					<em>I</em>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					isActive={editor.isActive('underline')}
					title='Underline (Ctrl+U)'>
					<u>U</u>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleStrike().run()}
					isActive={editor.isActive('strike')}
					title='Strikethrough'>
					<s>S</s>
				</ToolbarButton>

				<ToolbarDivider />

				{/* Headings */}
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
					isActive={editor.isActive('heading', { level: 1 })}
					title='Heading 1'>
					H1
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					isActive={editor.isActive('heading', { level: 2 })}
					title='Heading 2'>
					H2
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
					isActive={editor.isActive('heading', { level: 3 })}
					title='Heading 3'>
					H3
				</ToolbarButton>

				<ToolbarDivider />

				{/* Lists */}
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					isActive={editor.isActive('bulletList')}
					title='Bullet List'>
					<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
						<circle cx='2' cy='3' r='1.5' />
						<circle cx='2' cy='8' r='1.5' />
						<circle cx='2' cy='13' r='1.5' />
						<rect x='5' y='2' width='10' height='2' rx='1' />
						<rect x='5' y='7' width='10' height='2' rx='1' />
						<rect x='5' y='12' width='10' height='2' rx='1' />
					</svg>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					isActive={editor.isActive('orderedList')}
					title='Numbered List'>
					<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
						<text x='0' y='5' fontSize='6' fontWeight='bold'>
							1.
						</text>
						<text x='0' y='10' fontSize='6' fontWeight='bold'>
							2.
						</text>
						<text x='0' y='15' fontSize='6' fontWeight='bold'>
							3.
						</text>
						<rect x='5' y='2' width='10' height='2' rx='1' />
						<rect x='5' y='7' width='10' height='2' rx='1' />
						<rect x='5' y='12' width='10' height='2' rx='1' />
					</svg>
				</ToolbarButton>

				{!compact && (
					<>
						<ToolbarDivider />

						{/* Quote & Code */}
						<ToolbarButton
							onClick={() => editor.chain().focus().toggleBlockquote().run()}
							isActive={editor.isActive('blockquote')}
							title='Blockquote'>
							<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
								<path d='M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h8v2H2v-2z' />
							</svg>
						</ToolbarButton>
						<ToolbarButton
							onClick={() => editor.chain().focus().toggleCodeBlock().run()}
							isActive={editor.isActive('codeBlock')}
							title='Code Block'>
							<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
								<path d='M5 4L1 8l4 4M11 4l4 4-4 4' />
							</svg>
						</ToolbarButton>
					</>
				)}

				<ToolbarDivider />

				{/* Actions */}
				<ToolbarButton
					onClick={() => editor.chain().focus().undo().run()}
					isActive={false}
					title='Undo (Ctrl+Z)'>
					<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
						<path d='M3 8h8c1.1 0 2 .9 2 2s-.9 2-2 2H7v2h4c2.2 0 4-1.8 4-4s-1.8-4-4-4H3l2-2-1.4-1.4L0 6.6l3.6 3.6L5 8.8 3 8z' />
					</svg>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().redo().run()}
					isActive={false}
					title='Redo (Ctrl+Shift+Z)'>
					<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
						<path d='M13 8H5c-1.1 0-2 .9-2 2s.9 2 2 2h4v2H5c-2.2 0-4-1.8-4-4s1.8-4 4-4h8l-2-2 1.4-1.4L16 6.6l-3.6 3.6L11 8.8l2-0.8z' />
					</svg>
				</ToolbarButton>
			</div>
		</div>
	);
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
	value = '',
	onChange,
	placeholder = 'Escribe aquí...',
	minHeight = '200px',
	maxHeight = '500px',
	disabled = false,
	className = '',
	showToolbar = true,
	compact = false,
}) => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: false, // Usaremos la extensión personalizada
			}),
			Heading.configure({
				levels: [1, 2, 3, 4, 5, 6],
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: 'text-blue-600 underline dark:text-blue-400',
				},
			}),
			Placeholder.configure({
				placeholder,
			}),
			TextAlign.configure({
				types: ['heading', 'paragraph'],
			}),
			Underline,
			TextStyle,
			FontFamily.configure({
				types: ['textStyle'],
			}),
			FontSize.configure({
				types: ['textStyle'],
			}),
		],
		content: value,
		editable: !disabled,
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			onChange?.(html);
		},
		editorProps: {
			attributes: {
				class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none`,
			},
		},
	});

	// Actualizar contenido cuando cambia value externamente
	React.useEffect(() => {
		if (editor && value !== editor.getHTML()) {
			editor.commands.setContent(value);
		}
	}, [value, editor]);

	return (
		<div
			className={`overflow-hidden rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className} `}>
			{showToolbar && <MenuBar editor={editor} compact={compact} />}
			<div
				className='overflow-y-auto px-4 py-3'
				style={{
					minHeight: minHeight,
					maxHeight: maxHeight,
				}}>
				<EditorContent editor={editor} />
			</div>
		</div>
	);
};

export default RichTextEditor;
