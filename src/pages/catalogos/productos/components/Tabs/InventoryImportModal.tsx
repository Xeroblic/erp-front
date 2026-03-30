import React, { useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import type { IBatchAdjustStockPayload } from '@/interface/stock.interface';

interface InventoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: number | null;
  onSubmit: (payload: IBatchAdjustStockPayload) => Promise<void>;
  isSubmitting: boolean;
  serialTrackedProductIds?: number[];
}

type ParsedImportRow = {
  rowNumber: number;
  raw: string[];
  productId: string;
  quantityChange: string;
  sourceSerialTracking: boolean | null;
  error: string | null;
};

type CsvPreview = {
  headers: string[];
  rows: ParsedImportRow[];
  productIdHeader: string | null;
  quantityHeader: string | null;
  serialTrackingHeader: string | null;
  delimiter: string;
};

type PreviewRowState = {
  kind: 'importable' | 'omitted' | 'invalid' | 'blocked';
  message: string;
};

const PRODUCT_ID_ALIASES = ['product_id', 'productid', 'id_producto', 'producto_id', 'id'];
const QUANTITY_ALIASES = [
  'quantity_change',
  'quantitychange',
  'cantidad_cambio',
  'cantidad',
  'ajuste',
  'ajuste_stock',
  'qty',
  'change',
];
const SERIAL_TRACKING_ALIASES = ['serial_tracking', 'serialtracking', 'tracking_serie', 'tracking_por_serie'];
const MAX_SQL_INT = 2147483647;

const normalizeHeader = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const detectDelimiter = (content: string): string => {
  const sample = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!sample) return ',';
  const candidates = [',', ';', '\t', '|'];
  const counts = candidates.map((delimiter) => ({
    delimiter,
    count: sample.split(delimiter).length - 1,
  }));
  counts.sort((a, b) => b.count - a.count);
  return counts[0]?.count > 0 ? counts[0].delimiter : ',';
};

const parseCsv = (content: string, delimiter: string): string[][] => {
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/\r/g, '').trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        if (char === '"') {
          if (inQuotes && line[index + 1] === '"') {
            current += '"';
            index += 1;
          } else {
            inQuotes = !inQuotes;
          }
          continue;
        }
        if (char === delimiter && !inQuotes) {
          values.push(current);
          current = '';
          continue;
        }
        current += char;
      }
      values.push(current);
      return values.map((value) => value.trim());
    });
};

const findHeaderIndex = (headers: string[], aliases: string[]): number => {
	const normalizedHeaders = headers.map(normalizeHeader);
	return normalizedHeaders.findIndex((header) => aliases.includes(header));
};

const buildPreviewFromCsv = (content: string): CsvPreview => {
	const delimiter = detectDelimiter(content);
	const rows = parseCsv(content, delimiter);
	if (rows.length === 0) {
		return {
			headers: [],
			rows: [],
			productIdHeader: null,
			quantityHeader: null,
			serialTrackingHeader: null,
			delimiter,
		};
	}

	const headers = rows[0];
	const productIdIndex = findHeaderIndex(headers, PRODUCT_ID_ALIASES);
	const quantityChangeIndex = findHeaderIndex(headers, QUANTITY_ALIASES);
	const serialTrackingIndex = findHeaderIndex(headers, SERIAL_TRACKING_ALIASES);

	const parsedRows = rows.slice(1).map((row, index) => {
		const productId = productIdIndex >= 0 ? String(row[productIdIndex] ?? '').trim() : '';
		const quantityChange = quantityChangeIndex >= 0 ? String(row[quantityChangeIndex] ?? '').trim() : '';
		const serialTrackingRaw = serialTrackingIndex >= 0 ? String(row[serialTrackingIndex] ?? '').trim().toLowerCase() : '';
		const sourceSerialTracking =
			serialTrackingIndex >= 0
				? ['1', 'true', 'si', 'sí', 'yes'].includes(serialTrackingRaw)
				: null;
		const productIdNumber = Number(productId);
		const quantityChangeNumber = Number(quantityChange);
		let error: string | null = null;

		if (productId.length === 0) {
			error = 'Falta product_id';
		} else if (!Number.isFinite(productIdNumber) || productIdNumber <= 0) {
			error = 'product_id inválido';
		} else if (quantityChange.length === 0) {
			error = 'Falta quantity_change';
		} else if (!Number.isFinite(quantityChangeNumber)) {
			error = 'quantity_change inválido';
		} else if (quantityChangeNumber === 0) {
			error = 'El ajuste no puede ser 0';
		}

		return {
			rowNumber: index + 2,
			raw: row,
			productId,
			quantityChange,
			sourceSerialTracking,
			error,
		};
	});

	return {
		headers,
		rows: parsedRows,
		productIdHeader: productIdIndex >= 0 ? headers[productIdIndex] ?? null : null,
		quantityHeader: quantityChangeIndex >= 0 ? headers[quantityChangeIndex] ?? null : null,
		serialTrackingHeader: serialTrackingIndex >= 0 ? headers[serialTrackingIndex] ?? null : null,
		delimiter,
	};
};

const getPreviewRowState = (
  row: ParsedImportRow,
  serialTrackedProductIds: Set<number>,
): PreviewRowState => {
	const productIdNumber = Number(row.productId);
	const quantityChangeNumber = Number(row.quantityChange);
	if (row.productId.trim().length === 0) return { kind: 'invalid', message: 'Falta product_id' };
	if (!Number.isFinite(productIdNumber) || productIdNumber <= 0) return { kind: 'invalid', message: 'product_id inválido' };
	if (!Number.isInteger(productIdNumber) || productIdNumber > MAX_SQL_INT) {
		return { kind: 'invalid', message: 'product_id fuera de rango' };
	}
	if (row.sourceSerialTracking === true) {
		return { kind: 'blocked', message: 'Producto serializado según CSV: usar módulo de equipos' };
	}
	if (serialTrackedProductIds.has(productIdNumber)) {
		return { kind: 'blocked', message: 'Producto serializado: usar módulo de equipos' };
	}
	if (row.quantityChange.trim().length === 0) return { kind: 'omitted', message: 'Sin ajuste: no se importará' };
	if (!Number.isFinite(quantityChangeNumber)) return { kind: 'invalid', message: 'quantity_change inválido' };
	if (quantityChangeNumber === 0) return { kind: 'omitted', message: 'Ajuste en 0: no se importará' };
	return { kind: 'importable', message: 'Lista para importar' };
};

const InventoryImportModal: React.FC<InventoryImportModalProps> = ({
	isOpen,
	onClose,
	branchId,
	onSubmit,
	isSubmitting,
	serialTrackedProductIds = [],
}) => {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [reason, setReason] = useState('Ajuste masivo por importación');
	const [notes, setNotes] = useState('');
	const [preview, setPreview] = useState<CsvPreview | null>(null);
	const [showSourceColumns, setShowSourceColumns] = useState(false);
	const serialTrackedIdsSet = useMemo(() => new Set(serialTrackedProductIds), [serialTrackedProductIds]);

	const validPreviewRows = useMemo(
		() => preview?.rows.filter((row) => getPreviewRowState(row, serialTrackedIdsSet).kind === 'importable') ?? [],
		[preview, serialTrackedIdsSet],
	);

	const invalidPreviewRows = useMemo(
		() => preview?.rows.filter((row) => {
			const state = getPreviewRowState(row, serialTrackedIdsSet);
			return state.kind === 'invalid' || state.kind === 'blocked';
		}) ?? [],
		[preview, serialTrackedIdsSet],
	);

	const blockedPreviewRows = useMemo(
		() => preview?.rows.filter((row) => getPreviewRowState(row, serialTrackedIdsSet).kind === 'blocked') ?? [],
		[preview, serialTrackedIdsSet],
	);

	const omittedPreviewRows = useMemo(
		() => preview?.rows.filter((row) => getPreviewRowState(row, serialTrackedIdsSet).kind === 'omitted') ?? [],
		[preview, serialTrackedIdsSet],
	);

	const importButtonDisabled = isSubmitting || !preview || validPreviewRows.length === 0;

	const resetState = () => {
		setSelectedFile(null);
		setReason('Ajuste masivo por importación');
		setNotes('');
		setPreview(null);
		setShowSourceColumns(false);
		if (fileInputRef.current) fileInputRef.current.value = '';
	};

	const updatePreviewRow = (
		rowNumber: number,
		field: 'productId' | 'quantityChange',
		value: string,
	) => {
		setPreview((currentPreview) => {
			if (!currentPreview) return currentPreview;
			return {
				...currentPreview,
				rows: currentPreview.rows.map((row) => {
					if (row.rowNumber !== rowNumber) return row;
					return {
						...row,
						[field]: value,
						error: null,
					};
				}),
			};
		});
	};

	const handleFileSelection = async (file: File | null) => {
		setSelectedFile(file);
		setPreview(null);
		if (!file) return;
		if (!file.name.toLowerCase().endsWith('.csv')) {
			toast.error('Solo se admite importación de archivos CSV');
			return;
		}
		const content = await file.text();
		const nextPreview = buildPreviewFromCsv(content);
		if (nextPreview.headers.length === 0 || nextPreview.rows.length === 0) {
			toast.error('El archivo no contiene datos de inventario');
			setPreview(nextPreview);
			return;
		}
		setPreview(nextPreview);
		if (!nextPreview.productIdHeader || !nextPreview.quantityHeader) {
			toast.warning('No se detectaron automáticamente todas las columnas. Revisa y corrige la preview antes de importar.');
			return;
		}
		const nextRowStates = nextPreview.rows.map((row) => getPreviewRowState(row, serialTrackedIdsSet));
		const blockedCount = nextRowStates.filter((state) => state.kind === 'blocked').length;
		if (blockedCount > 0 && blockedCount === nextPreview.rows.length) {
			toast.warning('Este CSV contiene solo productos serializados. Debes moverlos desde el módulo de equipos.');
			return;
		}
		toast.info(`Se cargaron ${nextPreview.rows.length} fila(s) para revisión previa.`);
	};

	const handleClose = () => {
		if (isSubmitting) return;
		resetState();
		onClose();
	};

	const handleImport = async () => {
		if (importButtonDisabled) {
			return;
		}
		if (!branchId) {
			toast.error('Debes seleccionar una sucursal para importar inventario');
			return;
		}
		if (!selectedFile) {
			toast.info('Selecciona un archivo CSV para importar');
			return;
		}
		if (!preview) {
			toast.info('Carga un CSV y revisa la previsualización antes de importar');
			return;
		}
		const rowStates = preview.rows.map((row) => getPreviewRowState(row, serialTrackedIdsSet));
		const items = validPreviewRows.map((row) => ({
			product_id: Number(row.productId),
			quantity_change: Number(row.quantityChange),
		}));
		if (items.length === 0) {
			const blockedCount = rowStates.filter((state) => state.kind === 'blocked').length;
			const invalidCount = rowStates.filter((state) => state.kind === 'invalid').length;
			const omittedCount = rowStates.filter((state) => state.kind === 'omitted').length;

			if (blockedCount > 0 && blockedCount === preview.rows.length) {
				toast.error('Todas las filas seleccionadas corresponden a productos serializados. Usa el módulo de equipos para moverlas.');
				return;
			}
			if (omittedCount > 0 && omittedCount === preview.rows.length) {
				toast.error('No hay filas con quantity_change distinto de 0 para importar.');
				return;
			}
			if (invalidCount > 0 && invalidCount === preview.rows.length) {
				toast.error('Todas las filas tienen errores. Corrige la preview antes de importar.');
				return;
			}
			if (blockedCount > 0 || invalidCount > 0 || omittedCount > 0) {
				const details = [
					blockedCount > 0 ? `${blockedCount} serializadas bloqueadas` : null,
					invalidCount > 0 ? `${invalidCount} inválidas` : null,
					omittedCount > 0 ? `${omittedCount} omitidas` : null,
				]
					.filter(Boolean)
					.join(', ');
				toast.error(`No hay filas listas para importar. Revisa la preview: ${details}.`);
				return;
			}
			toast.error('No hay filas listas para importar.');
			return;
		}
		await onSubmit({
			branch_id: branchId,
			reason: reason.trim() || 'Ajuste masivo por importación',
			notes: notes.trim() || undefined,
			items,
		});
		resetState();
		onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleClose} isCentered size='2xl'>
			<ModalHeader>Importar inventario</ModalHeader>
			<ModalBody>
				<div className='grid max-h-[75vh] gap-4 overflow-y-auto overflow-x-hidden pr-1'>
					<div className='rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-300'>
						<p className='font-medium'>Carga flexible con previsualización</p>
						<p className='mt-1'>Se intentan detectar columnas equivalentes a `product_id` y `quantity_change`.</p>
						<p className='mt-1'>Antes de importar puedes revisar y corregir cada fila detectada.</p>
					</div>
					<div>
						<input
							ref={fileInputRef}
							type='file'
							accept='.csv,text/csv'
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const file = event.target.files?.[0] ?? null;
								void handleFileSelection(file);
							}}
							className='hidden'
						/>
						<Button variant='outline' icon='HeroDocumentPlus' onClick={() => fileInputRef.current?.click()}>
							{selectedFile ? 'Cambiar archivo' : 'Seleccionar CSV'}
						</Button>
						{selectedFile && <p className='mt-2 text-xs text-neutral-500'>{selectedFile.name}</p>}
					</div>
					{preview && (
						<div className='min-w-0 overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900/40'>
							<div className='flex flex-wrap items-center justify-between gap-3'>
								<div>
									<p className='text-sm font-semibold text-neutral-800 dark:text-neutral-100'>Previsualización de importación</p>
									<p className='mt-1 text-xs text-neutral-500'>
										Separador detectado: {preview.delimiter === '\t' ? 'tab' : preview.delimiter} · Columnas detectadas: ID = {preview.productIdHeader ?? 'no detectada'} · Ajuste = {preview.quantityHeader ?? 'no detectada'} · Tracking = {preview.serialTrackingHeader ?? 'no detectada'}
									</p>
								</div>
								<div className='flex flex-wrap gap-2'>
									<span className='rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'>
										{validPreviewRows.length} válidas
									</span>
									<span className='rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'>
										{blockedPreviewRows.length} bloqueadas
									</span>
									<span className='rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300'>
										{omittedPreviewRows.length} omitidas
									</span>
									<span className='rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'>
										{invalidPreviewRows.length - blockedPreviewRows.length} inválidas
									</span>
									<button
										type='button'
										onClick={() => setShowSourceColumns((prev) => !prev)}
										className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
											showSourceColumns
												? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300'
												: 'border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
										}`}>
										{showSourceColumns ? 'Ocultar columnas CSV' : 'Mostrar columnas CSV'}
									</button>
								</div>
							</div>
							<div className='mt-4 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-400'>
								Solo se importarán filas con `quantity_change` informado y distinto de `0`.
							</div>
							{validPreviewRows.length === 0 ? (
								<div className='mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'>
									No hay filas listas para importar. Revisa los estados de la preview antes de continuar.
								</div>
							) : null}
							<div className='mt-3 min-w-0 overflow-x-auto rounded-lg border border-dashed border-neutral-200 dark:border-neutral-700'>
								<div className='max-h-[42vh] min-w-max overflow-y-auto'>
									<table className='min-w-full divide-y divide-neutral-200 dark:divide-neutral-800'>
									<thead className='bg-neutral-50 dark:bg-neutral-900/60'>
										<tr>
											<th className='px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500'>Fila</th>
											<th className='px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500'>product_id</th>
											<th className='px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500'>quantity_change</th>
											{showSourceColumns
												? preview.headers.map((header, index) => (
														<th
															key={`${header}-${index}`}
															className='px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500'>
															{header || `Columna ${index + 1}`}
														</th>
													))
												: null}
											<th className='px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500'>Estado</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-950/60'>
										{preview.rows.map((row) => {
											const rowState = getPreviewRowState(row, serialTrackedIdsSet);
											return (
												<tr key={row.rowNumber} className='align-top'>
													<td className='px-3 py-3 text-xs text-neutral-500'>{row.rowNumber}</td>
													<td className='min-w-[140px] px-3 py-3'>
														<Input
															id={`preview-product-${row.rowNumber}`}
															name={`preview-product-${row.rowNumber}`}
															value={row.productId}
															onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
																updatePreviewRow(row.rowNumber, 'productId', event.target.value)
															}
															className='min-w-[110px]'
															dimension='sm'
														/>
													</td>
													<td className='min-w-[150px] px-3 py-3'>
														<Input
															id={`preview-qty-${row.rowNumber}`}
															name={`preview-qty-${row.rowNumber}`}
															value={row.quantityChange}
															onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
																updatePreviewRow(row.rowNumber, 'quantityChange', event.target.value)
															}
															placeholder='Ej: 5 o -3'
															className='min-w-[120px]'
															dimension='sm'
														/>
													</td>
													{showSourceColumns
														? preview.headers.map((header, index) => (
															<td
																key={`${row.rowNumber}-${header}-${index}`}
																className='max-w-[220px] px-3 py-3 text-xs text-neutral-600 dark:text-neutral-300'>
																<div className='truncate' title={row.raw[index] ?? ''}>
																	{row.raw[index] ?? '—'}
																</div>
															</td>
														))
														: null}
													<td className='px-3 py-3 text-xs'>
														{rowState.kind === 'invalid' ? (
															<span className='rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'>
																{rowState.message}
															</span>
														) : rowState.kind === 'blocked' ? (
															<span className='rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'>
																{rowState.message}
															</span>
														) : rowState.kind === 'omitted' ? (
															<span className='rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300'>
																{rowState.message}
															</span>
														) : (
															<span className='rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'>
																{rowState.message}
															</span>
														)}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
								</div>
							</div>
						</div>
					)}
					<div>
						<label className='mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200'>Motivo</label>
						<Input id='inventory-import-reason' name='inventory-import-reason' value={reason} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReason(e.target.value)} />
					</div>
					<div>
						<label className='mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-200'>Notas</label>
						<Input id='inventory-import-notes' name='inventory-import-notes' value={notes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)} />
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<div className='ml-auto flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center'>
					<Button variant='outline' onClick={handleClose} isDisable={isSubmitting}>Cancelar</Button>
					<Button color='blue' icon='HeroArrowUpTray' onClick={() => void handleImport()} isLoading={isSubmitting} isDisable={importButtonDisabled}>
						Importar {validPreviewRows.length > 0 ? `(${validPreviewRows.length})` : ''}
					</Button>
				</div>
			</ModalFooter>
		</Modal>
	);
};

export default InventoryImportModal;
