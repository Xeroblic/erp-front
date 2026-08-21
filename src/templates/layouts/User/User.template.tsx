import React from 'react';
import Icon from '../../../components/icon/Icon';
import Badge from '../../../components/ui/Badge';
import { NavItem, NavSeparator } from '../../../components/layouts/Navigation/Nav';
import { authPages } from '../../../config/pages.config';
import User from '../../../components/layouts/User/User';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutThunk } from '@/store/slices/auth/authSlice';
import { clearPersonalizacionState } from '@/store/slices/personalizacion/personalizacionSlice';
import { cancelAllRequests } from '../../../services/BaseService';
import type { IUserMe } from '@/interface/user.interface';

const UserTemplate = () => {
	const dispatch = useAppDispatch();
	const { user: userData, loading: isLoading } = useAppSelector((state) => state.auth);

	const handleLogout = async () => {
		cancelAllRequests();
		await dispatch(logoutThunk());
		dispatch(clearPersonalizacionState());
		setTimeout(() => {
			window.location.href = '/login';
		}, 100);
	};

	const resolveAvatar = (image: IUserMe['image'] | undefined) => {
		if (!image) return '';
		if (typeof image === 'string') return image;
		const candidates = [
			image?.md,
			image?.sm,
			image?.lg,
			image?.original_url,
			image?.url,
			image?.path,
			image?.thumb,
			image?.medium,
			image?.full,
			image?.urls?.md,
			image?.urls?.sm,
			image?.urls?.lg,
			image?.urls?.original,
		];
		return candidates.find((item) => typeof item === 'string' && item.length > 0) ?? '';
	};

	const userName =
		[userData?.first_name, userData?.last_name].filter(Boolean).join(' ').trim() ||
		userData?.email ||
		'Usuario';
	const avatarSrc = resolveAvatar(userData?.image);
	const userPosition = userData?.cargo ?? '';

	return (
		<User
			isLoading={isLoading}
			name={userName}
			nameSuffix={<Icon icon='DuoDoneCircle' />}
			position={userPosition}
			src={avatarSrc || undefined}
			suffix={
				<Badge color='amber' variant='outline' className='px-1 text-xs font-bold'>
					{userData?.cargo ?? 'Usuario'}
				</Badge>
			}>
			<NavSeparator />
			<NavItem {...authPages.profilePage} />
			{/* <NavItem {...appPages.mailAppPages.subPages.inboxPages}>
				<Badge variant='solid' className='leading-none'>
					3
				</Badge>
				<NavButton icon='HeroPlusCircle' title='New Mail' onClick={() => {}} />
			</NavItem> */}
			<NavItem text='Logout' icon='DuoSignOut' onClick={handleLogout} />
		</User>
	);
};

export default UserTemplate;
