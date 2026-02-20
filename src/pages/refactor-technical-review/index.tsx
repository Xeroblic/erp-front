import Icon from '@/components/icon/Icon';
import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import { useNavigate } from 'react-router-dom';

const TechnicalReview = () => {
	const navigate = useNavigate();
	return (
		<PageWrapper name='Home Revisiones Técnicas' title='Home Revisiones Técnicas'>
			<Subheader>
				<SubheaderLeft>
					<div className='flex flex-col items-center justify-center'>
						<div className='flex flex-row gap-3'>
							<Icon icon='DuoArticle' className='text-4xl' />
							<Badge className='text-2xl font-bold'>Home revisiones técnicas</Badge>
						</div>
						<div className='mt-2'>
							<p className='text-lg text-gray-500'>
								Bienvenido a la página de revisiones técnicas
							</p>
						</div>
					</div>
				</SubheaderLeft>
			</Subheader>
			<Container className='w-screen'>
				<div className='flex flex-col gap-3 space-y-6'>
					<Card >
						<CardHeader>
							<div className='flex flex-row gap-2'>
								<Icon icon='DuoSun' className='text-4xl' />
								<Badge className='text-2xl font-bold'>
									Elige el modo de trabajo.
								</Badge>
							</div>
						</CardHeader>
					</Card>

					<div className='grid grid-cols-2 gap-4'>
						<Card onClick={() => navigate('/technical-reviews/lotes')} className='hover:scale-100 hover:translate-y-1 transition-all duration-300 hover:shadow-lg cursor-pointer'>
							<CardHeader>
								<Badge className='text-2xl font-bold'>
									Realizar revisiones técnicas
								</Badge>
							</CardHeader>
							<CardBody>
								<div className='flex flex-col gap-4'>
									<div className='flex flex-row gap-4'>
										<p className='text-lg font-semibold text-gray-500'>
											Accede directamente a cualquier serie por número. Ideal
											para búsquedas rápidas y revisiones individuales.
										</p>
									</div>
									<ul className='text-md flex flex-col gap-2 text-gray-500'>
										<li className='flex items-center gap-2'>
											<Icon icon='DuoCheck' /> Busqueda directa por numero de
											serie
										</li>
										<li className='flex items-center gap-2'>
											<Icon icon='DuoCheck' /> Vista consolidada de todas las
											series
										</li>
										<li className='flex items-center gap-2'>
											<Icon icon='DuoCheck' /> Filtro avanzado por estado,
											grado y más
										</li>
									</ul>
								</div>
							</CardBody>
						</Card>

						<Card className='hover:scale-100 hover:translate-y-1 transition-all duration-300 hover:shadow-lg cursor-pointer'>
							<CardHeader>
								<div className='flex flex-row items-center gap-2'>
									<Icon icon='DuoArticle' className='text-4xl' />
									<Badge className='text-2xl font-bold'>
										Vista global por series
									</Badge>
								</div>
							</CardHeader>
							<CardBody>
								<div className='flex flex-col gap-4'>
									<div className='flex flex-row gap-4'>
										<p className='text-lg font-semibold text-gray-500'>
											Accede directamente a cualquier serie por número. Ideal
											para búsquedas rápidas y revisiones individuales.
										</p>
									</div>
									<ul className='text-md flex flex-col gap-2 text-gray-500'>
										<li className='flex items-center gap-2'>
											<Icon icon='DuoCheck' /> Búsqueda directa por número de
											serie
										</li>
										<li className='flex items-center gap-2'>
											<Icon icon='DuoCheck' /> Vista consolidada de todas las
											series
										</li>
										<li className='flex items-center gap-2'>
											<Icon icon='DuoCheck' /> Filtro avanzado por estado,
											grado y más
										</li>
									</ul>
								</div>
							</CardBody>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<div className='flex flex-row items-center gap-2'>
								<Icon icon='DuoInfoCircle' className='text-4xl' />
								<Badge className='text-2xl font-bold'>
									Sobre las Revisiones Técnicas
								</Badge>
							</div>
						</CardHeader>
						<CardBody>
							<div className='flex flex-col gap-4'>
								<div className='flex flex-row gap-4'>
									<p className='text-lg font-semibold text-gray-500'>
										Las revisiones técnicas permiten evaluar y graduar equipos
										tecnológicos mediante un proceso de 3 pasos: datos básicos,
										revisión completa y gradación automática. El sistema calcula
										automáticamente el grado sugerido basándose en el estado de
										todos los componentes.
									</p>
								</div>
							</div>
						</CardBody>
					</Card>
				</div>
			</Container>
		</PageWrapper>
	);
};

export default TechnicalReview;
