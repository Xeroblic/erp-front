import React from 'react';
// eslint-disable-next-line import/extensions
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
// eslint-disable-next-line import/extensions
import ProtectedButton from '@/components/ui/ProtectedButton';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';

interface DeferredPaymentsExportDropdownProps {
	branchId: number | null;
	subsidiaryId: number | null;
	disabled: boolean;
	isExporting: boolean;
	onExportPage: () => void;
	onExportAll: () => void;
}

const DeferredPaymentsExportDropdown: React.FC<DeferredPaymentsExportDropdownProps> = ({
	branchId,
	subsidiaryId,
	disabled,
	isExporting,
	onExportPage,
	onExportAll,
}) => {
	const isDisabled = disabled || isExporting;
	return (
		<Dropdown>
			<DropdownToggle>
				<ProtectedButton
					permission={ERP_PERMISSIONS.DEFERRED_PAYMENTS.VIEW}
					branchId={branchId}
					subsidiaryId={subsidiaryId}
					scope='access'
					variant='outline'
					size='sm'
					icon='HeroArrowDownTray'
					isLoading={isExporting}
					isDisable={isDisabled}>
					Exportar
				</ProtectedButton>
			</DropdownToggle>
			<DropdownMenu placement='bottom-end'>
				<DropdownItem icon='HeroDocumentArrowDown'>
					<button
						type='button'
						disabled={isDisabled}
						onClick={onExportPage}
						className='w-full text-left disabled:cursor-not-allowed'>
						Página actual
					</button>
				</DropdownItem>
				<DropdownItem icon='HeroTableCells'>
					<button
						type='button'
						disabled={isDisabled}
						onClick={onExportAll}
						className='w-full text-left disabled:cursor-not-allowed'>
						Todo lo filtrado
					</button>
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default DeferredPaymentsExportDropdown;
