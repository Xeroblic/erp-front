import { useCallback, useEffect, useRef, useState } from 'react';
import getDeferredPaymentErrorMessage from '@/utils/deferredPaymentsError.utils';
import type { DeferredPaymentExportDownload } from '@/services/deferredPaymentsService';

type PaginationParams = { page?: number; per_page?: number };

const asRecord = (value: unknown): Record<string, unknown> | null =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;

const isBlobTextPayload = (value: unknown): value is { text: () => Promise<string> } => {
	const record = asRecord(value);
	return typeof record?.text === 'function';
};

const getDownloadErrorMessage = async (error: unknown, fallback: string): Promise<string> => {
	const response = asRecord(asRecord(error)?.response);
	const data = response?.data;
	if (!isBlobTextPayload(data)) return getDeferredPaymentErrorMessage(error, fallback);
	try {
		const payload: unknown = JSON.parse(await data.text());
		return getDeferredPaymentErrorMessage(
			{ response: { ...response, data: payload } },
			fallback,
		);
	} catch {
		return getDeferredPaymentErrorMessage(error, fallback);
	}
};

const triggerBrowserDownload = ({ blob, fileName }: DeferredPaymentExportDownload): void => {
	if (!fileName) throw new Error('El servidor no envió el nombre del archivo exportado.');
	const objectUrl = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = objectUrl;
	anchor.download = fileName;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

export const withoutPagination = <T extends PaginationParams>(
	params: T,
): Omit<T, 'page' | 'per_page'> => {
	const { page: pageToOmit, per_page: perPageToOmit, ...filters } = params;
	return filters;
};

interface UseDeferredPaymentsExportOptions<T extends PaginationParams> {
	disabled: boolean;
	ownerContext: number | null;
	download: (
		params: T | Omit<T, 'page' | 'per_page'>,
		signal: AbortSignal,
	) => Promise<DeferredPaymentExportDownload>;
}

interface ExportState {
	ownerContext: number | null;
	requestId: number;
	isExporting: boolean;
	error: string | null;
}

const useDeferredPaymentsExport = <T extends PaginationParams>({
	disabled,
	ownerContext,
	download,
}: UseDeferredPaymentsExportOptions<T>) => {
	const [exportState, setExportState] = useState<ExportState>({
		ownerContext,
		requestId: 0,
		isExporting: false,
		error: null,
	});
	const controllerRef = useRef<AbortController | null>(null);
	const isExportingRef = useRef(false);
	const ownerContextRef = useRef(ownerContext);
	const requestIdRef = useRef(0);
	ownerContextRef.current = ownerContext;
	useEffect(
		() => () => {
			requestIdRef.current += 1;
			controllerRef.current?.abort();
			controllerRef.current = null;
			isExportingRef.current = false;
		},
		[ownerContext],
	);
	const runExport = useCallback(
		async (params: T | Omit<T, 'page' | 'per_page'>) => {
			if (disabled || ownerContext === null || isExportingRef.current) return;
			const requestId = requestIdRef.current + 1;
			const controller = new AbortController();
			requestIdRef.current = requestId;
			controllerRef.current = controller;
			isExportingRef.current = true;
			setExportState({ ownerContext, requestId, isExporting: true, error: null });
			const isCurrentRequest = () =>
				requestId === requestIdRef.current && ownerContext === ownerContextRef.current;
			try {
				const exportDownload = await download(params, controller.signal);
				if (controller.signal.aborted || !isCurrentRequest()) return;
				triggerBrowserDownload(exportDownload);
			} catch (requestError: unknown) {
				if (controller.signal.aborted || !isCurrentRequest()) return;
				const error = await getDownloadErrorMessage(
					requestError,
					'No se pudo exportar el archivo.',
				);
				if (controller.signal.aborted || !isCurrentRequest()) return;
				setExportState({ ownerContext, requestId, isExporting: true, error });
			} finally {
				if (isCurrentRequest()) {
					controllerRef.current = null;
					isExportingRef.current = false;
					setExportState((current) => ({ ...current, isExporting: false }));
				}
			}
		},
		[disabled, download, ownerContext],
	);
	const isCurrentContext = exportState.ownerContext === ownerContext;
	return {
		isExporting: isCurrentContext && exportState.isExporting,
		error: isCurrentContext ? exportState.error : null,
		exportPage: runExport,
		exportAll: runExport,
	};
};

export default useDeferredPaymentsExport;
