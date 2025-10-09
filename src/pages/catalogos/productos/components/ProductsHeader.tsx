import React from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Select from '@/components/form/Select';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';

interface Branch {
	id: number;
	name?: string;
}

interface ProductsHeaderProps {
	searchValue: string;
	onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	branchId: number | null;
	onBranchChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	branches: Branch[];
	onCreateClick: () => void;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({
	searchValue,
	onSearchChange,
	branchId,
	onBranchChange,
	branches,
	onCreateClick,
}) => {
	const branchOptions = branches.map((branch) => ({
		value: String(branch.id),
		label: branch.name ?? `Sucursal ${branch.id}`,
	}));

	return (
		<Subheader>
			<SubheaderLeft>
				<div className='flex items-center gap-3'>
					<div className='flex h-11 w-11 items-center justify-center rounded-xl border'>
						<Icon icon='HeroCubeTransparent' className='h-5 w-5' />
					</div>
					<div>
						<h1 className='text-2xl font-semibold'>Producto General</h1>
						<p className='text-sm'>
							Administra tu catalogo y sincroniza con la base de datos central.
						</p>
					</div>
				</div>
			</SubheaderLeft>
			<SubheaderRight>
				<div className='flex flex-col items-stretch gap-2 sm:flex-row sm:items-center'>
					<Input
						name='search'
						placeholder='Buscar por nombre, SKU o codigo'
						value={searchValue}
						onChange={onSearchChange}
						className='w-full sm:w-72'
					/>
					<Select
						name='branch'
						value={branchId ? String(branchId) : ''}
						onChange={onBranchChange}
						className='w-full sm:w-60'>
						<option value=''>Todas las sucursales</option>
						{branchOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
					<Button color='blue' icon='HeroPlus' onClick={onCreateClick}>
						Nuevo producto
					</Button>
				</div>
			</SubheaderRight>
		</Subheader>
	);
};

export default ProductsHeader;
