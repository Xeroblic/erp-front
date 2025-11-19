import React, {
	cloneElement,
	forwardRef,
	HTMLAttributes,
	ReactElement,
	ReactNode,
	useRef,
} from 'react';
import classNames from 'classnames';
import useDomRect from '../../hooks/useDomRect';
import useDir from '../../hooks/useDir';
import { IValidationBaseProps } from './Validation';

interface IFieldWrapProps extends HTMLAttributes<HTMLDivElement>, Partial<IValidationBaseProps> {
	children: ReactElement<any, any>;
	className?: string;
	firstSuffix?: ReactNode;
	lastSuffix?: ReactNode;
}
const FieldWrap = forwardRef<HTMLDivElement, IFieldWrapProps>((props, ref) => {
	// Extraer children, sufijos, y las props de validación en una sola operación
	const {
		children,
		className,
		firstSuffix,
		lastSuffix,
		isValid,
		isTouched,
		invalidFeedback,
		validFeedback,
		isValidMessage,
		...domProps
	} = props as IFieldWrapProps;

	const sharedClasses = classNames(
		'absolute top-[2px] bottom-[2px] flex justify-center items-center px-1 rounded',
	);

	const divFirstRef = useRef<HTMLDivElement>(null);
	const [domFirstRect] = useDomRect(divFirstRef);

	const divLastRef = useRef<HTMLDivElement>(null);
	const [domLastRect] = useDomRect(divLastRef);

	const { isLTR } = useDir();

	return (
		<div
			ref={ref}
			data-component-name='FieldWrap'
			className={classNames('relative', className)}
			{...domProps}>
			{firstSuffix && (
				<div ref={divFirstRef} className={classNames(sharedClasses, 'start-px')}>
					{firstSuffix}
				</div>
			)}
			{(() => {
				const isDomElement = typeof children.type === 'string';
				const style = {
					paddingLeft:
						(firstSuffix && isLTR && (domFirstRect?.width as number)) ||
						(lastSuffix && !isLTR && (domLastRect?.width as number)),
					paddingRight:
						(firstSuffix && !isLTR && (domFirstRect?.width as number)) ||
						(lastSuffix && isLTR && (domLastRect?.width as number)),
				} as React.CSSProperties;
				// Evitar pasar props desconocidos a elementos DOM nativos
				const childEl = children as ReactElement<any, any>;
				if (isDomElement) {
					return cloneElement(childEl, { style } as any);
				}

				return cloneElement(childEl, {
					isValid,
					isTouched,
					invalidFeedback,
					validFeedback,
					isValidMessage,
					style,
				} as any);
			})()}
			{lastSuffix && (
				<div ref={divLastRef} className={classNames(sharedClasses, 'end-px')}>
					{lastSuffix}
				</div>
			)}
		</div>
	);
});

export default FieldWrap;
