import * as Yup from 'yup';

export interface IDocumentInitialStockValues {
	documentId: string;
	lineId: string;
	quantity: string;
	reason: string;
}

export const DOCUMENT_INITIAL_STOCK_INITIAL_VALUES: IDocumentInitialStockValues = {
	documentId: '',
	lineId: '',
	quantity: '',
	reason: '',
};

const isPositiveInteger = (value: string | undefined): boolean => {
	const trimmed = value?.trim() ?? '';
	const parsed = Number(trimmed);
	return trimmed !== '' && Number.isInteger(parsed) && parsed > 0;
};

/**
 * La cantidad no puede superar el saldo sin documentar de la procedencia ni la
 * capacidad que le queda a la línea elegida. Los límites dependen de lo que el
 * modal ya cargó, por eso el esquema se arma con ellos.
 */
export const createDocumentInitialStockSchema = (
	undocumentedBalance: number,
	remainingOfLine: (lineId: number) => number | undefined,
) =>
	Yup.object({
		documentId: Yup.string().required('Selecciona un documento confirmado.'),
		lineId: Yup.string().required('Selecciona una línea del documento.'),
		quantity: Yup.string()
			.test('positive-integer', 'La cantidad debe ser un entero positivo.', isPositiveInteger)
			.test(
				'undocumented-balance',
				`No hay suficiente stock sin documentar (saldo: ${undocumentedBalance}).`,
				(value) => !isPositiveInteger(value) || Number(value) <= undocumentedBalance,
			)
			.test('line-capacity', function lineCapacity(value) {
				const { lineId } = this.parent as Partial<IDocumentInitialStockValues>;
				const remaining =
					typeof lineId === 'string' && lineId !== ''
						? remainingOfLine(Number(lineId))
						: undefined;
				if (remaining === undefined || !isPositiveInteger(value)) return true;
				return (
					Number(value) <= remaining ||
					this.createError({
						message: `La línea del documento sólo tiene ${remaining} de capacidad.`,
					})
				);
			}),
		reason: Yup.string().trim().required('Indica el motivo del respaldo documental.'),
	});
