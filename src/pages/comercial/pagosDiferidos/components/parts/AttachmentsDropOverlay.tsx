import React from 'react';
import Icon from '@/components/icon/Icon';

interface Props {
	isVisible: boolean;
}

/**
 * Indicador visual mientras se arrastran archivos sobre el modal.
 *
 * Es puramente informativo: no captura eventos (`pointer-events-none`) y queda
 * fuera del arbol accesible, porque la via accesible para adjuntar sigue siendo
 * el boton "Agregar archivos".
 */
const AttachmentsDropOverlay: React.FC<Props> = ({ isVisible }) => {
	if (!isVisible) return null;

	return (
		<div
			aria-hidden='true'
			data-testid='attachments-drop-overlay'
			className='pointer-events-none fixed inset-0 z-[1100] flex items-center justify-center bg-zinc-900/40 p-6 backdrop-blur-[2px]'>
			<div className='flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-blue-400 bg-white/95 px-10 py-8 text-center shadow-2xl dark:bg-zinc-900/95'>
				<Icon icon='HeroArrowUpTray' size='text-4xl' className='text-blue-500' />
				<p className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
					Suelta los archivos para adjuntarlos
				</p>
				<p className='text-sm text-zinc-500'>PDF, imágenes o planillas de hasta 10 MB.</p>
			</div>
		</div>
	);
};

export default AttachmentsDropOverlay;
