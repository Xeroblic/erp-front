import React from 'react';
import { Extension } from '@tiptap/core';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import './RichTextEditor.css';

const rgbToHex = (value: string) => {
	const match = value
		.replace(/\s+/g, ' ')
		.match(
			/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d?\.?\d+))?\s*\)$/i,
		);

	if (!match) return value;

	const [, r, g, b] = match.map((component) => component && component.trim());
	const toHex = (component: string) => {
		const numeric = Math.max(0, Math.min(255, Number(component)));
		return numeric.toString(16).padStart(2, '0');
	};
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const sanitizeStyleAttribute = (style: string) => {
	const declarations = style
		.split(';')
		.map((declaration) => declaration.trim())
		.filter(Boolean);

	const normalized: string[] = [];
	declarations.forEach((declaration) => {
		const [propertyRaw, valueRaw] = declaration.split(':');
		if (!propertyRaw || !valueRaw) return;

		const property = propertyRaw.trim().toLowerCase();
		let value = valueRaw.trim();
		if (!value) return;

		if (['color', 'background-color', 'border-color'].includes(property)) {
			value = rgbToHex(value);
		}

		if (property === 'text-align') {
			value = value.replace(/"/g, '').toLowerCase();
		}

		normalized.push(`${property}: ${value}`);
	});

	return normalized;
};

const sanitizeHtmlOutput = (html: string) => {
	if (typeof window === 'undefined') return html;

	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	doc.body.querySelectorAll('*').forEach((node) => {
		if (!(node instanceof HTMLElement)) return;

		Array.from(node.attributes).forEach((attribute) => {
			const name = attribute.name.toLowerCase();
			if (name === 'class' || name === 'contenteditable' || name === 'spellcheck') {
				node.removeAttribute(attribute.name);
			}
		});

		const styleAttribute = node.getAttribute('style');
		if (styleAttribute) {
			const normalizedStyles = sanitizeStyleAttribute(styleAttribute);
			if (normalizedStyles.length > 0) {
				node.setAttribute('style', normalizedStyles.join('; '));
			} else {
				node.removeAttribute('style');
			}
		}

		if (node.tagName === 'A') {
			if (!node.hasAttribute('target')) node.setAttribute('target', '_blank');
			node.setAttribute('rel', 'noopener noreferrer nofollow');
			if (!node.style.textDecoration) node.style.textDecoration = 'underline';
		}
	});

	doc.body.querySelectorAll('p').forEach((paragraph) => {
		const isEmpty =
			paragraph.textContent?.trim().length === 0 && paragraph.children.length === 0;
		if (isEmpty) {
			paragraph.remove();
			return;
		}

		const align = paragraph.style.textAlign?.toLowerCase() ?? '';
		const hasOtherStyles =
			paragraph
				.getAttribute('style')
				?.split(';')
				.some((declaration) => {
					const [property, value] = declaration.split(':').map((part) => part.trim());
					if (!property || !value) return false;
					return property !== 'text-align';
				}) ?? false;

		const keepParagraph =
			hasOtherStyles ||
			(align !== '' && align !== 'left') ||
			paragraph.querySelector('img, table, pre, blockquote');

		if (keepParagraph) {
			if (align && align !== 'left') {
				paragraph.setAttribute('style', `text-align: ${align};`);
			} else if (hasOtherStyles === false) {
				paragraph.removeAttribute('style');
			}
			return;
		}

		const fragment = doc.createDocumentFragment();
		while (paragraph.firstChild) {
			fragment.appendChild(paragraph.firstChild);
		}

		const breakElement = doc.createElement('br');
		fragment.appendChild(breakElement);

		paragraph.replaceWith(fragment);
	});

	// Remove trailing <br> if present
	while (doc.body.lastChild && doc.body.lastChild.nodeName === 'BR') {
		doc.body.removeChild(doc.body.lastChild);
	}

	return doc.body.innerHTML;
};

const escapeHtml = (value: string) =>
	value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');

const highlightHtml = (value: string) => {
	const escaped = escapeHtml(value);
	const highlightAttributes = (attrs: string) =>
		attrs.replace(/([a-zA-Z_:.-]+)(\s*=\s*)("[^"]*"|'[^']*')/g, (_match, name, eq, val) => {
			return `<span style="color:#facc15">${name}</span><span style="color:#64748b">${eq}</span><span style="color:#38bdf8">${val}</span>`;
		});

	return escaped
		.replace(
			/(&lt;\/?)([a-zA-Z0-9:-]+)([\s\S]*?)(\/?&gt;)/g,
			(_match, open, tagName, attrs, close) => {
				const highlightedAttrs = highlightAttributes(attrs);
				return `<span style="color:#475569">${open}</span><span style="color:#38bdf8">${tagName}</span>${highlightedAttrs}<span style="color:#475569">${close}</span>`;
			},
		)
		.replace(/(&lt;!--[\s\S]*?--&gt;)/g, `<span style="color:#22d3ee">$1</span>`);
};

const FontSize = Extension.create({
	name: 'fontSize',
	addOptions() {
		return {
			types: ['textStyle'],
		};
	},
	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					fontSize: {
						default: null,
						renderHTML: (attributes) => {
							if (!attributes.fontSize) return {};
							return { style: `font-size: ${attributes.fontSize}` };
						},
						parseHTML: (element) => element.style.fontSize || '',
					},
				},
			},
		];
	},
	addCommands() {
		return {
			setFontSize:
				(fontSize: string) =>
				({ chain }) =>
					chain()
						.setMark('textStyle', fontSize ? { fontSize } : {})
						.run(),
			unsetFontSize:
				() =>
				({ chain }) =>
					chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
		};
	},
});

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
	resizable?: boolean;
}

interface MenuBarProps {
	editor: Editor | null;
	compact?: boolean;
	showCodeView: boolean;
	onSelectView: (showCode: boolean) => void;
}

const MenuBar: React.FC<MenuBarProps> = ({
	editor,
	compact = false,
	showCodeView,
	onSelectView,
}) => {
	if (!editor) return null;

	const [currentColor, setCurrentColor] = React.useState('#000000');

	const updateCurrentColor = React.useCallback(() => {
		const { color } = editor.getAttributes('textStyle');
		setCurrentColor(color ?? '#000000');
	}, [editor]);

	React.useEffect(() => {
		updateCurrentColor();
		editor.on('selectionUpdate', updateCurrentColor);
		editor.on('transaction', updateCurrentColor);
		return () => {
			editor.off('selectionUpdate', updateCurrentColor);
			editor.off('transaction', updateCurrentColor);
		};
	}, [editor, updateCurrentColor]);

	const handleSetLink = () => {
		const { from, to } = editor.state.selection;
		const hasSelection = from !== to;
		const selectedText = hasSelection ? editor.state.doc.textBetween(from, to, ' ') : '';

		const linkTextPrompt = window.prompt('Texto del enlace', selectedText);
		if (linkTextPrompt === null) return;

		const previousUrl = editor.getAttributes('link').href ?? '';
		const urlPrompt = window.prompt('URL del enlace', previousUrl);
		if (!urlPrompt) return;
		const linkText = (linkTextPrompt || selectedText || urlPrompt).trim();
		if (!linkText) return;

		if (hasSelection) {
			editor
				.chain()
				.focus()
				.insertContentAt({ from, to }, linkText)
				.setTextSelection({ from, to: from + linkText.length })
				.extendMarkRange('link')
				.setLink({ href: urlPrompt })
				.setTextSelection(from + linkText.length)
				.run();
		} else {
			editor
				.chain()
				.focus()
				.insertContent([
					{
						type: 'text',
						text: linkText,
						marks: [{ type: 'link', attrs: { href: urlPrompt } }],
					},
				])
				.run();
		}
	};

	const handleUnsetLink = () => {
		editor.chain().focus().extendMarkRange('link').unsetLink().run();
	};

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

	const alignmentOptions: Array<{
		value: 'left' | 'center' | 'right' | 'justify';
		label: string;
		icon: React.ReactNode;
	}> = [
		{
			value: 'left',
			label: 'Alinear a la izquierda',
			icon: (
				<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
					<rect x='2' y='3' width='12' height='2' rx='1' />
					<rect x='2' y='7' width='8' height='2' rx='1' />
					<rect x='2' y='11' width='12' height='2' rx='1' />
				</svg>
			),
		},
		{
			value: 'center',
			label: 'Centrar texto',
			icon: (
				<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
					<rect x='3' y='3' width='10' height='2' rx='1' />
					<rect x='1' y='7' width='14' height='2' rx='1' />
					<rect x='3' y='11' width='10' height='2' rx='1' />
				</svg>
			),
		},
		{
			value: 'right',
			label: 'Alinear a la derecha',
			icon: (
				<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
					<rect x='2' y='3' width='12' height='2' rx='1' />
					<rect x='6' y='7' width='8' height='2' rx='1' />
					<rect x='4' y='11' width='10' height='2' rx='1' />
				</svg>
			),
		},
		{
			value: 'justify',
			label: 'Justificar texto',
			icon: (
				<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
					<rect x='2' y='3' width='12' height='2' rx='1' />
					<rect x='2' y='7' width='12' height='2' rx='1' />
					<rect x='2' y='11' width='12' height='2' rx='1' />
				</svg>
			),
		},
	];

	const colorOptions = [
		'#111827',
		'#2563eb',
		'#16a34a',
		'#dc2626',
		'#d97706',
		'#9333ea',
		'#f97316',
		'#facc15',
	];

	const applyColor = (color: string) => {
		setCurrentColor(color);
		editor.chain().focus().setColor(color).run();
	};

	const clearColor = () => {
		setCurrentColor('#000000');
		editor.chain().focus().unsetColor().removeEmptyTextStyle().run();
	};

	return (
		<div className='flex flex-col border-b border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800'>
			{!compact && (
				<div className='flex items-center justify-start border-b border-zinc-200 p-2 dark:border-zinc-700'>
					<div className='inline-flex overflow-hidden rounded border border-zinc-300 dark:border-zinc-600'>
						<button
							type='button'
							onClick={() => onSelectView(false)}
							className={`px-3 py-1 text-sm font-medium transition-colors ${
								!showCodeView
									? 'bg-blue-500 text-white'
									: 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
							}`}>
							Texto
						</button>
						<button
							type='button'
							onClick={() => onSelectView(true)}
							className={`px-3 py-1 text-sm font-medium transition-colors ${
								showCodeView
									? 'bg-blue-500 text-white'
									: 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
							}`}>
							Codigo
						</button>
					</div>
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

				<ToolbarDivider />

				{/* Alignment */}
				{alignmentOptions.map((option) => (
					<ToolbarButton
						key={option.value}
						onClick={() => editor.chain().focus().setTextAlign(option.value).run()}
						isActive={editor.isActive({ textAlign: option.value })}
						title={option.label}>
						{option.icon}
					</ToolbarButton>
				))}

				<ToolbarDivider />

				{/* Links */}
				<ToolbarButton
					onClick={handleSetLink}
					isActive={editor.isActive('link')}
					title='Insertar enlace (Ctrl+K)'>
					<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
						<path d='M6.5 3a3.5 3.5 0 0 1 2.47 5.97l-.97.96-1.06-1.06.97-.96A1.5 1.5 0 1 0 6.5 5H4a2 2 0 1 0 0 4h1v1H4a3 3 0 1 1 0-6h2.5ZM12 4h-1V3h1a3 3 0 1 1 0 6H9.5A3.5 3.5 0 0 1 7.03 3.03l.97.97A1.5 1.5 0 0 0 9.5 7H12a2 2 0 0 0 0-4Z' />
					</svg>
				</ToolbarButton>
				<ToolbarButton onClick={handleUnsetLink} isActive={false} title='Quitar enlace'>
					<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
						<path d='M5.5 3a3.5 3.5 0 0 1 2.47 5.97l-.32.32-1.06-1.06.32-.32A1.5 1.5 0 1 0 5.5 5H4a2 2 0 0 0-1.73 3H1.5V7H0v2h4a3 3 0 0 1 0-6h1.5Zm5 2 1.5-1.5 1.06 1.06-8 8-1.06-1.06L6.56 9H6.5A3.5 3.5 0 0 1 4.03 3.03l.97.97A1.5 1.5 0 0 0 6.5 7h1.56l1.44-1.44V5h1Z' />
					</svg>
				</ToolbarButton>

				<ToolbarDivider />

				{/* Colors */}
				<div className='flex items-center gap-1'>
					{colorOptions.map((color) => (
						<button
							key={color}
							type='button'
							onClick={() => applyColor(color)}
							className={`h-6 w-6 rounded border border-zinc-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-600 ${
								currentColor === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''
							}`}
							style={{ backgroundColor: color }}
							title={`Aplicar color ${color}`}
						/>
					))}
					<button
						type='button'
						onClick={clearColor}
						className='flex h-6 w-6 items-center justify-center rounded border border-zinc-300 bg-white text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
						title='Restablecer color'>
						X
					</button>
					<input
						type='color'
						value={currentColor}
						onChange={(event) => applyColor(event.target.value)}
						className='h-6 w-12 cursor-pointer rounded border border-zinc-300 bg-white p-0 dark:border-zinc-600 dark:bg-zinc-800'
						title='Seleccionar color personalizado'
					/>
				</div>

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

				{compact && (
					<>
						<ToolbarDivider />
						<ToolbarButton
							onClick={() => onSelectView(!showCodeView)}
							isActive={showCodeView}
							title={showCodeView ? 'Volver al editor' : 'Ver codigo HTML'}>
							<svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
								<path d='M4.5 4l-3 4 3 4 1.5-1-2-3 2-3-1.5-1zm7 0l-1.5 1 2 3-2 3 1.5 1 3-4-3-4zm-4 9h2v-10h-2v10z' />
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
	placeholder = 'Escribe aqui...',
	minHeight = '200px',
	maxHeight = '500px',
	disabled = false,
	className = '',
	showToolbar = true,
	compact = false,
	resizable = false,
}) => {
	const lastSerializedRef = React.useRef<string>(sanitizeHtmlOutput(value));
	const [showCodeView, setShowCodeView] = React.useState(false);
	const [codeViewValue, setCodeViewValue] = React.useState(lastSerializedRef.current);
	const highlightPreRef = React.useRef<HTMLPreElement | null>(null);
	const showCodeViewRef = React.useRef(showCodeView);
	const skipNextOnUpdateRef = React.useRef(false);

	React.useEffect(() => {
		showCodeViewRef.current = showCodeView;
	}, [showCodeView]);
	const highlightedCode = React.useMemo(() => highlightHtml(codeViewValue), [codeViewValue]);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: false,
				link: false,
			}),
			Heading.configure({
				levels: [1, 2, 3, 4, 5, 6],
			}),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					target: '_blank',
					rel: 'noopener noreferrer nofollow',
					style: 'text-decoration: underline;',
				},
			}),
			Placeholder.configure({
				placeholder,
			}),
			TextAlign.configure({
				types: ['heading', 'paragraph'],
			}),
			Underline,
			Color.configure({
				types: ['textStyle'],
			}),
			TextStyle,
			FontFamily.configure({
				types: ['textStyle'],
			}),
			FontSize.configure({
				types: ['textStyle'],
			}),
		],
		content: lastSerializedRef.current,
		editable: !disabled,
		onUpdate: ({ editor }) => {
			if (showCodeViewRef.current) {
				return;
			}
			if (skipNextOnUpdateRef.current) {
				skipNextOnUpdateRef.current = false;
				return;
			}

			const html = sanitizeHtmlOutput(editor.getHTML());
			if (html !== lastSerializedRef.current) {
				lastSerializedRef.current = html;
				setCodeViewValue(html);
				onChange?.(html);
			}
		},
		editorProps: {
			attributes: {
				class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none`,
			},
		},
	});

	React.useEffect(() => {
		if (!editor) return;
		editor.setEditable(!showCodeView && !disabled);
	}, [editor, showCodeView, disabled]);

	// Actualizar contenido cuando cambia value externamente
	React.useEffect(() => {
		if (!editor) return;
		if (showCodeView) return;

		const canonicalValue = sanitizeHtmlOutput(value);
		const editorHtml = sanitizeHtmlOutput(editor.getHTML());

		if (canonicalValue !== lastSerializedRef.current) {
			lastSerializedRef.current = canonicalValue;
			if (showCodeView) {
				setCodeViewValue(canonicalValue);
			}
		}

		if (editorHtml !== canonicalValue) {
			editor.commands.setContent(canonicalValue, { emitUpdate: false });
		}
	}, [value, editor, showCodeView]);

	const handleSelectView = (shouldShowCode: boolean) => {
		if (shouldShowCode === showCodeView) {
			return;
		}

		if (shouldShowCode) {
			const currentHtml =
				lastSerializedRef.current ?? sanitizeHtmlOutput(editor ? editor.getHTML() : '');
			setCodeViewValue(currentHtml);
			if (highlightPreRef.current) {
				highlightPreRef.current.style.transform = 'translate(0px, 0px)';
			}
			setShowCodeView(true);
		} else {
			if (editor) {
				const sanitized = sanitizeHtmlOutput(lastSerializedRef.current);
				skipNextOnUpdateRef.current = true;
				editor.commands.setContent(sanitized, { emitUpdate: false });
			}
			setShowCodeView(false);
		}
	};

	const handleCodeEditorChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		const rawValue = event.target.value;
		setCodeViewValue(rawValue);
		lastSerializedRef.current = rawValue;
		onChange?.(rawValue);
	};

	const handleCodeEditorKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key !== 'Tab') return;

		event.preventDefault();
		const target = event.currentTarget;
		const { selectionStart, selectionEnd } = target;
		const updated = `${codeViewValue.slice(0, selectionStart)}\t${codeViewValue.slice(selectionEnd)}`;

		setCodeViewValue(updated);
		lastSerializedRef.current = updated;
		onChange?.(updated);

		requestAnimationFrame(() => {
			target.selectionStart = selectionStart + 1;
			target.selectionEnd = selectionStart + 1;
		});
	};

	const handleCodeEditorScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
		if (!highlightPreRef.current) return;
		const { scrollTop, scrollLeft } = event.currentTarget;
		highlightPreRef.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
	};

	return (
		<div
			className={`overflow-hidden rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className} `}>
			{showToolbar && (
				<MenuBar
					editor={editor}
					compact={compact}
					showCodeView={showCodeView}
					onSelectView={handleSelectView}
				/>
			)}
			<div
				className={`px-4 py-3 ${resizable ? 'resize-y overflow-auto' : 'overflow-y-auto'}`}
				style={{
					minHeight,
					...(resizable ? {} : { maxHeight }),
				}}>
				{showCodeView ? (
					<div className='relative h-full min-h-[200px] rounded border border-zinc-700 bg-[#0f172a] shadow-inner'>
						<pre
							ref={highlightPreRef}
							className='pointer-events-none absolute inset-0 min-h-full whitespace-pre-wrap break-words px-4 py-3 font-mono text-xs leading-5 text-sky-100'
							style={{ transform: 'translate(0px, 0px)' }}
							dangerouslySetInnerHTML={{ __html: highlightedCode }}
						/>
						<textarea
							spellCheck={false}
							value={codeViewValue}
							aria-label='Codigo HTML'
							onChange={handleCodeEditorChange}
							onScroll={handleCodeEditorScroll}
							onKeyDown={handleCodeEditorKeyDown}
							className='absolute inset-0 h-full w-full resize-none border-none bg-transparent px-4 py-3 font-mono text-xs leading-5 text-transparent caret-cyan-400 outline-none selection:bg-cyan-500/30'
							style={{ color: 'transparent', WebkitTextFillColor: 'transparent' }}
						/>
					</div>
				) : (
					<EditorContent editor={editor} />
				)}
			</div>
		</div>
	);
};

export default RichTextEditor;
