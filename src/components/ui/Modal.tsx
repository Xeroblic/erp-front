import React, {
	Children,
	cloneElement,
	Dispatch,
	FC,
	forwardRef,
	HTMLAttributes,
	ReactElement,
	ReactNode,
	SetStateAction,
	useEffect,
	useId,
	useRef,
	useState,
	CSSProperties,
} from 'react';
import { AnimatePresence, motion, MotionProps } from 'framer-motion';
import classNames from 'classnames';
import useEventListener from '../../hooks/useEventListener';
import Portal from '../layouts/Portal/Portal';
import { TRounded } from '../../types/rounded.type';
import themeConfig from '../../config/theme.config';
import { TScreens } from '../../types/screens.type';
import CloseButton from './CloseButton';
import Icon from '../icon/Icon';

type TModalCustomSize = string | number;
type TModalStableSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type TModalSize = TModalStableSize | TModalCustomSize;

const defaultProps = {
	isCentered: false,
	rounded: themeConfig.rounded,
	fullScreen: false,
	isScrollable: false,
	isStaticBackdropAnimation: true, // Added default value
};

const checkComp = (
	componentName: 'ModalHeader' | 'ModalBody' | 'ModalFooter',
	child:
		| ReactElement<IModalHeaderProps>
		| ReactElement<IModalBodyProps>
		| ReactElement<IModalFooterProps>,
): boolean => {
	return [componentName].includes(
		// @ts-ignore
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		child?.type?.displayName,
	);
};

interface IModalHeaderClonedProps {
	setIsOpen?: Dispatch<SetStateAction<boolean>>;
	titleId?: string;
}
interface IModalHeaderProps extends HTMLAttributes<HTMLDivElement>, IModalHeaderClonedProps {
	children: ReactNode;
	className?: string;
}
export const ModalHeader: FC<IModalHeaderProps> = (props) => {
	const { children, className, titleId, setIsOpen, ...rest } = props;

	const classes = classNames(
		'flex items-center justify-between px-4 pb-4 text-2xl font-semibold [&:first-child]:pt-4',
	);

	return (
		<div
			data-component-name='Modal/ModalHeader'
			className={classNames(classes, className)}
			{...rest}>
			<div id={titleId} className='flex items-center'>
				{children}
			</div>
			<div className='flex items-center'>
				<CloseButton setIsOpen={() => (setIsOpen ? setIsOpen(false) : undefined)} />
			</div>
		</div>
	);
};
ModalHeader.displayName = 'ModalHeader';

interface IModalBodyClonedProps {
	isScrollable?: boolean;
}
interface IModalBodyProps extends HTMLAttributes<HTMLDivElement>, IModalBodyClonedProps {
	children: ReactNode;
	className?: string;
}
export const ModalBody: FC<IModalBodyProps> = (props) => {
	const { children, className, isScrollable = defaultProps.isScrollable, ...rest } = props;

	const classes = classNames('grow px-4 pb-4 [&:first-child]:pt-4', {
		'overflow-y-auto': isScrollable,
	});

	return (
		<div
			data-component-name='Modal/ModalBody'
			className={classNames(classes, className)}
			{...rest}>
			{children}
		</div>
	);
};

ModalBody.displayName = 'ModalBody';

interface IModalFooterChildProps extends HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
	className?: string;
}
export const ModalFooterChild: FC<IModalFooterChildProps> = (props) => {
	const { children, className, ...rest } = props;

	const classes = classNames('flex items-center gap-4');

	return (
		<div
			data-component-name='Modal/ModalFooterChild'
			className={classNames(classes, className)}
			{...rest}>
			{children}
		</div>
	);
};
ModalFooterChild.displayName = 'ModalFooterChild';

interface IModalFooterProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	className?: string;
}
export const ModalFooter: FC<IModalFooterProps> = (props) => {
	const { children, className, ...rest } = props;

	const classes = classNames('flex items-center justify-between px-4 pb-4 [&:first-child]:pt-4');

	return (
		<div
			data-component-name='Modal/ModalFooter'
			className={classNames(classes, className)}
			{...rest}>
			{children}
		</div>
	);
};
ModalFooter.displayName = 'ModalFooter';

/**
 * Pila global de modales abiertos. Permite que cada modal apilado reciba un
 * z-index mayor que el anterior, de modo que su backdrop (blur/oscurecido)
 * quede por encima del modal inferior y lo difumine correctamente.
 */
interface ActiveModal {
	id: string;
	stackLevel: number;
}

let activeModals: ActiveModal[] = [];
const MODAL_BASE_Z = 1060;
const MODAL_STACK_STEP = 20;
let previousBodyOverflow = '';
let previousHtmlOverflow = '';

const focusableSelector = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
	Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
		(element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true',
	);

/**
 * BackDrop
 * @constructor
 */
const BackDrop = ({ zIndex }: { zIndex: number }) => {
	const animationProps = {
		initial: { opacity: 0 },
		animate: { opacity: 1 },
		exit: { opacity: 0 },
		transition: { ease: 'easeInOut', duration: 0.3 },
	};
	return (
		<motion.div
			data-component-name='Modal/BackDrop'
			{...animationProps}
			style={{ zIndex }}
			className='fixed left-0 top-0 h-screen w-screen bg-black/20 backdrop-blur-lg'
		/>
	);
};

/**
 * Content
 * @constructor
 */
interface IContentProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	fullScreen?: TScreens | boolean;
	isScrollable?: boolean;
	rounded?: TRounded;
	className?: string;
}
const Content: FC<IContentProps> = (props) => {
	const {
		children,
		fullScreen = defaultProps.fullScreen,
		isScrollable = defaultProps.isScrollable,
		rounded = defaultProps.rounded,
		className,
		...rest
	} = props;
	const hasBgOverride = className?.includes('bg-');
	const classes = classNames(
		'pointer-events-auto relative flex w-full flex-col',
		!hasBgOverride && 'bg-white dark:bg-zinc-950',
		'shadow-2xl',
		[`${rounded}`],
		{
			'max-h-full overflow-hidden': isScrollable,
			'h-full': !!fullScreen,
			'rounded-none': typeof fullScreen !== 'string' && fullScreen,
			'max-2xl:rounded-none': fullScreen === '2xl',
			'max-xl:rounded-none': fullScreen === 'xl',
			'max-lg:rounded-none': fullScreen === 'lg',
			'max-md:rounded-none': fullScreen === 'md',
			'max-sm:rounded-none': fullScreen === 'sm',
		},
		className,
	);
	return (
		<div data-component-name='Modal/Content' className={classes} {...rest}>
			{children}
		</div>
	);
};

/**
 * Dialog
 * @constructor
 */
interface IDialogProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	fullScreen?: TScreens | boolean;
	isCentered?: boolean;
	isScrollable?: boolean;
	className?: string;
}
const Dialog = forwardRef<HTMLDivElement, IDialogProps>((props, ref) => {
	const {
		children,
		fullScreen = defaultProps.fullScreen,
		isCentered = defaultProps.isCentered,
		isScrollable = defaultProps.isScrollable,
		className,
		...rest
	} = props;

	const classes = classNames(
		'pointer-events-none relative mx-auto my-6 max-w-[var(--theme-modal-width)] w-full',
		{
			'h-[calc(100%-theme(margin.6)*2)]': isScrollable,
			'flex min-h-[calc(100%-theme(margin.6)*2)] items-center': isCentered && !fullScreen,
			'!m-0 !h-full !max-w-full': typeof fullScreen !== 'string' && fullScreen,
			'max-2xl:m-0 max-2xl:h-full max-2xl:!max-w-full': fullScreen === '2xl',
			'max-xl:m-0 max-xl:h-full max-xl:!max-w-full': fullScreen === 'xl',
			'max-lg:m-0 max-lg:h-full max-lg:!max-w-full': fullScreen === 'lg',
			'max-md:m-0 max-md:h-full max-md:!max-w-full': fullScreen === 'md',
			'max-sm:m-0 max-sm:h-full max-sm:!max-w-full': fullScreen === 'sm',
		},
		className,
	);

	return (
		<div data-component-name='Modal/Dialog' ref={ref} className={classes} {...rest}>
			{children}
		</div>
	);
});

export interface IModalProps extends MotionProps {
	children:
		| ReactElement<IModalHeaderProps>[]
		| ReactElement<IModalBodyProps>[]
		| ReactElement<IModalFooterProps>[];
	fullScreen?: TScreens | boolean;
	isAnimation?: boolean;
	isCentered?: boolean;
	isOpen: boolean;
	isScrollable?: boolean;
	isStaticBackdrop?: boolean;
	isStaticBackdropAnimation?: boolean; // Added new prop
	rounded?: TRounded;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	size?: TModalSize;
	className?: string;
}
const Modal: FC<IModalProps> = (props) => {
	const {
		children,
		isOpen,
		setIsOpen,
		isStaticBackdrop = false,
		isStaticBackdropAnimation = defaultProps.isStaticBackdropAnimation, // Destructured new prop
		isScrollable = defaultProps.isScrollable,
		isCentered = defaultProps.isCentered,
		size = 'md',
		fullScreen = defaultProps.fullScreen,
		isAnimation = true,
		rounded = defaultProps.rounded,
		className,
		...rest
	} = props;
	const refModal = useRef<HTMLDivElement>(null);
	const ref = useRef<HTMLDivElement>(null);
	const previousActiveElementRef = useRef<HTMLElement | null>(null);

	const titleId = useId();
	const modalId = useId();

	// Nivel en la pila de modales: cada modal que se abre encima recibe un
	// z-index mayor, para que su backdrop difumine al modal de abajo.
	const [stackLevel, setStackLevel] = useState(1);
	useEffect(() => {
		if (!isOpen) return undefined;
		previousActiveElementRef.current =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		if (activeModals.length === 0) {
			previousBodyOverflow = document.body.style.overflow;
			previousHtmlOverflow = document.documentElement.style.overflow;
			document.body.style.overflow = 'hidden';
			document.documentElement.style.overflow = 'hidden';
		}
		// El nivel se deriva de la pila viva: si se calculara con un contador que
		// sólo crece, reabrir un modal sobre otro subiría el z-index sin cota.
		const nextStackLevel =
			activeModals.reduce((maxLevel, modal) => Math.max(maxLevel, modal.stackLevel), 0) + 1;
		activeModals = [...activeModals, { id: modalId, stackLevel: nextStackLevel }];
		setStackLevel(nextStackLevel);
		const initialFocusableElement = ref.current ? getFocusableElements(ref.current)[0] : null;
		(initialFocusableElement ?? refModal.current)?.focus();
		return () => {
			const modalIndex = activeModals.findIndex((modal) => modal.id === modalId);
			const wasTopModal = modalIndex === activeModals.length - 1;
			activeModals = activeModals.filter((modal) => modal.id !== modalId);
			if (activeModals.length === 0) {
				document.body.style.overflow = previousBodyOverflow;
				document.documentElement.style.overflow = previousHtmlOverflow;
			}
			if (wasTopModal) previousActiveElementRef.current?.focus();
			previousActiveElementRef.current = null;
		};
	}, [isOpen, modalId]);
	const backdropZIndex = MODAL_BASE_Z + (stackLevel - 1) * MODAL_STACK_STEP;
	const modalZIndex = backdropZIndex + 5;

	// Indicador de "hay más contenido": cuando el modal (o su cuerpo scrollable)
	// tiene contenido por debajo del área visible, muestra una flechita al final
	// que se oculta al llegar al fondo. El scroll vive en el cuerpo cuando
	// `isScrollable`, o en el wrapper externo cuando el modal completo scrollea.
	const scrollerRef = useRef<HTMLElement | null>(null);
	const [showScrollHint, setShowScrollHint] = useState(false);
	useEffect(() => {
		if (!isOpen) return undefined;
		const root = refModal.current as HTMLElement | null;
		if (!root) return undefined;
		const scroller: HTMLElement | null = isScrollable
			? root.querySelector('[data-component-name="Modal/ModalBody"]')
			: root;
		if (!scroller) return undefined;
		scrollerRef.current = scroller;

		const update = () => {
			const remaining = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
			setShowScrollHint(remaining > 24);
		};
		update();
		scroller.addEventListener('scroll', update, { passive: true });
		window.addEventListener('resize', update);
		// El contenido puede crecer al cargar datos async: reobservamos el tamaño.
		const ro = new ResizeObserver(update);
		ro.observe(scroller);
		if (scroller.firstElementChild) ro.observe(scroller.firstElementChild);
		return () => {
			scroller.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
			ro.disconnect();
			scrollerRef.current = null;
		};
	}, [isOpen, isScrollable, children]);

	const scrollToBottom = () => {
		scrollerRef.current?.scrollTo({
			top: scrollerRef.current.scrollHeight,
			behavior: 'smooth',
		});
	};

	const modalSizes: {
		[key in TModalStableSize]: string;
	} = { sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem', '2xl': '96rem' };
	const modalSize =
		(typeof size === 'number' && `${size}px`) ||
		(['sm', 'md', 'lg', 'xl', '2xl'].includes(size as TModalStableSize) &&
			modalSizes[size as TModalStableSize]) ||
		size;
	type ModalDialogStyle = CSSProperties & {
		'--theme-modal-width'?: string;
	};
	const dialogStyle: ModalDialogStyle = {
		'--theme-modal-width': modalSize as string,
	};
	const isTopModal = () => activeModals.at(-1)?.id === modalId;

	// Devuelve el destino del evento sólo cuando cae fuera del diálogo activo,
	// que es la única situación en la que el puntero está sobre el backdrop.
	const getBackdropTarget = (event: MouseEvent | TouchEvent): Element | null => {
		if (!isTopModal() || !ref.current) return null;
		const target = event.target instanceof Element ? event.target : null;
		if (target && ref.current.contains(target)) return null;
		if (target?.closest('[data-component-name="Modal/Dialog"]')) return null;
		return target ?? ref.current;
	};

	// Backdrop close function
	const closeModal = (event: MouseEvent | TouchEvent) => {
		if (isStaticBackdrop || !getBackdropTarget(event)) return;
		setIsOpen(false);
	};
	useEventListener('mousedown', closeModal);
	useEventListener('touchstart', closeModal); // Touchscreen

	// Backdrop static function
	const modalStatic = (event: MouseEvent | TouchEvent) => {
		if (!isStaticBackdrop || !getBackdropTarget(event)) return;
		if (isStaticBackdropAnimation && refModal.current) {
			refModal.current.classList.add('!scale-105');
			setTimeout(() => refModal.current?.classList.remove('!scale-105'), 300);
		}
	};
	useEventListener('mousedown', modalStatic);
	useEventListener('touchstart', modalStatic); // Touchscreen

	// Keypress close function. Solo el modal superior de la pila responde a
	// Escape, para no cerrar también los modales que quedan debajo.
	const handleKeyboardNavigation = (event: KeyboardEvent) => {
		if (!isOpen || !isTopModal()) return;
		if (event.key === 'Escape') {
			setIsOpen(false);
			return;
		}
		// La raíz de la capa contiene controles fijos y controles renderizados en el Portal.
		if (event.key !== 'Tab' || !refModal.current) return;
		const focusableElements = getFocusableElements(refModal.current);
		if (focusableElements.length === 0) {
			event.preventDefault();
			refModal.current?.focus();
			return;
		}
		const firstFocusableElement = focusableElements[0];
		const lastFocusableElement = focusableElements[focusableElements.length - 1];
		const { activeElement } = document;
		// El foco puede quedar fuera de la capa si el control que lo tenía se
		// desmonta (por ejemplo al quitar un ítem): sin esto, el navegador seguiría
		// tabulando desde el inicio del documento y alcanzaría el fondo.
		if (!(activeElement instanceof Node) || !refModal.current.contains(activeElement)) {
			event.preventDefault();
			(event.shiftKey ? lastFocusableElement : firstFocusableElement).focus();
			return;
		}
		if (
			event.shiftKey &&
			(activeElement === firstFocusableElement || activeElement === refModal.current)
		) {
			event.preventDefault();
			lastFocusableElement.focus();
		} else if (!event.shiftKey && activeElement === lastFocusableElement) {
			event.preventDefault();
			firstFocusableElement.focus();
		}
	};
	useEventListener('keydown', handleKeyboardNavigation);

	const animationProps = isAnimation
		? {
				initial: { opacity: 0, y: '-50%' },
				animate: { opacity: 1, x: '0%', y: '0%' },
				exit: { opacity: 0, y: '-50%' },
				transition: { ease: 'easeInOut', duration: 0.3 },
			}
		: null;

	return (
		<Portal>
			<AnimatePresence>
				{isOpen && (
					<>
						<motion.div
							data-component-name='Modal'
							ref={refModal}
							key='modal'
							style={{ zIndex: modalZIndex }}
							className={classNames(
								'fixed left-0 top-0 block h-full w-full overflow-y-auto overflow-x-hidden',
								{
									[`${themeConfig.transition}`]: isStaticBackdrop,
								},
							)}
							role='dialog'
							tabIndex={-1}
							aria-labelledby={titleId}
							aria-modal='true'
							aria-hidden={!isOpen}
							{...animationProps}
							{...rest}>
							<Dialog
								ref={ref}
								isCentered={isCentered}
								fullScreen={fullScreen}
								isScrollable={isScrollable}
								style={dialogStyle}>
								<Content
									rounded={rounded}
									fullScreen={fullScreen}
									isScrollable={isScrollable}
									className={className}>
									{Children.map(
										children,
										(child) =>
											(checkComp('ModalHeader', child) &&
												cloneElement(child, {
													// @ts-ignore
													setIsOpen,
													titleId,
												})) ||
											(checkComp('ModalBody', child) &&
												cloneElement(child, {
													// @ts-ignore
													isScrollable,
												})) ||
											child,
									)}
								</Content>
								<AnimatePresence>
									{showScrollHint && (
										<motion.button
											type='button'
											key='modal-scroll-hint'
											onClick={scrollToBottom}
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: 8 }}
											transition={{ duration: 0.2 }}
											style={{ zIndex: modalZIndex + 1 }}
											className='pointer-events-auto fixed bottom-6 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10'
											aria-label='Hay más contenido, desplázate hacia abajo'>
											<Icon
												icon='DuoAngleDoubleDown'
												size='text-xl'
												className='animate-bounce text-primary-500'
											/>
										</motion.button>
									)}
								</AnimatePresence>
							</Dialog>
						</motion.div>
						<BackDrop zIndex={backdropZIndex} />
					</>
				)}
			</AnimatePresence>
		</Portal>
	);
};

export default Modal;
