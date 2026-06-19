import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as wooService from '@/services/woocommerceProductsService';
import type {
	WooCompareParams,
	WooCandidatesParams,
	WooLinkPayload,
} from '@/types/integrations.types';

const KEYS = {
	candidates: (subsidiaryId: number, productId: number) =>
		['woo-candidates', subsidiaryId, productId] as const,
	compare: (subsidiaryId: number, productId: number) =>
		['woo-compare', subsidiaryId, productId] as const,
};

export const useWooCandidates = (
	subsidiaryId: number | null,
	productId: number,
	params?: WooCandidatesParams,
	enabled = false,
) => {
	return useQuery({
		queryKey: [...KEYS.candidates(subsidiaryId ?? 0, productId), params],
		queryFn: () => wooService.searchCandidates(subsidiaryId!, productId, params),
		enabled: enabled && subsidiaryId !== null,
	});
};

export const useWooCompare = (
	subsidiaryId: number | null,
	productId: number,
	params: WooCompareParams | null,
) => {
	return useQuery({
		queryKey: [...KEYS.compare(subsidiaryId ?? 0, productId), params],
		queryFn: () => wooService.compareProduct(subsidiaryId!, productId, params!),
		enabled: subsidiaryId !== null && params !== null,
	});
};

export const useWooLink = (subsidiaryId: number | null, productId: number) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: WooLinkPayload) =>
			wooService.linkProduct(subsidiaryId!, productId, payload),
		onSuccess: (data) => {
			toast.success(data.message || 'Producto vinculado correctamente');
			queryClient.invalidateQueries({
				queryKey: KEYS.candidates(subsidiaryId ?? 0, productId),
			});
		},
		onError: (error: unknown) => {
			const msg = extractErrorMessage(error);
			if (!msg.includes('price_resolution')) {
				toast.error(msg);
			}
		},
	});
};

export const useWooUnlink = (subsidiaryId: number | null, productId: number) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => wooService.unlinkProduct(subsidiaryId!, productId),
		onSuccess: (data) => {
			toast.success(data.message || 'Producto desvinculado correctamente');
			queryClient.invalidateQueries({
				queryKey: KEYS.candidates(subsidiaryId ?? 0, productId),
			});
		},
		onError: (error: unknown) => {
			toast.error(extractErrorMessage(error));
		},
	});
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined => {
	if (value && typeof value === 'object' && !Array.isArray(value)) return value as UnknownRecord;
	return undefined;
};

export const extractErrorMessage = (error: unknown): string => {
	const responseRecord = asRecord(asRecord(error)?.response);
	const dataRecord = asRecord(responseRecord?.data);
	const message = dataRecord?.message;
	if (typeof message === 'string' && message.trim()) return message;
	if (error instanceof Error && error.message.trim()) return error.message;
	return 'Error inesperado';
};

export const extractConflictData = (
	error: unknown,
): { erp_price: string | number | null; woo_price: string | number | null } | null => {
	const responseRecord = asRecord(asRecord(error)?.response);
	const status = responseRecord?.status;
	if (status !== 409) return null;
	const dataRecord = asRecord(responseRecord?.data);
	if (!dataRecord) return null;
	const erpPrice = dataRecord.erp_price as string | number | null | undefined;
	const wooPrice = dataRecord.woo_price as string | number | null | undefined;
	if (erpPrice !== undefined || wooPrice !== undefined) {
		return { erp_price: erpPrice ?? null, woo_price: wooPrice ?? null };
	}
	return null;
};
