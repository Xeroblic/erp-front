import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as channelsService from '@/services/productChannelsService';
import extractApiErrorMessage from '@/utils/apiError.utils';
import type {
	ChannelNamePayload,
	ChannelPricePayload,
	ChannelVisibilityPayload,
} from '@/types/productChannels.types';

export const useChannelPriceMutation = (subsidiaryId: number | null, productId: number) =>
	useMutation({
		mutationFn: (payload: ChannelPricePayload) =>
			channelsService.updateChannelPrice(subsidiaryId!, productId, payload),
		onSuccess: () => toast.success('Precio del canal actualizado'),
		onError: (error: unknown) => toast.error(extractApiErrorMessage(error)),
	});

export const useChannelNameMutation = (subsidiaryId: number | null, productId: number) =>
	useMutation({
		mutationFn: (payload: ChannelNamePayload) =>
			channelsService.updateChannelName(subsidiaryId!, productId, payload),
		onSuccess: () => toast.success('Nombre del canal actualizado'),
		onError: (error: unknown) => toast.error(extractApiErrorMessage(error)),
	});

export const useChannelVisibilityMutation = (subsidiaryId: number | null, productId: number) =>
	useMutation({
		mutationFn: (payload: ChannelVisibilityPayload) =>
			channelsService.updateChannelVisibility(subsidiaryId!, productId, payload),
		onSuccess: () => toast.success('Visibilidad del canal actualizada'),
		onError: (error: unknown) => toast.error(extractApiErrorMessage(error)),
	});
