// Modal de confirmación para eliminar integración WooCommerce
import React from 'react';
import Modal, {
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

interface Props {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	url: string;
	onDelete: () => void;
	loading?: boolean;
}

const WooCommerceDeleteModal: React.FC<Props> = ({ isOpen, setIsOpen, url, onDelete, loading }) => (
	<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='md'>
		<ModalHeader>
			<div className='flex items-center gap-3'>
				<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
					<Icon icon='HeroExclamationTriangle' className='h-6 w-6 text-red-600' />
				</div>
				<div>
					<h3 className='text-lg font-semibold text-gray-900'>Eliminar Integración</h3>
					<p className='text-sm text-gray-500'>{url}</p>
				</div>
			</div>
		</ModalHeader>
		<ModalBody>
			<p className='text-gray-700'>
				¿Está seguro que desea eliminar la integración con <strong>{url}</strong>?
			</p>
			<div className='mt-4 rounded-lg border-l-4 border-red-400 bg-red-50 p-4'>
				<ul className='list-disc pl-4 text-sm text-red-700'>
					<li>Se eliminará toda la configuración de la integración</li>
					<li>Se detendrán todas las sincronizaciones automáticas</li>
					<li>Los datos históricos de sincronización se perderán</li>
				</ul>
			</div>
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
					color='red'
					onClick={onDelete}
					isLoading={loading}
					isDisable={loading}
					icon='HeroTrash'>
					Eliminar
				</Button>
			</ModalFooterChild>
		</ModalFooter>
	</Modal>
);

export default WooCommerceDeleteModal;
