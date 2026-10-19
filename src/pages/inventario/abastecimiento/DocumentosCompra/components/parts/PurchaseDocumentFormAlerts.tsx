import React from 'react';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';

interface IPurchaseDocumentFormAlertsProps {
	/** Edición sin `ETag` legible: guardar podría pisar cambios ajenos. */
	isMissingEtag: boolean;
	/** El `PATCH` respondió 412: hay que recargar antes de seguir. */
	hasVersionConflict: boolean;
	onReload: () => void;
}

/** Avisos que bloquean el guardado del documento, arriba del formulario. */
const PurchaseDocumentFormAlerts: React.FC<IPurchaseDocumentFormAlertsProps> = ({
	isMissingEtag,
	hasVersionConflict,
	onReload,
}) => (
	<>
		{isMissingEtag && (
			<Alert
				color='red'
				variant='outline'
				icon='HeroExclamationTriangle'
				title='No se puede editar este documento'>
				No pudimos leer la versión vigente del documento, así que guardar podría pisar
				cambios de otra persona. Recarga la página; si el aviso persiste, avisa al equipo de
				sistemas.
			</Alert>
		)}
		{hasVersionConflict && (
			<Alert
				color='amber'
				variant='outline'
				icon='HeroExclamationTriangle'
				title='Alguien más editó este documento'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<span>Recarga para ver la versión vigente antes de continuar.</span>
					<Button size='sm' variant='outline' onClick={onReload}>
						Recargar
					</Button>
				</div>
			</Alert>
		)}
	</>
);

export default PurchaseDocumentFormAlerts;
