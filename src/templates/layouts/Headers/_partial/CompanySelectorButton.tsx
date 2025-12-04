import React, { useEffect } from 'react';
import { useAppSelector } from '@/store';
import useCompanyManager from '@/hooks/useCompanyManager';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '@/components/ui/Dropdown';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

const CompanySelectorButton: React.FC = () => {
	const user = useAppSelector((state) => state.auth.user);
	const { currentCompany, availableCompanies, isLoading, switchCompany, refreshCompanies } =
		useCompanyManager();

	// Cargar empresas al montar el componente
	useEffect(() => {
		refreshCompanies();
	}, [refreshCompanies]);

	// Solo mostrar si el usuario tiene múltiples empresas o es super-admin
	const shouldShowSelector =
		user?.authority?.includes('super-admin') || availableCompanies.length > 1;

	if (!shouldShowSelector) {
		return null;
	}

	const handleCompanyChange = async (companyId: number) => {
		if (companyId !== currentCompany?.id) {
			await switchCompany(companyId);
		}
	};

	return (
		<Dropdown>
			<DropdownToggle hasIcon={false}>
				<Button
					aria-label='Seleccionar Empresa'
					isLoading={isLoading}
					className='flex items-center gap-2'>
					<Icon icon='HeroBuildingOffice2' />
					<span className='text-sm'>
						Estás en: {currentCompany?.name || 'Sin seleccionar'}
					</span>
					<Icon icon='HeroChevronDown' size='text-xs' />
				</Button>
			</DropdownToggle>
			<DropdownMenu placement='bottom-end'>
				{availableCompanies.map((company) => (
					<DropdownItem
						isActive={currentCompany?.id === company.id}
						key={company.id}
						onClick={() => handleCompanyChange(company.id)}>
						<Icon
							icon='HeroBuildingOffice2'
							size='text-2xl'
							className='ltr:mr-2 rtl:ml-2'
						/>
						<div className='flex flex-col'>
							<span className='font-medium'>{company.name}</span>
							<span className='text-xs text-gray-500'>{company.role}</span>
						</div>
					</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
	);
};

export default CompanySelectorButton;
