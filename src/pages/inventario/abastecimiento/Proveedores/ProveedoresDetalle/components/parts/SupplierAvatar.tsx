import React from 'react';
import Icon from '@/components/icon/Icon';

interface ISupplierAvatarProps {
	displayName: string;
}

const getInitials = (displayName: string): string =>
	displayName
		.split(' ')
		.filter(Boolean)
		.map((word) => word[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();

/**
 * Avatar circular de la ficha de proveedor, con las iniciales del nombre. El
 * contrato de proveedores no define foto: el control para subirla (que sólo
 * la guardaba en este navegador, por filial e ID) se retiró al conectar la
 * ficha con el backend real, porque un proveedor real podía heredar la foto
 * simulada de otro con el mismo ID. Vuelve cuando exista ese campo.
 */
const SupplierAvatar: React.FC<ISupplierAvatarProps> = ({ displayName }) => {
	const initials = getInitials(displayName);

	return (
		<div
			aria-hidden='true'
			className='flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-zinc-100 text-xl font-semibold text-zinc-400 shadow-sm dark:border-zinc-900 dark:bg-zinc-800 dark:text-zinc-500 sm:h-24 sm:w-24'>
			{initials || <Icon icon='HeroBuildingStorefront' size='text-3xl' />}
		</div>
	);
};

export default SupplierAvatar;
