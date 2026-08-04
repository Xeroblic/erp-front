import React from 'react';
import Button from '@/components/ui/Button';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalFooterChild,
	ModalHeader,
} from '@/components/ui/Modal';

interface ConfirmDeferredPaymentActionModalProps {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	title: string;
	description: React.ReactNode;
	confirmLabel: string;
	busy: boolean;
	preventClose?: boolean;
	color?: 'red' | 'blue';
	onConfirm: () => void;
}
const ConfirmDeferredPaymentActionModal: React.FC<ConfirmDeferredPaymentActionModalProps> = ({
	isOpen,
	setIsOpen,
	title,
	description,
	confirmLabel,
	busy,
	preventClose = false,
	color = 'blue',
	onConfirm,
}) => {
	const guardClose: React.Dispatch<React.SetStateAction<boolean>> = (next) => {
		if (!busy && !preventClose) setIsOpen(next);
	};
	return (
		<Modal
			isOpen={isOpen}
			setIsOpen={guardClose}
			isCentered
			size='sm'
			isStaticBackdrop={busy || preventClose}>
			<ModalHeader>{title}</ModalHeader>
			<ModalBody>
				<div className='space-y-3 text-sm text-zinc-600 dark:text-zinc-300'>
					{description}
				</div>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button
						variant='outline'
						isDisable={busy || preventClose}
						onClick={() => guardClose(false)}>
						Cancelar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button
						variant='solid'
						color={color}
						isLoading={busy}
						isDisable={busy}
						onClick={onConfirm}>
						{confirmLabel}
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};
export default ConfirmDeferredPaymentActionModal;
