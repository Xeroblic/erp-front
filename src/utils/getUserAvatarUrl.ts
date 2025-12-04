import { IUserMe } from '@/interface/user.interface';

export function getUserAvatarUrl(
	user: (Pick<IUserMe, 'image'> & { image_url?: string | null }) | any,
): string | undefined {
	const img = user?.image;
	const direct = typeof img === 'string' ? img : undefined;
	const obj = typeof img === 'object' && img ? img : undefined;
	const url =
		user?.image_url ||
		direct ||
		obj?.md ||
		obj?.sm ||
		obj?.lg ||
		obj?.url ||
		obj?.path ||
		obj?.thumb ||
		obj?.medium ||
		obj?.full ||
		obj?.urls?.md ||
		obj?.urls?.sm ||
		obj?.urls?.lg ||
		obj?.urls?.original ||
		undefined;
	return url || undefined;
}

export default getUserAvatarUrl;
