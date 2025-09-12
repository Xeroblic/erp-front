// Tabla de integraciones WooCommerce con acciones CRUD y permisos
import React, { useMemo, useState } from 'react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/icon/Icon';
import TableCardFooterTemplateV2 from '@/templates/Table/TableFooterTemplateV2';
import { useAppSelector } from '@/store';
import WooCommerceDeleteModal from '../modals/WooCommerceDeleteModal';
import { WooCommerceConfig } from '../types/woocommerce.types';

// Mock temporal para la tabla
const mockIntegraciones: WooCommerceConfig[] = [
	{
		estado: true,
		url: 'https://tienda-demo.woocommerce.com',
		consumerKey: 'ck_12345abcdef67890',
		consumerSecret: 'cs_67890fedcba54321',
		modo: 'lectura-escritura',
		ultimaSincronizacion: '2025-09-11T10:30:00Z',
	},
	{
		estado: false,
		url: 'https://sandbox-store.example.com',
		consumerKey: 'ck_sandbox123456',
		consumerSecret: 'cs_sandbox654321',
		modo: 'lectura',
		ultimaSincronizacion: '2025-09-10T14:20:00Z',
	},
];

const WooCommerceIntegrationsTable: React.FC = () => {
	const user = useAppSelector((s) => s.auth.user);
	// Permiso: ver-integraciones y manage-integraciones
	// Ajustar según la propiedad real de permisos del usuario
	const permisos = user?.permisos || [];
	const canManage = permisos.includes('manage-integraciones');
	const canView = permisos.includes('view-integraciones');

	const [integraciones, setIntegraciones] = useState<WooCommerceConfig[]>(mockIntegraciones);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
	const [loadingDelete, setLoadingDelete] = useState(false);

	// Acciones CRUD (solo mock)
	const handleDelete = async () => {
		if (!selectedUrl) return;
		setLoadingDelete(true);
		await new Promise((r) => setTimeout(r, 800));
		setIntegraciones(integraciones.filter((i) => i.url !== selectedUrl));
		setLoadingDelete(false);
		setDeleteModalOpen(false);
		setSelectedUrl(null);
	};

	return (
		<>
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
							Integraciones WooCommerce
						</h3>
						{canManage && (
							<Button color='blue' icon='HeroPlus'>
								Nueva Integración
							</Button>
						)}
					</div>
				</CardHeader>
				<CardBody>
					<div className='overflow-x-auto'>
						<table className='w-full'>
							<thead>
								<tr>
									<th className='px-4 py-2'>URL</th>
									<th className='px-4 py-2'>Estado</th>
									<th className='px-4 py-2'>Modo</th>
									<th className='px-4 py-2'>Última sincronización</th>
									<th className='px-4 py-2'>Acciones</th>
								</tr>
							</thead>
							<tbody>
								{integraciones.map((i) => (
									<tr key={i.url}>
										<td className='px-4 py-2 font-mono'>{i.url}</td>
										<td className='px-4 py-2'>
											{i.estado ? (
												<Badge color='emerald'>ON</Badge>
											) : (
												<Badge color='red'>OFF</Badge>
											)}
										</td>
										<td className='px-4 py-2'>
											{i.modo === 'lectura-escritura'
												? 'Lectura/Escritura'
												: 'Lectura'}
										</td>
										<td className='px-4 py-2 text-xs'>
											{i.ultimaSincronizacion
												? new Date(i.ultimaSincronizacion).toLocaleString()
												: '-'}
										</td>
										<td className='px-4 py-2'>
											{canManage && (
												<div className='flex gap-2'>
													<Button
														size='sm'
														variant='outline'
														color='blue'
														icon='HeroPencil'>
														Editar
													</Button>
													<Button
														size='sm'
														variant='outline'
														color='red'
														icon='HeroTrash'
														onClick={() => {
															setSelectedUrl(i.url);
															setDeleteModalOpen(true);
														}}>
														Eliminar
													</Button>
												</div>
											)}
											{canView && !canManage && (
												<Button
													size='sm'
													variant='outline'
													color='blue'
													icon='HeroEye'>
													Ver
												</Button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{/* Footer mock, solo muestra cantidad */}
					<div className='mt-4 text-right text-xs text-gray-500'>
						{integraciones.length} integraciones
					</div>
				</CardBody>
			</Card>
			<WooCommerceDeleteModal
				isOpen={deleteModalOpen}
				setIsOpen={setDeleteModalOpen}
				url={selectedUrl || ''}
				onDelete={handleDelete}
				loading={loadingDelete}
			/>
		</>
	);
};

export default WooCommerceIntegrationsTable;
