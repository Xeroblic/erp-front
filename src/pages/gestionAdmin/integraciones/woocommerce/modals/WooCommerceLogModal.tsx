// Modal para ver log de errores de integración WooCommerce
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
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	log: string;
}

const WooCommerceLogModal: React.FC<Props> = ({ isOpen, setIsOpen, log }) => (
	<Modal isOpen={isOpen} setIsOpen={setIsOpen} size='md'>
		<ModalHeader>
			<div className='flex items-center gap-3'>
				<div className='flex h-10 w-10 items-center justify-center rounded-full bg-red-100'>
					<Icon icon='HeroExclamationTriangle' className='h-6 w-6 text-red-600' />
				</div>
				<div>
					<h3 className='text-lg font-semibold text-gray-900'>
						Log de Errores Recientes
					</h3>
				</div>
			</div>
		</ModalHeader>
		<ModalBody>
			<div className='space-y-4'>
				<textarea
					value={log}
					readOnly
					rows={8}
					className='w-full bg-gray-50 font-mono text-sm dark:bg-gray-800'
				/>
			</div>
		</ModalBody>
		<ModalFooter>
			<ModalFooterChild>
				<Button variant='outline' onClick={() => setIsOpen(false)}>
					Cerrar
				</Button>
			</ModalFooterChild>
		</ModalFooter>
	</Modal>
);

export default WooCommerceLogModal;
