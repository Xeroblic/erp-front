import React, { useEffect, useState } from 'react';
import Modal, { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import type { IProduct } from '@/interface/product.interface';
import ApiService from '@/services/ApiService';
import toast from '@/utils/toast.utils';

interface StockSeriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: IProduct | null;
    subsidiaryId: number;
}

interface ISeriesItem {
    serial_number: string;
    grade?: string;
    current_status?: string;
    branch_name?: string;
}

const StockSeriesModal: React.FC<StockSeriesModalProps> = ({
    isOpen,
    onClose,
    product,
    subsidiaryId,
}) => {
    const [activeTab, setActiveTab] = useState<'return' | 'assign'>('return');
    const [series, setSeries] = useState<ISeriesItem[]>([]);
    const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen || !product) {
            setSeries([]);
            setSelectedSeries([]);
            return;
        }

        const fetchSeries = async () => {
            setIsLoading(true);
            try {
                // branch_id: subsidiaryId si es Devolver, '' (null) si es Asignar (Bodega Central)
                const branchParam = activeTab === 'return' ? subsidiaryId : 'null';

                const response = await ApiService.fetchData<any>({
                    url: `/subsidiaries/${subsidiaryId}/products/${product.id}/series`,
                    params: {
                        branch_id: branchParam,
                        status: 'available',
                        per_page: 1000,
                    }
                });
                
                // Paginador de laravel usualmente está en data.data o si no se paginate en data.
                const seriesData = response.data?.data || response.data || [];
                setSeries(Array.isArray(seriesData) ? seriesData : []);
                setSelectedSeries([]);
            } catch (error) {
                console.error('Error fetching series:', error);
                toast.error('Error al obtener las series para el producto.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchSeries();
    }, [isOpen, product, subsidiaryId, activeTab]);

    const handleToggleSelect = (serial: string) => {
        setSelectedSeries(prev => 
            prev.includes(serial) 
                ? prev.filter(s => s !== serial) 
                : [...prev, serial]
        );
    };

    const handleSelectAll = () => {
        if (selectedSeries.length === series.length) {
            setSelectedSeries([]);
        } else {
            setSelectedSeries(series.map(s => s.serial_number));
        }
    };

    const handleAssignStock = async () => {
        if (!product || selectedSeries.length === 0) return;
        setIsSubmitting(true);
        try {
            await ApiService.fetchData({
                method: 'POST',
                url: `/subsidiaries/${subsidiaryId}/products/${product.id}/assign-stock`,
                data: {
                    branch_id: subsidiaryId,
                    assignments: [
                        {
                            child_product_id: product.id,
                            assign_all: false,
                            serial_numbers: selectedSeries
                        }
                    ]
                }
            });
            toast.success('Stock asignado correctamente');
            onClose();
        } catch (error) {
            console.error('Error assigning stock:', error);
            toast.error('Ocurrió un error al asignar el stock.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturnStock = async () => {
        if (!product || selectedSeries.length === 0) return;
        setIsSubmitting(true);
        try {
            await ApiService.fetchData({
                method: 'POST',
                url: `/subsidiaries/${subsidiaryId}/products/${product.id}/unassign-stock`,
                data: {
                    branch_id: subsidiaryId,
                    confirm: true,
                    serial_numbers: selectedSeries,
                    notes: "Devolución de stock a la subsidiaria"
                }
            });
            toast.success('Stock devuelto correctamente');
            onClose();
        } catch (error) {
            console.error('Error returning stock:', error);
            toast.error('Ocurrió un error al devolver el stock.');
        } finally {
            setIsSubmitting(false);
        }
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
                    {/* Selector de Modo */}
                    <div className="flex rounded-md shadow-sm border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
                        <button
                            type="button"
                            onClick={() => setActiveTab('return')}
                            className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
                                activeTab === 'return' 
                                    ? 'bg-white shadow text-neutral-900 dark:bg-gray-700 dark:text-white' 
                                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                        >
                            Devolver Stock (Sucursal)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('assign')}
                            className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${
                                activeTab === 'assign' 
                                    ? 'bg-white shadow text-neutral-900 dark:bg-gray-700 dark:text-white' 
                                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                        >
                            Asignar Stock (Pool Subsidiaria)
                        </button>
                    </div>

                    {/* Tarjeta de Resumen del Producto */}
                    {product && (
                        <div className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50'>
                            <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                                {product.name}
                            </p>
                            <div className='mt-1 flex items-center justify-between'>
                                {product.sku && (
                                    <p className='text-sm text-gray-500'>SKU: {product.sku}</p>
                                )}
                                <div className="flex gap-2">
                                    {product.grade && (
                                       <Badge variant='outline' color='emerald' className='px-2 py-0.5 text-xs'>
                                           Grado: {product.grade}
                                       </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lista de Series */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
                                Séries disponibles ({series.length}):
                            </p>
                            {series.length > 0 && (
                                <button
                                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                                    onClick={handleSelectAll}
                                >
                                    {selectedSeries.length === series.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                                </button>
                            )}
                        </div>
                        <div className='min-h-[100px] max-h-[40vh] overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'>
                            {isLoading ? (
                                <div className='flex h-full min-h-[100px] items-center justify-center'>
                                    <Icon icon='HeroArrowPath' className='h-6 w-6 animate-spin text-blue-500' />
                                </div>
                            ) : series.length > 0 ? (
                                <ul className='space-y-1.5'>
                                    {series.map((item) => (
                                        <li 
                                            key={item.serial_number} 
                                            onClick={() => handleToggleSelect(item.serial_number)}
                                            className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm shadow-sm transition hover:border-blue-300 border ${
                                                selectedSeries.includes(item.serial_number)
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSeries.includes(item.serial_number)}
                                                    readOnly
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className='font-mono font-medium text-neutral-700 dark:text-neutral-200'>
                                                    {item.serial_number}
                                                </span>
                                            </div>
                                            {item.grade && (
                                                <Badge variant="outline" color="stone" className="text-xs">
                                                    {item.grade}
                                                </Badge>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className='flex h-full min-h-[100px] flex-col items-center justify-center space-y-2 text-gray-400'>
                                    <Icon icon='HeroArchiveBoxXMark' className='h-8 w-8' />
                                    <p className='text-sm'>No hay series disponibles para esta acción.</p>
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
                        {activeTab === 'return' ? (
                            <Button
                                variant='outline'
                                color='red'
                                onClick={handleReturnStock}
                                isLoading={isSubmitting}
                                isDisable={isLoading || isSubmitting || selectedSeries.length === 0}
                                icon='HeroArrowUturnLeft'
                            >
                                Devolver Seleccionadas ({selectedSeries.length})
                            </Button>
                        ) : (
                            <Button
                                variant='solid'
                                color='blue'
                                onClick={handleAssignStock}
                                isLoading={isSubmitting}
                                isDisable={isLoading || isSubmitting || selectedSeries.length === 0}
                                icon='HeroArrowRightOnRectangle'
                            >
                                Asignar Seleccionadas ({selectedSeries.length})
                            </Button>
                        )}
                    </div>
                </div>
            </ModalFooter>
        </Modal>
    );
};

export default StockSeriesModal;