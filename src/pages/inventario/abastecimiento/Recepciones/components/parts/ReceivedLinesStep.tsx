import React from 'react';
import type { FormikProps } from 'formik';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { TSelectOption } from '@/components/form/SelectReact';
import type { IPurchaseDocument } from '@/interface/procurement.interface';
import DocumentLinesEditor from './DocumentLinesEditor';
import ManualLinesEditor from './ManualLinesEditor';
import {
	RECEPCION_CARD_CLASSNAME,
	RECEPCION_FIELD_CLASSNAME,
	RECEPCION_ITEM_CLASSNAME,
	RECEPCION_SELECT_CLASSNAME,
	RECEPCION_SUBTITLE_CLASSNAME,
} from './stockReceiptFormStyles';
import type { IStockReceiptFormValues } from '../../types';

interface IReceivedLinesStepProps {
	formik: FormikProps<IStockReceiptFormValues>;
	isEdit: boolean;
	isLocked: boolean;
	/** Modo sin documento: productos elegibles. */
	productOptions: TSelectOption[];
	/** Modo con documento: ficha del documento elegido y su carga. */
	selectedDocument: IPurchaseDocument | null;
	loadingSelectedDocument: boolean;
}

/**
 * Paso 3 del alta, «¿Qué llegó?»: las líneas pendientes del documento o los
 * productos que entran sin documento.
 */
const ReceivedLinesStep: React.FC<IReceivedLinesStepProps> = ({
	formik,
	isEdit,
	isLocked,
	productOptions,
	selectedDocument,
	loadingSelectedDocument,
}) => {
	const isManual = formik.values.mode === 'manual';
	/** Con proveedor conocido el costo unitario pasa a ser obligatorio. */
	const hasKnownSupplier = formik.values.supplier_id !== '';

	let linesSubtitle = 'Viene cargado todo lo pendiente. Ajusta sólo lo que llegó incompleto.';
	if (isManual) linesSubtitle = 'Cada producto que entra, su cantidad y su costo.';
	else if (isEdit) linesSubtitle = 'Ajusta la cantidad que llegó de cada línea.';

	return (
		<Card className={RECEPCION_CARD_CLASSNAME}>
			<CardHeader className='pb-2'>
				<div>
					<CardTitle className='text-lg'>
						{isManual ? 'Productos recibidos' : '¿Qué llegó?'}
					</CardTitle>
					<p className={RECEPCION_SUBTITLE_CLASSNAME}>{linesSubtitle}</p>
				</div>
			</CardHeader>
			<CardBody>
				{isManual ? (
					<ManualLinesEditor
						formik={formik}
						productOptions={productOptions}
						isCostRequired={hasKnownSupplier}
						disabled={isLocked}
						fieldClassName={RECEPCION_FIELD_CLASSNAME}
						selectClassName={RECEPCION_SELECT_CLASSNAME}
						itemClassName={RECEPCION_ITEM_CLASSNAME}
					/>
				) : (
					<DocumentLinesEditor
						formik={formik}
						selectedDocument={selectedDocument}
						loading={loadingSelectedDocument}
						disabled={isLocked}
						fieldClassName={RECEPCION_FIELD_CLASSNAME}
					/>
				)}
			</CardBody>
		</Card>
	);
};

export default ReceivedLinesStep;
