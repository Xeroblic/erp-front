import ApiService from './ApiService';
import type { ProductResourcePayload } from '@/interface/product.interface';
import type {
	ChannelNamePayload,
	ChannelPricePayload,
	ChannelVisibilityPayload,
} from '@/types/productChannels.types';

type ChannelResponse = { data: ProductResourcePayload } | ProductResourcePayload;

const unwrap = (body: ChannelResponse): ProductResourcePayload =>
	'data' in body && body.data ? body.data : (body as ProductResourcePayload);

export const updateChannelPrice = async (
	subsidiaryId: number,
	productId: number,
	payload: ChannelPricePayload,
) => {
	const response = await ApiService.fetchData<ChannelResponse, ChannelPricePayload>({
		url: `/subsidiaries/${subsidiaryId}/products/${productId}/channel-price`,
		method: 'PATCH',
		data: payload,
	});
	return unwrap(response.data);
};

export const updateChannelName = async (
	subsidiaryId: number,
	productId: number,
	payload: ChannelNamePayload,
) => {
	const response = await ApiService.fetchData<ChannelResponse, ChannelNamePayload>({
		url: `/subsidiaries/${subsidiaryId}/products/${productId}/channel-name`,
		method: 'PATCH',
		data: payload,
	});
	return unwrap(response.data);
};

export const updateChannelVisibility = async (
	subsidiaryId: number,
	productId: number,
	payload: ChannelVisibilityPayload,
) => {
	const response = await ApiService.fetchData<ChannelResponse, ChannelVisibilityPayload>({
		url: `/subsidiaries/${subsidiaryId}/products/${productId}/channel-visibility`,
		method: 'PATCH',
		data: payload,
	});
	return unwrap(response.data);
};
