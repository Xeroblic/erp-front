import React, { cloneElement, FC, ReactElement } from 'react';

export interface IValidationBaseProps {
	isValidMessage?: boolean;
	isValid: boolean;
	isTouched: boolean | undefined;
	invalidFeedback: string | undefined;
	validFeedback?: string;
}

type TChildProps = Record<string, unknown>;

interface IValidationProps extends IValidationBaseProps {
	// Hijo tipado como objeto genérico sin usar `any`
	children: ReactElement<TChildProps>;
}
const Validation: FC<IValidationProps> = (props) => {
	const {
		children,
		isValidMessage = true,
		isValid,
		isTouched,
		invalidFeedback,
		validFeedback,
	} = props;
	return (
		<>
			{(() => {
				// Construir las props de inyección con tipos concretos
				const child = children as ReactElement<TChildProps & Partial<IValidationBaseProps>>;
				const injection: Partial<IValidationBaseProps> = {
					isValid,
					isTouched,
					invalidFeedback,
				};

				return cloneElement(
					child,
					injection as Partial<TChildProps & IValidationBaseProps>,
				);
			})()}
			{isValidMessage && !isValid && isTouched && (
				<>
					{invalidFeedback && (
						<div
							data-component-name='Validation'
							className='mt-2 text-xs text-red-500/70'>
							{invalidFeedback
								.split('.')
								.filter((i) => i !== '')
								.map((i) => (
									<p key={i}>{i}.</p>
								))}
						</div>
					)}
					{!invalidFeedback && validFeedback && (
						<div
							data-component-name='Validation'
							className='mt-2 text-xs text-green-500/70'>
							{validFeedback
								.split('.')
								.filter((i) => i !== '')
								.map((i) => (
									<p key={i}>{i}.</p>
								))}
						</div>
					)}
				</>
			)}
		</>
	);
};

export default Validation;
