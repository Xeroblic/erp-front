import React from 'react';
import Modal, {
	ModalBody,
	ModalFooter,
	ModalHeader,
	ModalFooterChild,
} from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { UserNotificationDTO } from '@/interface/notifications.interface';
import { useAppDispatch } from '@/store';
import { ackNotification, markRead } from '@/store/slices/notifications/notificationsSlice';

interface NotificationPopupProps {
	isOpen: boolean;
	notification: UserNotificationDTO | null;
	onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ isOpen, notification, onClose }) => {
	const dispatch = useAppDispatch();
	const handleSetOpen: React.Dispatch<React.SetStateAction<boolean>> = (v) => {
		if (typeof v === 'boolean') {
			if (!v) onClose();
		} else if (typeof v === 'function') {
			// Ejecutar la función con el estado actual (isOpen)
			const result = v(isOpen);
			if (!result) onClose();
		}
	};

	if (!notification) return null;

	const title = notification.event?.type_label || notification.event?.type_key || 'Notificación';
	const message = notification.message || title;
	const module = notification.event?.module_label || notification.event?.module || undefined;

	const handleMarkRead = async () => {
		try {
			await dispatch(markRead({ id: notification.id })).unwrap();
		} catch (_) {
			// noop visual; el slice maneja errores
		}
		onClose();
	};

	const handleAck = async () => {
		try {
			await dispatch(ackNotification({ id: notification.id })).unwrap();
		} catch (_) {
			// noop visual
		}
		onClose();
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={handleSetOpen} size='sm' isCentered>
			<ModalHeader>
				<div className='flex flex-col'>
					<span>{title}</span>
					{module && (
						<span className='text-sm font-normal text-zinc-500 dark:text-zinc-400'>
							{module}
						</span>
					)}
				</div>
			</ModalHeader>
			<ModalBody>
				<div className='whitespace-pre-line text-zinc-800 dark:text-zinc-200'>
					{message}
				</div>
			</ModalBody>
			<ModalFooter>
				<ModalFooterChild>
					<Button variant='default' onClick={handleMarkRead} icon='HeroEnvelopeOpen'>
						Marcar leída
					</Button>
					<Button variant='outline' onClick={handleAck} icon='HeroArchiveBox'>
						Archivar
					</Button>
				</ModalFooterChild>
				<ModalFooterChild>
					<Button variant='solid' onClick={onClose} icon='HeroCheckCircle'>
						Entendido
					</Button>
				</ModalFooterChild>
			</ModalFooter>
		</Modal>
	);
};

export default NotificationPopup;
