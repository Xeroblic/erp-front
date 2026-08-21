import React from 'react';
import ProtectedButton from '@/components/ui/ProtectedButton';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import { ERP_PERMISSIONS } from '@/constants/temp-permissions.constant';
import { white } from 'tailwindcss/colors';

interface ProductsHeaderProps {
	searchValue: string;
	onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onCreateClick: () => void;
	/** ID de la sucursal actual para validar permiso contextual */
	branchId?: number | null;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({
	searchValue,
	onSearchChange,
	onCreateClick,
	branchId,
}) => {
	return (
		<Subheader>
			<SubheaderLeft>
				<div className='flex items-center gap-3'>
					<div className='flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800'>
						<Icon icon='HeroCubeTransparent' className='h-5 w-5' />
					</div>
					<div>
						<h1 className='text-2xl font-semibold'>Producto General</h1>
						<p className='text-sm text-neutral-500 dark:text-neutral-400'>
							Administra tu catalogo y sincroniza con la base de datos central.
						</p>
					</div>
				</div>
			</SubheaderLeft>
			<SubheaderRight>
				<div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3'>
					<ProtectedButton
						permission={ERP_PERMISSIONS.CATALOGS.PRODUCTS.CREATE}
						branchId={branchId}
						scope='access'
						fallbackMode='hidden'
						color='emerald'
						colorIntensity='500'
						variant='solid'
						onClick={onCreateClick}
						className='btn-product w-full font-bold sm:w-auto'>
						<Icon
							icon='HeroPlus'
							size='text-2xl'
							color='white'
							aria-label='Nuevo producto'
						/>
						Crear Producto
					</ProtectedButton>
					<Input
						name='search'
						placeholder='Buscar por nombre, SKU o codigo'
						value={searchValue}
						onChange={onSearchChange}
						className='w-full sm:w-72'
					/>
				</div>
			</SubheaderRight>
		</Subheader>
	);
};

export default ProductsHeader;
