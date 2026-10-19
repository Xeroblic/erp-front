import React from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';

export interface IReturnAttemptNoticeProps {
	/** `own`: el intento es de esta venta. `foreign`: de otra, que lo bloquea aquí. */
	kind: 'own' | 'foreign';
	/** Qué se intentó: «el inicio» o «la recepción». */
	action: string;
	/** Venta del intento, para el caso `foreign`. */
	attemptSaleId: number;
	disabled: boolean;
	onDiscard: () => void;
}

/**
 * Aviso de un intento con resultado incierto (timeout o red). Cerrar lo conserva; sólo
 * reintentarlo igual o descartarlo de forma explícita lo resuelve, como en recepciones.
 */
const ReturnAttemptNotice: React.FC<IReturnAttemptNoticeProps> = ({
	kind,
	action,
	attemptSaleId,
	disabled,
	onDiscard,
}) => (
	<Alert
		color='amber'
		colorIntensity='500'
		variant='outline'
		icon='HeroExclamationTriangle'
		className='text-sm'>
		<div className='space-y-2'>
			<p>
				{kind === 'own'
					? `No pudimos confirmar si ${action} llegó al servidor. Reintenta con los mismos datos; puedes cerrar y volver: el intento queda guardado.`
					: `La venta #${attemptSaleId} tiene ${action} sin confirmar. Ábrela para reintentarla o descarta ese intento para seguir aquí.`}
			</p>
			<p className='text-xs'>
				Si lo descartas y sí había llegado, la venta lo mostrará al volver a cargarla.
			</p>
			<Button
				type='button'
				variant='outline'
				color='red'
				size='sm'
				icon='HeroXMark'
				isDisable={disabled}
				onClick={onDiscard}>
				Descartar intento
			</Button>
		</div>
	</Alert>
);

export default ReturnAttemptNotice;
