import React from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import type { IPendingIngress } from '../../hooks/useStockReceiptForm';

interface IReceiptFormAlertsProps {
	hasVersionConflict: boolean;
	onReload: () => void;
	/** Ingreso incierto de una recepción ya guardada (`useStockReceiptForm`). */
	pendingIngress: IPendingIngress | null;
	isPendingIngressForeign: boolean;
	/** Resultado incierto del guardado: sólo vale reintentar lo mismo. */
	canRetry: boolean;
	/** Texto del botón de reintento, para citarlo en el aviso. */
	retryLabel: string;
}

/**
 * Avisos que bloquean o condicionan el formulario de recepción: versión
 * obsoleta (412), ingreso al stock sin confirmar (de esta filial o de otra) y
 * guardado sin confirmar. Van arriba, fuera del `<fieldset>` bloqueado.
 */
const ReceiptFormAlerts: React.FC<IReceiptFormAlertsProps> = ({
	hasVersionConflict,
	onReload,
	pendingIngress,
	isPendingIngressForeign,
	canRetry,
	retryLabel,
}) => (
	<>
		{hasVersionConflict && (
			<Alert
				color='amber'
				variant='outline'
				icon='HeroExclamationTriangle'
				title='Alguien más editó esta recepción'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<span>Recarga para ver la versión vigente antes de continuar.</span>
					<Button size='sm' variant='outline' onClick={onReload}>
						Recargar
					</Button>
				</div>
			</Alert>
		)}

		{pendingIngress && !isPendingIngressForeign && (
			<Alert
				color='amber'
				variant='outline'
				icon='HeroExclamationTriangle'
				title={`La recepción #${pendingIngress.receipt.id} se guardó`}>
				Pero no pudimos confirmar si ingresó al stock: la respuesta no llegó. Pulsa
				«Reintentar ingreso al stock» para repetir la misma operación — no se duplica — o ve
				a la recepción para ver su estado real.
			</Alert>
		)}

		{pendingIngress && isPendingIngressForeign && (
			<Alert
				color='red'
				variant='outline'
				icon='HeroExclamationTriangle'
				title={`La recepción #${pendingIngress.receipt.id} es de otra filial`}>
				Su ingreso al stock quedó sin confirmar y se envió desde la filial anterior. Vuelve
				a esa filial para reintentarlo o ver la recepción, o descártalo: la recepción sigue
				guardada allí.
			</Alert>
		)}

		{canRetry && (
			<Alert
				color='amber'
				variant='outline'
				icon='HeroExclamationTriangle'
				title='No pudimos confirmar el envío anterior'>
				No sabemos si llegó al servidor. Los datos quedaron bloqueados para evitar duplicar
				la operación: pulsa «{retryLabel}» sin cambiar nada, o cierra este formulario — al
				reabrirlo seguirá listo para reintentar.
			</Alert>
		)}
	</>
);

export default ReceiptFormAlerts;
