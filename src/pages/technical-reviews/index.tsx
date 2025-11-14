/**
 * Technical Reviews - Home/Hub
 * Pantalla de entrada donde el usuario elige el modo de trabajo
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Container from '@/components/layouts/Container/Container';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/icon/Icon';

const TechnicalReviewsHome: React.FC = () => {
	const navigate = useNavigate();

	return (
		<PageWrapper name='technical-reviews-home'>
			<Container>
				{/* Header */}
				<div className='mb-8'>
					<h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
						Revisiones Técnicas
					</h1>
					<p className='mt-2 text-gray-600 dark:text-gray-400'>
						Gestiona la revisión y gradación de equipos tecnológicos. Elige el modo de
						trabajo:
					</p>
				</div>

				{/* Modos de trabajo */}
				<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
					{/* Modo A: Por Lotes */}
					<Card
						className='cursor-pointer transition-all hover:shadow-lg'
						onClick={() => navigate('/technical-reviews/batches')}>
						<CardBody className='space-y-4 p-6'>
							<div className='flex items-center justify-between'>
								<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900'>
									<Icon
										icon='HeroArchiveBox'
										className='h-6 w-6 text-blue-600 dark:text-blue-300'
									/>
								</div>
								<Icon icon='HeroChevronRight' className='h-5 w-5 text-gray-400' />
							</div>

							<div>
								<h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
									Modo A: Por Lotes
								</h3>
								<p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
									Organiza las revisiones por lotes de entrada. Ideal para
									recepciones de proveedores con múltiples equipos.
								</p>
							</div>

							<div className='space-y-2 text-sm text-gray-600 dark:text-gray-400'>
								<div className='flex items-start gap-2'>
									<Icon
										icon='HeroCheck'
										className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-600'
									/>
									<span>Agrupa series por lote de entrada</span>
								</div>
								<div className='flex items-start gap-2'>
									<Icon
										icon='HeroCheck'
										className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-600'
									/>
									<span>Tabs por tipo de equipo</span>
								</div>
								<div className='flex items-start gap-2'>
									<Icon
										icon='HeroCheck'
										className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-600'
									/>
									<span>Control de cantidad esperada vs recibida</span>
								</div>
							</div>
						</CardBody>
					</Card>

					{/* Modo B: Vista Global */}
					<Card
						className='cursor-pointer transition-all hover:shadow-lg'
						onClick={() => navigate('/technical-reviews/items')}>
						<CardBody className='space-y-4 p-6'>
							<div className='flex items-center justify-between'>
								<div className='flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900'>
									<Icon
										icon='HeroQueueList'
										className='h-6 w-6 text-purple-600 dark:text-purple-300'
									/>
								</div>
								<Icon icon='HeroChevronRight' className='h-5 w-5 text-gray-400' />
							</div>

							<div>
								<h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>
									Modo B: Vista Global de Series
								</h3>
								<p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
									Accede directamente a cualquier serie por número. Ideal para
									búsquedas rápidas y revisiones individuales.
								</p>
							</div>

							<div className='space-y-2 text-sm text-gray-600 dark:text-gray-400'>
								<div className='flex items-start gap-2'>
									<Icon
										icon='HeroCheck'
										className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-600'
									/>
									<span>Búsqueda directa por número de serie</span>
								</div>
								<div className='flex items-start gap-2'>
									<Icon
										icon='HeroCheck'
										className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-600'
									/>
									<span>Vista consolidada de todas las series</span>
								</div>
								<div className='flex items-start gap-2'>
									<Icon
										icon='HeroCheck'
										className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-600'
									/>
									<span>Filtros avanzados por estado y grado</span>
								</div>
							</div>
						</CardBody>
					</Card>
				</div>

				{/* Acciones secundarias */}
				<div className='mt-8 flex gap-4'>
					<Button
						variant='outline'
						onClick={() => navigate('/technical-reviews/validation/rules')}>
						<Icon icon='HeroDocumentText' className='mr-2 h-4 w-4' />
						Ver Reglas de Validación
					</Button>
				</div>

				{/* Info adicional */}
				<Card className='mt-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'>
					<CardBody className='p-6'>
						<div className='flex gap-3'>
							<Icon
								icon='HeroInformationCircle'
								className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400'
							/>
							<div className='space-y-2'>
								<h4 className='font-semibold text-blue-900 dark:text-blue-100'>
									Sobre las Revisiones Técnicas
								</h4>
								<p className='text-sm text-blue-800 dark:text-blue-200'>
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
			</Container>
		</PageWrapper>
	);
};

export default TechnicalReviewsHome;
