import React from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import Input from '@/components/form/Input';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';

interface ProductsHeaderProps {
	searchValue: string;
	onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
	onCreateClick: () => void;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({
	searchValue,
	onSearchChange,
	onCreateClick,
}) => {
	return (
		<Subheader>
			<SubheaderLeft>
				<div className='flex flex-col items-start gap-3 sm:flex-row sm:items-center'>
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
					<Input
						name='search'
						placeholder='Buscar por nombre, SKU o codigo'
						value={searchValue}
						onChange={onSearchChange}
						className='w-full sm:w-72'
					/>
					<Button
						color='blue'
						icon='HeroPlus'
						onClick={onCreateClick}
						className='w-full sm:w-auto'>
						Nuevo producto
					</Button>
				</div>
			</SubheaderRight>
		</Subheader>
	);
};

export default ProductsHeader;
