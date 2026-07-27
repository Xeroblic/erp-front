import React, {
	cloneElement,
	FC,
	FocusEventHandler,
	HTMLAttributes,
	MouseEventHandler,
	ReactElement,
	ReactNode,
	useCallback,
	useRef,
	useState,
} from 'react';
import classNames from 'classnames';
import { Manager, Popper, Reference } from 'react-popper';
import * as PopperJS from '@popperjs/core';
import Icon from '../icon/Icon';
import Portal from '../layouts/Portal/Portal';
import { TBorderWidth } from '../../types/borderWidth.type';
import { TRounded } from '../../types/rounded.type';
import themeConfig from '../../config/theme.config';

interface ITooltipProps extends HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
	className?: string;
	text: string;
	placement?: PopperJS.Placement;
	borderWidth?: TBorderWidth;
	rounded?: TRounded;
}

interface TooltipReferenceProps {
	className?: string;
	onMouseEnter?: MouseEventHandler<HTMLElement>;
	onMouseLeave?: MouseEventHandler<HTMLElement>;
	onFocus?: FocusEventHandler<HTMLElement>;
	onBlur?: FocusEventHandler<HTMLElement>;
}

const Tooltip: FC<ITooltipProps> = (props) => {
	const {
		children,
		className,
		text,
		placement = 'top',
		borderWidth = 'border',
		rounded = themeConfig.rounded,
		...rest
	} = props;
	const [isOpen, setIsOpen] = useState(false);
	const referenceRef = useRef<HTMLElement | null>(null);
	const setReferenceRef = useCallback(
		(node: HTMLElement, ref: (node: HTMLElement) => HTMLElement) => {
			referenceRef.current = node;
			return ref(node);
		},
		[],
	);
	const popperRef = useRef<HTMLElement | null>(null);
	const setPopperRef = useCallback(
		(node: HTMLElement, ref: (node: HTMLElement) => HTMLElement) => {
			popperRef.current = node;
			return ref(node);
		},
		[],
	);

	return (
		<Manager>
			<Reference>
				{({ ref }) => {
					if (['string', 'undefined'].includes(typeof children)) {
						return (
							<button
								data-component-name='Tooltip/Reference'
								// @ts-ignore
								ref={(node) => setReferenceRef(node, ref)}
								type='button'
								aria-label={`Más información: ${text}`}
								className='cursor-pointer border-0 bg-transparent p-0'
								onMouseEnter={() => setIsOpen(true)}
								onMouseLeave={() => setIsOpen(false)}
								onFocus={() => setIsOpen(true)}
								onBlur={() => setIsOpen(false)}
								onClick={() => setIsOpen((current) => !current)}>
								{children || (
									<Icon
										icon='HeroInformationCircle'
										className={classNames('inline-flex', className)}
									/>
								)}
							</button>
						);
					}
					const child = children as ReactElement<TooltipReferenceProps>;
					return cloneElement(child, {
						// @ts-ignore
						ref: (node: HTMLElement) => setReferenceRef(node, ref),
						className: classNames('cursor-pointer', child.props.className),
						onMouseEnter: (event) => {
							child.props.onMouseEnter?.(event);
							setIsOpen(true);
						},
						onMouseLeave: (event) => {
							child.props.onMouseLeave?.(event);
							setIsOpen(false);
						},
						onFocus: (event) => {
							child.props.onFocus?.(event);
							setIsOpen(true);
						},
						onBlur: (event) => {
							child.props.onBlur?.(event);
							setIsOpen(false);
						},
					});
				}}
			</Reference>
			{isOpen && text !== '' && (
				<Portal>
					<Popper placement={placement}>
						{({ ref, style }) => (
							<div
								// @ts-ignore
								ref={(node) => setPopperRef(node, ref)}
								style={style}
								className={classNames(
									'z-[9999] m-2 px-2 py-1',
									'max-w-xs',
									'border-zinc-500/10 shadow-lg backdrop-blur-sm',
									[`${borderWidth}`],
									[`${rounded}`],
									className,
								)}
								{...rest}>
								{text}
							</div>
						)}
					</Popper>
				</Portal>
			)}
		</Manager>
	);
};
Tooltip.displayName = 'Tooltip';

export default Tooltip;
