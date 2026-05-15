import React from 'react';
import Modal, { ModalBody, ModalHeader } from '@/components/ui/Modal';
import Icon from '@/components/icon/Icon';
import QRScanner from '../../../recursosHumanos/relojControl/components/QRScanner';

interface IQRScannerModalProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onScan: (token: string) => Promise<boolean>;
}

const QRScannerModal: React.FC<IQRScannerModalProps> = ({ isOpen, setIsOpen, onScan }) => {
    return (
        <Modal isOpen={isOpen} setIsOpen={setIsOpen} size='md'>
            <ModalHeader>
                <div className='flex items-center gap-2'>
                    <Icon icon='HeroQrCode' className='h-5 w-5' />
                    Escanear Código QR del Casillero
                </div>
            </ModalHeader>
            <ModalBody>
                <QRScanner
                    isActive={isOpen}
                    onScan={async (code: string) => {
                        const success = await onScan(code);
                        if (success) setIsOpen(false);
                    }}
                    onCancel={() => setIsOpen(false)}
                />
            </ModalBody>
        </Modal>
    );
};

export default QRScannerModal;
