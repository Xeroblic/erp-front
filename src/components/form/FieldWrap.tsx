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
	children: ReactElement;
	className?: string;
	firstSuffix?: ReactNode;
	lastSuffix?: ReactNode;
}
const FieldWrap = forwardRef<HTMLDivElement, IFieldWrapProps>((props, ref) => {
	const {
		children,
		className,
		firstSuffix,
		lastSuffix,
		isValidMessage,
		isValid,
		isTouched,
		invalidFeedback,
		validFeedback,
		...rest
	} = props;

	// Filtrar props que no deben pasarse al DOM
	const {
		isValid: _isValid,
		isTouched: _isTouched,
		invalidFeedback: _invalidFeedback,
		validFeedback: _validFeedback,
		isValidMessage: _isValidMessage,
		...domProps
	} = rest;

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
				return cloneElement(children, isDomElement ? { style } : { isValid, isTouched, invalidFeedback, style });
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
