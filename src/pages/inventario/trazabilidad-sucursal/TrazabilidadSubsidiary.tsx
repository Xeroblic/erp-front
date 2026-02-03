import Icon from '@/components/icon/Icon';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Card, { CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import PagConstruccion from '@/components/ui/enConstruccion/PagConstruccion';

const TrazabilidadSubsidiary = () => {
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
								<PagConstruccion />
							</CardBody>
						</Card>
					</>
				</Container>
			</PageWrapper>
		</>
	);
};

export default TrazabilidadSubsidiary;
