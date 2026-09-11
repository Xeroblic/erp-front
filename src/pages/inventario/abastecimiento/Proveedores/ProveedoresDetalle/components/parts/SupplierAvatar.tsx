import React, { useCallback, useRef } from 'react';
import Icon from '@/components/icon/Icon';

interface ISupplierAvatarProps {
	photoUrl: string | null;
	displayName: string;
	isUploading: boolean;
	onUpload: (file: File) => void;
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
 * Avatar circular de la ficha de proveedor, con overlay de cámara para
 * cambiar la foto. La persistencia de la foto es de UI únicamente — ver
 * `useSupplierPhoto` — así que este componente no sabe nada de subsidiarias
 * ni del contrato, sólo recibe la URL resuelta y notifica el archivo elegido.
 */
const SupplierAvatar: React.FC<ISupplierAvatarProps> = ({
	photoUrl,
	displayName,
	isUploading,
	onUpload,
}) => {
	const inputRef = useRef<HTMLInputElement | null>(null);

	const openFilePicker = useCallback(() => inputRef.current?.click(), []);

	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (file) onUpload(file);
			event.target.value = '';
		},
		[onUpload],
	);

	const initials = getInitials(displayName);

	return (
		<div className='relative h-20 w-20 shrink-0 sm:h-24 sm:w-24'>
			<input
				ref={inputRef}
				type='file'
				accept='image/*'
				onChange={handleChange}
				className='sr-only'
				aria-label='Cambiar foto del proveedor'
			/>
			<div className='h-full w-full overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow-sm dark:border-zinc-900 dark:bg-zinc-800'>
				{photoUrl ? (
					<img src={photoUrl} alt={displayName} className='h-full w-full object-cover' />
				) : (
					<div className='flex h-full w-full items-center justify-center text-xl font-semibold text-zinc-400 dark:text-zinc-500'>
						{initials || <Icon icon='HeroBuildingStorefront' size='text-3xl' />}
					</div>
				)}
			</div>
			<button
				type='button'
				onClick={openFilePicker}
				disabled={isUploading}
				aria-label='Cambiar foto del proveedor'
				className='absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60'>
				<Icon
					icon={isUploading ? 'HeroArrowPath' : 'HeroCamera'}
					size='text-base'
					color='white'
					className={isUploading ? 'animate-spin' : ''}
				/>
			</button>
		</div>
	);
};

export default SupplierAvatar;
