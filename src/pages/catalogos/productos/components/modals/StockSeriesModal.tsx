import React, { useEffect, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import type { IProduct } from '@/interface/product.interface';

interface StockSeriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: IProduct | null;
    subsidiaryId: number;
}

const StockSeriesModal: React.FC<StockSeriesModalProps> = ({
    isOpen,
    onClose,
    product,
    subsidiaryId,
}) => {
    const [series, setSeries] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Efecto para cargar las series cuando se abre el modal
    useEffect(() => {
        if (!isOpen || !product) {
            setSeries([]);
            return;
        }

        const fetchSeries = async () => {
            setIsLoading(true);
            try {
                // TODO: Reemplazar con tu cliente HTTP real
                // const response = await api.get(`/subsidiaries/${subsidiaryId}/products/${product.id}/series?per_page=1000`);
                // setSeries(response.data.data.map(item => item.serial_number)); // Ajustar según la respuesta real
                
                // MOCK DE PRUEBA:
                setTimeout(() => {
                    setSeries(['M2B0WLRZ', 'M2B0WLPK', 'SN987654321', 'SN123456789']);
                    setIsLoading(false);
                }, 800);
            } catch (error) {
                console.error('Error fetching series:', error);
                setIsLoading(false);
            }
        };

        fetchSeries();
    }, [isOpen, product, subsidiaryId]);

    const handleAssignStock = async () => {
        setIsSubmitting(true);
        // TODO: Lógica para Asignar Stock (Caso 9)
        console.log('Asignar stock para producto:', product?.id);
        setTimeout(() => setIsSubmitting(false), 1000);
    };

    const handleReturnStock = async () => {
        setIsSubmitting(true);
        // TODO: Lógica para Devolver Stock (Caso 9)
        console.log('Devolver stock para producto:', product?.id);
        setTimeout(() => setIsSubmitting(false), 1000);
    };

    return (
        <Modal isOpen={isOpen} setIsOpen={onClose}>
            <ModalHeader>
                <div className='flex items-center gap-3'>
                    <span className='flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600'>
                        <Icon icon='HeroQrCode' className='h-5 w-5' />
                    </span>
                    <div>
                        <p className='text-lg font-semibold'>Gestión de Series</p>
                        <p className='text-sm text-neutral-500'>Administra el inventario serializado</p>
                    </div>
                </div>
            </ModalHeader>
            <ModalBody>
                <div className='space-y-4 py-4'>
                    {/* Tarjeta de Resumen del Producto */}
                    {product && (
                        <div className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800'>
                            <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                {product.name}
                            </p>
                            <div className='mt-1 flex items-center justify-between'>
                                {product.sku && (
                                    <p className='text-sm text-gray-500'>SKU: {product.sku}</p>
                                )}
                                <Badge variant='outline' color='blue' className='px-2 py-0.5 text-xs'>
                                    Stock total: {product.stock}
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* Lista de Series */}
                    <div>
                        <p className='mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300'>
                            Números de serie en sucursal:
                        </p>
                        <div className='min-h-[100px] max-h-[40vh] overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700'>
                            {isLoading ? (
                                <div className='flex h-full min-h-[100px] items-center justify-center'>
                                    <Icon icon='HeroArrowPath' className='h-6 w-6 animate-spin text-blue-500' />
                                </div>
                            ) : series.length > 0 ? (
                                <ul className='space-y-1.5'>
                                    {series.map((serial) => (
                                        <li 
                                            key={serial} 
                                            className='flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm shadow-sm border border-gray-100 dark:border-gray-700 dark:bg-gray-800'
                                        >
                                            <span className='font-mono font-medium text-neutral-600 dark:text-neutral-300'>
                                                {serial}
                                            </span>
                                            {/* Aquí se puede agregar un checkbox si la devolución de stock es selectiva */}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className='flex h-full min-h-[100px] flex-col items-center justify-center space-y-2 text-gray-400'>
                                    <Icon icon='HeroArchiveBoxXMark' className='h-8 w-8' />
                                    <p className='text-sm'>No hay series registradas.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                <div className='flex w-full items-center justify-between'>
                    <Button 
                        variant='outline' 
                        onClick={onClose} 
                        isDisable={isLoading || isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <div className='flex gap-2'>
                        <Button
                            variant='outline'
                            color='red'
                            onClick={handleReturnStock}
                            isLoading={isSubmitting}
                            isDisable={isLoading || isSubmitting || series.length === 0}
                            icon='HeroArrowUturnLeft'
                        >
                            Devolver Stock
                        </Button>
                        <Button
                            variant='solid'
                            color='blue'
                            onClick={handleAssignStock}
                            isLoading={isSubmitting}
                            isDisable={isLoading || isSubmitting}
                            icon='HeroArrowRightOnRectangle'
                        >
                            Asignar Stock
                        </Button>
                    </div>
                </div>
            </ModalFooter>
        </Modal>
    );
};

export default StockSeriesModal;