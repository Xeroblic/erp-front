import React from 'react';
import { FieldArray } from 'formik';
import type { FormikProps } from 'formik';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader, CardHeaderChild, CardTitle } from '@/components/ui/Card';
import Checkbox from '@/components/form/Checkbox';
import ProductOptionsNotice from './ProductOptionsNotice';
import PurchaseDocumentLineRow from './PurchaseDocumentLineRow';
import PurchaseDocumentTotal from './PurchaseDocumentTotal';
import ShippingCostRow from './ShippingCostRow';
import {
	DOCUMENTO_CARD_CLASSNAME,
	DOCUMENTO_SUBTITLE_CLASSNAME,
} from './purchaseDocumentFormStyles';
import type usePurchasableProductOptions from '../../hooks/usePurchasableProductOptions';
import { EMPTY_DOCUMENTO_LINE } from '../../types';
import type { IPurchaseDocumentFormValues } from '../../types';

interface IPurchaseDocumentLinesCardProps {
	formik: FormikProps<IPurchaseDocumentFormValues>;
	subsidiaryId: number | null;
	productOptions: ReturnType<typeof usePurchasableProductOptions>;
	/** Bloquea «Nuevo producto» mientras se guarda o el documento no se puede guardar. */
	isCreateProductDisabled: boolean;
	/** Abre el alta de producto en línea para la línea indicada. */
	onCreateProduct: (lineIndex: number) => void;
	onPesoChange: (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * «Líneas del documento»: agregar y quitar líneas, el envío opcional y el
 * total calculado. `FieldArray` lee `items` del `FormikProvider` del modal.
 */
const PurchaseDocumentLinesCard: React.FC<IPurchaseDocumentLinesCardProps> = ({
	formik,
	subsidiaryId,
	productOptions,
	isCreateProductDisabled,
	onCreateProduct,
	onPesoChange,
}) => (
	<Card className={DOCUMENTO_CARD_CLASSNAME}>
		<FieldArray name='items'>
			{(arrayHelpers) => (
				<>
					<CardHeader className='pb-2'>
						<CardHeaderChild className='w-full items-start justify-between gap-3'>
							<div>
								<CardTitle className='text-lg'>Líneas del documento</CardTitle>
								<p className={DOCUMENTO_SUBTITLE_CLASSNAME}>
									Agrega los productos, cantidades y costos de la compra.
								</p>
							</div>
							<div className='flex flex-wrap items-center justify-end gap-3'>
								<Checkbox
									id='include-shipping'
									name='include_shipping'
									checked={formik.values.include_shipping}
									onChange={(event) =>
										formik
											.setFieldValue('include_shipping', event.target.checked)
											.catch(() => undefined)
									}
									label='Agregar costo de envío'
									dimension='sm'
								/>
								<Button
									type='button'
									variant='outline'
									size='sm'
									icon='HeroPlus'
									onClick={() => arrayHelpers.push({ ...EMPTY_DOCUMENTO_LINE })}>
									Agregar línea
								</Button>
							</div>
						</CardHeaderChild>
					</CardHeader>
					<CardBody className='space-y-3'>
						<ProductOptionsNotice
							reason={productOptions.unavailableReason}
							onRetry={productOptions.reload}
						/>
						{typeof formik.errors.items === 'string' && (
							<Alert color='red' variant='outline' icon='HeroExclamationTriangle'>
								{formik.errors.items}
							</Alert>
						)}

						{formik.values.items.map((line, index) => (
							<PurchaseDocumentLineRow
								// eslint-disable-next-line react/no-array-index-key -- las líneas nuevas todavía no tienen id propio.
								key={index}
								formik={formik}
								line={line}
								index={index}
								subsidiaryId={subsidiaryId}
								productOptions={productOptions}
								isCreateProductDisabled={isCreateProductDisabled}
								isOnlyLine={formik.values.items.length === 1}
								onRemove={() => arrayHelpers.remove(index)}
								onCreateProduct={() => onCreateProduct(index)}
								onPesoChange={onPesoChange}
							/>
						))}

						{formik.values.include_shipping && (
							<ShippingCostRow formik={formik} onPesoChange={onPesoChange} />
						)}

						<PurchaseDocumentTotal values={formik.values} />
					</CardBody>
				</>
			)}
		</FieldArray>
	</Card>
);

export default PurchaseDocumentLinesCard;
