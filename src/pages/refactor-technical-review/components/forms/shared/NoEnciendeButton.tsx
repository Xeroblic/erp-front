import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';

interface NoEnciendeButtonProps {
	onConfirm: () => void;
	onValidate?: () => boolean;
	className?: string;
}

export const NoEnciendeButton: React.FC<NoEnciendeButtonProps> = ({
	onConfirm,
	onValidate,
	className = '',
}) => {
	const [isConfirming, setIsConfirming] = useState(false);
	return (
		<>
			<Button
				type='button'
				variant='outline'
				color='red'
				icon='HeroBoltSlash'
				onClick={() => {
					if (onValidate && !onValidate()) {
						return;
					}
					setIsConfirming(true);
				}}
				className={`w-full border-2 border-dashed bg-white hover:bg-red-50 dark:bg-zinc-900 dark:hover:bg-red-900/20 ${className}`}>
				Equipo NO ENCIENDE (Enviar como Categoría M)
			</Button>

			<Modal isOpen={isConfirming} setIsOpen={setIsConfirming} size='md' isCentered={true}>
				<ModalHeader className='text-red-600 dark:text-red-400'>
					<div className='flex items-center gap-3'>
						<Icon icon='HeroExclamationTriangle' className='h-8 w-8' />
						¿Confirmar que el equipo no enciende?
					</div>
				</ModalHeader>
				<ModalBody>
					<p className='text-base font-black text-red-700 dark:text-red-300'>
						Asegúrate de haber revisado el equipo correctamente. Si alguna pieza es
						funcional o sirve como repuesto (ej. la pantalla), modifica la revisión
						después de enviar.
					</p>
					<p className='mt-4 text-sm text-zinc-600 dark:text-zinc-400'>
						Se llenará automáticamente el formulario con valores mínimos y observación
						"No enciende" (Categoría M). El formulario se enviará de inmediato.
					</p>
				</ModalBody>
				<ModalFooter>
					<Button variant='outline' color='zinc' onClick={() => setIsConfirming(false)}>
						Cancelar
					</Button>
					<Button
						variant='solid'
						color='red'
						onClick={() => {
							setIsConfirming(false);
							onConfirm();
						}}>
						Confirmar y Enviar a Categoría M
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
};
