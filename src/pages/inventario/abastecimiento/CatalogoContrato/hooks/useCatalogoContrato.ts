import { useCallback, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { costEntrySchema, toCostEntryPayload } from '@/components/procurement';
import type { ICostEntryFormValues } from '@/components/procurement';
import type { TProcurementAllowedAction } from '@/interface/procurement.interface';
import {
	allowedActionsByState,
	cableProduct,
	declaredCost,
	grossEnteredCost,
	mainWarehouse,
	mixedBasisCost,
	mouseProduct,
	netEnteredCost,
	notebookProduct,
	unknownCost,
	weightedNetCost,
} from '@/mocks/db/procurement.db';
import type {
	ICatalogActionsSample,
	ICatalogCostSample,
	ICatalogProductSample,
	ICatalogWarehouseSample,
} from '../types';

/**
 * Lógica de la pantalla de catálogo del contrato de abastecimiento.
 *
 * Los datos salen enteros de `@/mocks/db/procurement.db`: ninguno se arma acá.
 * Si un estado del contrato no está representado en el fixture, se agrega al
 * fixture y no a esta pantalla — así el mock sigue siendo la única copia del
 * contrato que hay que reemplazar el día que exista el backend.
 */
const useCatalogoContrato = () => {
	const { branchId, subsidiaryId } = useCurrentBranch();

	const costSamples = useMemo<ICatalogCostSample[]>(
		() => [
			{
				id: 'gross-entered',
				title: 'Entrada bruta sobre factura',
				description:
					'Se digitó el bruto; el backend derivó neto e IVA. La factura usa base efectiva neta por la premisa de IVA recuperable.',
				cost: grossEnteredCost,
			},
			{
				id: 'net-entered',
				title: 'Entrada neta sobre boleta',
				description:
					'La misma operación al revés: se digitó el neto y la base efectiva es bruta, porque la boleta se compara bajo la premisa de IVA no recuperable.',
				cost: netEnteredCost,
			},
			{
				id: 'declared',
				title: 'Costo declarado sin documento',
				description:
					'Recepción sin factura: hay monto, pero la base es provisional hasta que se vincule el documento.',
				cost: declaredCost,
			},
			{
				id: 'unknown',
				title: 'Costo desconocido',
				description:
					'Importes y tasa en null, bases unknown. Se muestra como desconocido y nunca como $0: el módulo no afirma que la unidad costó cero.',
				cost: unknownCost,
			},
			{
				id: 'weighted-net',
				title: 'Ponderado con base única',
				description:
					'Varias líneas del mismo producto dentro de una recepción, todas con base efectiva neta: el agregado sigue siendo comparable.',
				cost: weightedNetCost,
			},
			{
				id: 'mixed',
				title: 'Agregado con base mixta',
				description:
					'Combina bases efectivas distintas: effective_basis "mixed", sin monto ingresado. No es comparable contra un neto ni contra un bruto.',
				cost: mixedBasisCost,
			},
		],
		[],
	);

	const productSamples = useMemo<ICatalogProductSample[]>(
		() => [
			{
				id: 'not-serialized',
				title: 'Producto no serializado',
				description:
					'La ficha del contrato, tal cual. Sin imagen, sin SKU comercial y con costo de catálogo de base desconocida.',
				product: mouseProduct,
			},
			{
				id: 'serialized',
				title: 'Producto serializado',
				description:
					'Con seguimiento por serie, grado, oferta vigente, imagen y dos categorías.',
				product: notebookProduct,
			},
			{
				id: 'inactive',
				title: 'Producto inactivo y sin costo',
				description:
					'Sin marca, sin categorías y con cost null: el costo se lee «Desconocido», no «$0».',
				product: cableProduct,
			},
		],
		[],
	);

	const warehouseSamples = useMemo<ICatalogWarehouseSample[]>(
		() => [
			{
				id: 'warehouse',
				title: 'Bodega con ubicación',
				description: 'Compacto {id, name} del contrato.',
				warehouse: mainWarehouse,
			},
			{
				id: 'unlocated',
				title: 'Sin ubicación',
				description:
					'warehouse_id null. Es una ubicación válida de la sucursal —vendible y trasladable—, no un dato faltante.',
				warehouse: null,
			},
		],
		[],
	);

	const actionSamples = useMemo<ICatalogActionsSample[]>(
		() => [
			{
				id: 'document-draft',
				title: 'Documento en borrador',
				description: 'El backend ofrece editar, confirmar, anular y adjuntar.',
				resource: 'purchase_document',
				allowedActions: allowedActionsByState.documentDraft,
			},
			{
				id: 'receipt-failed',
				title: 'Recepción fallida',
				description:
					'Mismos nombres de acción que el documento, permisos distintos: acá update y cancel exigen edit-product.',
				resource: 'stock_receipt',
				allowedActions: allowedActionsByState.receiptFailed,
			},
			{
				id: 'supplier-inactive',
				title: 'Proveedor desactivado',
				description: 'Sólo restaurar. El contrato no restaura automáticamente.',
				resource: 'supplier',
				allowedActions: allowedActionsByState.supplierInactive,
			},
			{
				id: 'document-cancelled',
				title: 'Documento anulado',
				description: 'Colección vacía: allowed_actions es [], no null.',
				resource: 'purchase_document',
				allowedActions: allowedActionsByState.documentCancelled,
			},
		],
		[],
	);

	/**
	 * Demo de `CostInput`. Es la única escritura de la pantalla y no sale a la
	 * red: sirve para ver la previsualización y el payload que se enviaría, que
	 * son exactamente dos campos.
	 */
	const costForm = useFormik<ICostEntryFormValues>({
		initialValues: { unit_cost: '5712', unit_cost_basis: 'gross' },
		validationSchema: costEntrySchema,
		onSubmit: (values) => {
			const payload = toCostEntryPayload(values);
			toast.info(
				payload === null
					? 'Sin costo: el contrato espera ausencia, no "0.00".'
					: `Se enviaría ${JSON.stringify(payload)}`,
			);
		},
	});

	const [lastAction, setLastAction] = useState<TProcurementAllowedAction | null>(null);

	const handleAction = useCallback((action: TProcurementAllowedAction) => {
		setLastAction(action);
	}, []);

	// Sin `useMemo`: el objeto de Formik cambia de identidad en cada render, así
	// que memoizar el retorno no evitaría un solo re-render y sólo aparentaría
	// hacerlo. Las listas de muestras ya vienen memoizadas por separado.
	return {
		branchId,
		subsidiaryId,
		costSamples,
		productSamples,
		warehouseSamples,
		actionSamples,
		costForm,
		lastAction,
		handleAction,
	};
};

export default useCatalogoContrato;
