import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';
import { ISubempresa } from '@/interface/empresas.interface';

const columnHelper = createColumnHelper<ISubempresa>();

export const useSubsidiaryColumns = (
	handleEdit: (subsidiary: ISubempresa) => void,
	navigate: (path: string) => void,
) => {
	return React.useMemo(
		() => [
			columnHelper.display({
				id: 'nombre',
				header: 'Nombre',
				cell: (info) => {
					const subsidiary = info.row.original;
					const name = subsidiary.subsidiary_name || 'Sin nombre';

					return (
						<div className='flex min-w-[200px] items-center gap-2'>
							<div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100'>
								<Icon
									icon='HeroBuildingStorefront'
									className='text-sm text-primary-600'
								/>
							</div>
							<div className='min-w-0'>
								<div className='truncate font-medium'>{name}</div>
								<div className='text-xs text-zinc-500'>ID: {subsidiary.id}</div>
							</div>
						</div>
					);
				},
			}),
			columnHelper.display({
				id: 'rut',
				header: 'RUT',
				cell: (info) => {
					const subsidiary = info.row.original;
					const rut = subsidiary.subsidiary_rut;

					return rut ? (
						<span className='font-mono text-sm'>{rut}</span>
					) : (
						<Badge variant='outline' className='text-zinc-400'>
							Sin RUT
						</Badge>
					);
				},
			}),
			columnHelper.display({
				id: 'direccion',
				header: 'Dirección',
				cell: (info) => {
					const subsidiary = info.row.original;
					const address = subsidiary.subsidiary_address;

					return (
						<div className='max-w-xs'>
							{address ? (
								<span className='text-sm'>{address}</span>
							) : (
								<Badge variant='outline' className='text-zinc-400'>
									Sin dirección
								</Badge>
							)}
						</div>
					);
				},
			}),
			columnHelper.display({
				id: 'telefono',
				header: 'Teléfono',
				cell: (info) => {
					const subsidiary = info.row.original;
					const phone = subsidiary.subsidiary_phone;

					return phone ? (
						<div className='flex items-center gap-1'>
							<Icon icon='HeroPhone' className='text-xs text-zinc-400' />
							<span className='text-sm'>{phone}</span>
						</div>
					) : (
						<Badge variant='outline' className='text-zinc-400'>
							Sin teléfono
						</Badge>
					);
				},
			}),
			columnHelper.display({
				id: 'email',
				header: 'Email',
				cell: (info) => {
					const subsidiary = info.row.original;
					const email = subsidiary.subsidiary_email;

					return email ? (
						<div className='flex items-center gap-1'>
							<Icon icon='HeroEnvelope' className='text-xs text-zinc-400' />
							<span className='max-w-[200px] truncate text-sm'>{email}</span>
						</div>
					) : (
						<Badge variant='outline' className='text-zinc-400'>
							Sin email
						</Badge>
					);
				},
			}),
			columnHelper.display({
				id: 'sucursales',
				header: 'Sucursales',
				cell: (info) => {
					const subsidiary = info.row.original;
					const count =
						subsidiary.branches_count ||
						subsidiary.sucursales?.length ||
						subsidiary.branches?.length ||
						0;

					return (
						<div className='flex items-center gap-1'>
							<Icon icon='HeroBuildingOffice' className='text-xs text-zinc-400' />
							<span className='text-sm'>{count}</span>
						</div>
					);
				},
			}),
			columnHelper.display({
				id: 'comuna',
				header: 'Comuna',
				cell: (info) => {
					const subsidiary = info.row.original;
					const communeName = (subsidiary as any)?.commune?.name;

					return communeName ? (
						<div className='flex items-center gap-1'>
							<Icon icon='HeroMap' className='text-xs text-zinc-400' />
							<span className='text-sm'>{communeName}</span>
						</div>
					) : (
						<Badge variant='outline' className='text-zinc-400'>
							Sin comuna
						</Badge>
					);
				},
			}),
			columnHelper.display({
				id: 'acciones',
				header: 'Acciones',
				cell: (info) => {
					const subsidiary = info.row.original;

					return (
						<div className='flex gap-1'>
							<Button
								variant='outline'
								size='sm'
								icon='HeroPencil'
								onClick={() => handleEdit(subsidiary)}
								className='p-1'
								title='Editar subempresa'
							/>
							<Button
								variant='outline'
								size='sm'
								icon='HeroEye'
								className='p-1'
								onClick={() => navigate(`/gestion/subempresa/${subsidiary.id}`)}
								title='Ver detalles'
							/>
						</div>
					);
				},
			}),
		],
		[handleEdit, navigate],
	);
};
