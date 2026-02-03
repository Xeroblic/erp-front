import Icon from '@/components/icon/Icon';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import PagConstruccion from '@/components/ui/enConstruccion/PagConstruccion';
import { TrazabilidadList } from './components/tables/TrazabilidadList';
import { useAppDispatch, useAppSelector } from '@/store';
import { useEffect } from 'react';
import { fetchListaMovimientoSucursalThunk } from '@/store/slices/inventory/inventorySlice';

const TrazabilidadSubsidiary = () => {
    const dispatch = useAppDispatch();
    const { listaMovimientoSucursal, loading } = useAppSelector((state) => state.inventario);

    useEffect(() => {
            dispatch(fetchListaMovimientoSucursalThunk({branch_id: 1}));
    }, []);

	return (
		<>
			<PageWrapper
				isProtectedRoute={true}
				name='trazabilidad-sucursal'
				title='Trazabilidad de Sucursal'>
				<Subheader>
					<SubheaderLeft>
						<div className='flex flex-row px-2'>
							<div className='-ml-3 flex items-center p-1'>
								<Icon icon='DuoClip' className='h-8 w-8' />
							</div>
							<div className='ml-2 flex flex-col items-start justify-start'>
								<Badge className='text-xl font-bold'>
									Trazabilidad de Sucursal
								</Badge>
								<p className='text-sm text-gray-500 dark:text-gray-400'>
									Consulta la trazabilidad de los productos en la sucursal
									seleccionada
								</p>
							</div>
						</div>
					</SubheaderLeft>
					<SubheaderRight>
						agregar btnes de busqueda junto con nuevas funcionalidaddes
					</SubheaderRight>
				</Subheader>
				<Container>
					<>
						<Card>
							<CardHeader>
								<CardTitle>
									<Badge>Lista de los ultimos movimientos en la Sucursal</Badge>
								</CardTitle>
							</CardHeader>
							<CardBody>
								{/* <PagConstruccion /> */}
                                {loading ? (
                                    <TrazabilidadList data={listaMovimientoSucursal} />
                                ) : (
                                    <div className='flex flex-col items-center justify-center py-20 text-center bg-zinc-950/20 border border-dashed border-zinc-950/20 rounded-lg min-h-[35vh]'>
										<Icon
											icon='DuoBinocular'
											className='mb-4 h-16 w-16'
										/>
										<Badge typewriter className='text-xl font-bold text-gray-600 dark:text-gray-300'>
											Cargando movimientos...
										</Badge>
										<p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
											Parece que aún no hay actividad registrada para esta
											sucursal.
										</p>
									</div>
                                )}
							</CardBody>
						</Card>
					</>
				</Container>
			</PageWrapper>
		</>
	);
};

export default TrazabilidadSubsidiary;
