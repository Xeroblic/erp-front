// Modal para editar integración WooCommerce
import React from 'react';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { WooCommerceConfig } from '../types/woocommerce.types';

interface Props {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	config: WooCommerceConfig;
	onSave: (config: WooCommerceConfig) => void;
	loading?: boolean;
}

const WooCommerceEditModal: React.FC<Props> = ({ isOpen, setIsOpen, config, onSave, loading }) => {
	// Aquí podrías usar Formik/Yup para editar los datos
	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='lg'>
			<ModalHeader>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
						<Icon icon='HeroPencil' className='h-6 w-6 text-blue-600' />
					</div>
					<div>
						<h3 className='text-lg font-semibold text-gray-900'>Editar Integración</h3>
						<p className='text-sm text-gray-500'>{config.url}</p>
					</div>
				</div>
			</ModalHeader>
			<ModalBody>
				{/* Aquí iría el formulario de edición, puedes reutilizar WooCommerceConfigForm si lo modularizas */}
				<p className='text-gray-700'>Formulario de edición aquí...</p>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button variant='outline' onClick={() => setIsOpen(false)} isDisable={loading}>
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='solid'
						color='blue'
						onClick={() => onSave(config)}
						isLoading={loading}
						isDisable={loading}
						icon='HeroCheck'>
						Guardar Cambios
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default WooCommerceEditModal;
