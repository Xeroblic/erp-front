import React, { useState } from 'react';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { IItem } from '@/interface/technicalReviews.interface';
import { exportItemsToExcel } from './exportExcel';

type ExportMode = 'serials' | 'details';
type ExportFetcher = (includeDetails?: boolean) => Promise<IItem[]>;

export interface ExportExcelModalProps {
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	items: IItem[];
	exportFileName?: string;
	onExportFetchAll?: ExportFetcher;
	batchDate?: string;
	customerName?: string;
}

const ExportExcelModal: React.FC<ExportExcelModalProps> = ({
	isOpen,
	setIsOpen,
	items,
	exportFileName = 'items-export',
	onExportFetchAll,
	batchDate,
	customerName,
}) => {
	const [exportMode, setExportMode] = useState<ExportMode>('serials');
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async () => {
		setIsExporting(true);
		try {
			await exportItemsToExcel(
				items,
				exportMode,
				exportFileName,
				onExportFetchAll,
				batchDate,
				customerName,
			);
		} finally {
			setIsExporting(false);
			setIsOpen(false);
		}
	};

	return (
		<Modal isOpen={isOpen} setIsOpen={setIsOpen}>
			<ModalHeader>Exportar Datos a Excel</ModalHeader>
			<ModalBody>
				<div className='grid gap-4'>
					{/* Option: Serials */}
					<div
						className={`cursor-pointer rounded-lg border p-4 transition-all hover:bg-gray-50 dark:hover:bg-zinc-800 ${
							exportMode === 'serials'
								? 'border-blue-500 ring-1 ring-blue-500'
								: 'border-gray-200 dark:border-gray-700'
						}`}
						onClick={() => setExportMode('serials')}>
						<div className='flex items-center gap-3'>
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full ${
									exportMode === 'serials'
										? 'bg-blue-100 text-blue-600'
										: 'bg-gray-100 text-gray-500'
								}`}>
								<Icon icon='HeroListBullet' className='h-6 w-6' />
							</div>
							<div>
								<h4 className='font-medium text-gray-900 dark:text-gray-100'>
									Listado de Series
								</h4>
								<p className='text-sm text-gray-500'>
									Exporta solo el listado de números de serie
								</p>
							</div>
						</div>
					</div>

					{/* Option: Details */}
					<div
						className={`cursor-pointer rounded-lg border p-4 transition-all hover:bg-gray-50 dark:hover:bg-zinc-800 ${
							exportMode === 'details'
								? 'border-blue-500 ring-1 ring-blue-500'
								: 'border-gray-200 dark:border-gray-700'
						}`}
						onClick={() => setExportMode('details')}>
						<div className='flex items-center gap-3'>
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full ${
									exportMode === 'details'
										? 'bg-blue-100 text-blue-600'
										: 'bg-gray-100 text-gray-500'
								}`}>
								<Icon icon='HeroDocumentText' className='h-6 w-6' />
							</div>
							<div>
								<h4 className='font-medium text-gray-900 dark:text-gray-100'>
									Listado Detallado
								</h4>
								<p className='text-sm text-gray-500'>
									Exporta toda la información técnica y especificaciones de las
									rúbricas
								</p>
							</div>
						</div>
					</div>
				</div>
			</ModalBody>
			<ModalFooter>
				<Button variant='outline' onClick={() => setIsOpen(false)} isDisable={isExporting}>
					Cancelar
				</Button>
				<Button variant='solid' color='blue' onClick={handleExport} isLoading={isExporting}>
					Exportar
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default ExportExcelModal;
