import { useMemo } from 'react';
import ApiService from '@/services/ApiService';
import { userMeThunk } from '@/store/slices/auth/authSlice';
import { getAvatarUrlFromUser } from '../helpers/profile.helpers';
import { toast } from 'react-toastify';

export function useProfileAvatar(userData: any, userId: number | null, dispatch: any, maxMb = 5) {
	const avatarUrl = useMemo(() => getAvatarUrlFromUser(userData), [userData]);

	const handleAvatarUpload = async (file: File) => {
		if (!userId) {
			toast.error('No se encontro la informacion del usuario activo');
			return;
		}
		const allowed = ['image/jpeg', 'image/webp', 'image/png', 'image/jpg'];
		if (!allowed.includes(file.type)) {
			toast.error('Solo se permiten imagenes JPG o PNG');
			return;
		}
		const maxBytes = maxMb * 1024 * 1024;
		if (file.size > maxBytes) {
			toast.error(`La imagen debe pesar menos de ${maxMb}MB`);
			return;
		}

		try {
			const formData = new FormData();
			formData.append('avatar', file);
			formData.append('image', file);

			const response = await ApiService.fetchData<{ data?: any; image?: any }, FormData>({
				url: `/users/${userId}/avatar`,
				method: 'post',
				data: formData,
			});

			const hasMedia = Boolean(response.data?.data ?? response.data?.image);
			toast.success('Imagen actualizada', { autoClose: 1000 });
			await dispatch(userMeThunk() as any);
			if (!hasMedia) {
				setTimeout(() => dispatch(userMeThunk() as any), 500);
			}
		} catch (error: any) {
			const status = error?.response?.status;
			const backendErrors =
				error?.response?.data?.error ||
				error?.response?.data?.detail ||
				error?.response?.data?.message ||
				(Array.isArray(error?.response?.data) ? error.response.data.join(', ') : null);
			const message =
				status === 404
					? 'El endpoint para subir avatar no esta disponible. Verifica la version del backend.'
					: backendErrors || error?.message || 'No se pudo actualizar la imagen';
			toast.error(message);
		}
	};

	return { avatarUrl, handleAvatarUpload };
}

