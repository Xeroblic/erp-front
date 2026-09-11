import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
	loadPersistedMockState,
	savePersistedMockState,
} from '@/services/procurement/procurementMockPersistence.util';

/**
 * Foto de perfil del proveedor.
 *
 * **No es un campo del contrato** (sección 5 del contrato de abastecimiento):
 * ningún fixture de `procurement.db.ts` ni ejemplo de `frontend-guide.md` trae
 * una imagen de proveedor, y la regla del módulo es copiar el contrato, nunca
 * inventarlo — así que esto no se agrega a `IProcurementSupplier` ni al mock
 * de `procurementSuppliers.service`. Es una conveniencia de UI, persistida en
 * este navegador con el mismo transporte JSON que ya usan los demás mocks de
 * abastecimiento (`procurementMockPersistence.util`), bajo su propio
 * namespace para no mezclarse con datos del contrato. El día que el backend
 * defina un campo real para esto, este hook se reemplaza por ese campo.
 */

const NAMESPACE = 'supplier-photos';
const VERSION = 1;

type TSupplierPhotoMap = Record<number, string>;

const MAX_DIMENSION_PX = 480;
const MAX_UPLOAD_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const readPhotoMap = (subsidiaryId: number): TSupplierPhotoMap =>
	loadPersistedMockState<TSupplierPhotoMap>(NAMESPACE, VERSION, subsidiaryId) ?? {};

/** Redimensiona a `MAX_DIMENSION_PX` y comprime a WebP antes de guardar. */
const compressToDataUrl = async (file: File): Promise<string> => {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	const context = canvas.getContext('2d');
	if (!context) throw new Error('No se pudo procesar la imagen.');
	context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL('image/webp', 0.8);
};

interface IUseSupplierPhotoArgs {
	subsidiaryId: number | null;
	supplierId: number | null;
}

interface IPhotoState {
	ownerKey: string | null;
	photoUrl: string | null;
}

interface IUploadingOperation {
	ownerKey: string;
	generation: number;
	id: number;
}

const getOwnerKey = (subsidiaryId: number | null, supplierId: number | null): string | null =>
	subsidiaryId === null || supplierId === null ? null : `${subsidiaryId}:${supplierId}`;

const readPhotoForOwner = (
	subsidiaryId: number | null,
	supplierId: number | null,
): string | null =>
	subsidiaryId === null || supplierId === null
		? null
		: (readPhotoMap(subsidiaryId)[supplierId] ?? null);

const useSupplierPhoto = ({ subsidiaryId, supplierId }: IUseSupplierPhotoArgs) => {
	const ownerKey = getOwnerKey(subsidiaryId, supplierId);
	const [photoState, setPhotoState] = useState<IPhotoState>(() => ({
		ownerKey,
		photoUrl: readPhotoForOwner(subsidiaryId, supplierId),
	}));
	const [uploadingOperation, setUploadingOperation] = useState<IUploadingOperation | null>(null);
	const ownerRef = useRef({ key: ownerKey, generation: 0 });
	const nextOperationIdRef = useRef(0);
	const latestOperationIdByOwnerRef = useRef(new Map<string, number>());
	const mountedRef = useRef(true);

	if (ownerRef.current.key !== ownerKey) {
		ownerRef.current = {
			key: ownerKey,
			generation: ownerRef.current.generation + 1,
		};
	}
	const photoUrl =
		photoState.ownerKey === ownerKey
			? photoState.photoUrl
			: readPhotoForOwner(subsidiaryId, supplierId);
	const isUploading =
		ownerKey !== null &&
		uploadingOperation?.ownerKey === ownerKey &&
		uploadingOperation.generation === ownerRef.current.generation;

	useEffect(() => {
		setPhotoState({ ownerKey, photoUrl: readPhotoForOwner(subsidiaryId, supplierId) });
	}, [ownerKey, subsidiaryId, supplierId]);

	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const uploadPhoto = useCallback(
		async (file: File) => {
			if (subsidiaryId === null || supplierId === null || ownerKey === null) return;
			if (!ALLOWED_TYPES.includes(file.type)) {
				toast.error('Solo se permiten imágenes JPG, PNG o WEBP.');
				return;
			}
			if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
				toast.error(`La imagen debe pesar menos de ${MAX_UPLOAD_MB}MB.`);
				return;
			}

			const operationOwnerKey = ownerKey;
			const operationSubsidiaryId = subsidiaryId;
			const operationSupplierId = supplierId;
			const operationGeneration = ownerRef.current.generation;
			const operationId = nextOperationIdRef.current + 1;
			nextOperationIdRef.current = operationId;
			latestOperationIdByOwnerRef.current.set(operationOwnerKey, operationId);
			setUploadingOperation({
				ownerKey: operationOwnerKey,
				generation: operationGeneration,
				id: operationId,
			});
			const isCurrentOperation = () =>
				mountedRef.current &&
				ownerRef.current.key === operationOwnerKey &&
				ownerRef.current.generation === operationGeneration &&
				latestOperationIdByOwnerRef.current.get(operationOwnerKey) === operationId;
			try {
				const dataUrl = await compressToDataUrl(file);
				// Dos cargas del mismo proveedor pueden resolver invertidas. Sólo la
				// operación más reciente escribe su resultado; una navegación sin otra
				// carga conserva la persistencia del contexto con que empezó.
				if (latestOperationIdByOwnerRef.current.get(operationOwnerKey) !== operationId)
					return;
				const nextMap = {
					...readPhotoMap(operationSubsidiaryId),
					[operationSupplierId]: dataUrl,
				};
				savePersistedMockState(NAMESPACE, VERSION, operationSubsidiaryId, nextMap);
				if (!isCurrentOperation()) return;
				setPhotoState({ ownerKey: operationOwnerKey, photoUrl: dataUrl });
				toast.success('Foto del proveedor actualizada.');
			} catch {
				if (isCurrentOperation()) {
					toast.error('No se pudo procesar la imagen.');
				}
			} finally {
				if (isCurrentOperation()) {
					setUploadingOperation(null);
				}
			}
		},
		[ownerKey, subsidiaryId, supplierId],
	);

	return { photoUrl, uploadPhoto, isUploading };
};

export default useSupplierPhoto;
