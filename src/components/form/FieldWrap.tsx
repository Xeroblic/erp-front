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
	} = props;

	const sharedClasses = classNames(
		'absolute top-[2px] bottom-[2px] flex justify-center items-center px-1 rounded-sm',
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
				<div ref={divFirstRef} className={classNames(sharedClasses, 'inset-s-px')}>
					{firstSuffix}
				</div>
			)}
			{(() => {
				const isDomElement = typeof children.type === 'string';
				const style = {
					paddingLeft:
						(firstSuffix && isLTR && domFirstRect?.width) ||
						(lastSuffix && !isLTR && domLastRect?.width),
					paddingRight:
						(firstSuffix && !isLTR && domFirstRect?.width) ||
						(lastSuffix && isLTR && domLastRect?.width),
				} as React.CSSProperties;
				// Evitar pasar props desconocidos a elementos DOM nativos
				const childEl = children;
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
				<div ref={divLastRef} className={classNames(sharedClasses, 'inset-e-px')}>
					{lastSuffix}
				</div>
			)}
		</div>
	);
});

export default FieldWrap;
