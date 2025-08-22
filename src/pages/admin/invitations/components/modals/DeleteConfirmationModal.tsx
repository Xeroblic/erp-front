import React from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter, ModalFooterChild } from '../../../../../components/ui/Modal';
import Button from '../../../../../components/ui/Button';
import Icon from '../../../../../components/icon/Icon';
import { Invitation } from '../../../../../interface/invitacion.interface';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    invitation: Invitation | null;
    isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    invitation,
    isDeleting = false,
}) => {
    if (!invitation) return null;

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={onClose} size="md">
            <ModalHeader>
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <Icon icon="HeroExclamationTriangle" className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-red-900 dark:text-red-100">Confirmar Eliminación</span>
                </div>
            </ModalHeader>

            <ModalBody className="space-y-4">
                <div className="text-center">
                    <p className="text-zinc-900 dark:text-zinc-100 mb-2">
                        ¿Estás seguro que deseas eliminar esta invitación?
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Esta acción no se puede deshacer.
                    </p>
                </div>

                {/* Información de la invitación a eliminar */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon icon="HeroEnvelope" className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-red-900 dark:text-red-100">
                                {invitation.email}
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300">
                                {`${invitation.first_name} ${invitation.last_name}`.trim() || 'Sin nombre'}
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Invitado el {new Date(invitation.created_at).toLocaleDateString('es-ES')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <Icon icon="HeroInformationCircle" className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Nota:</strong> Si esta invitación ya fue aceptada, el usuario mantendrá su acceso al sistema.
                        </p>
                    </div>
                </div>
            </ModalBody>

            <ModalFooter>
                <ModalFooterChild>
                    <Button
                        variant="outline"
                        color="zinc"
                        onClick={onClose}
                        isDisable={isDeleting}
                    >
                        <Icon icon="HeroXMark" className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>
                </ModalFooterChild>
                <ModalFooterChild>
                    <Button
                        variant="solid"
                        color="red"
                        onClick={handleConfirm}
                        isDisable={isDeleting}
                        className="min-w-[120px]"
                    >
                        {isDeleting ? (
                            <>
                                <Icon icon="HeroArrowPath" className="h-4 w-4 mr-2 animate-spin" />
                                Eliminando...
                            </>
                        ) : (
                            <>
                                <Icon icon="HeroTrash" className="h-4 w-4 mr-2" />
                                Eliminar
                            </>
                        )}
                    </Button>
                </ModalFooterChild>
            </ModalFooter>
        </Modal>
    );
};

export default DeleteConfirmationModal;
