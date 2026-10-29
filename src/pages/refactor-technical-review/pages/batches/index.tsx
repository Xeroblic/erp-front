import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { ListaLotes } from './components/tables/ListaLotes';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';

function BatchesListPage() {
	const navigate = useNavigate();

	return (
		<PageWrapper isProtectedRoute={true} name='Lotes' title='Lotes'>
			<Subheader>
				<SubheaderLeft>
					<Button
						variant='outline'
						color='red'
						onClick={() => navigate('/technical-reviews/refactor')}>
						<Icon icon='HeroArrowLeft' size={'text-2xl'} color='red' />
					</Button>
					<div className='flex flex-col items-center justify-center gap-2'>
						<Icon icon='DuoAlignJustify' className='font-bold' />
					</div>
					<div className='flex flex-col justify-center'>
						<div className='flex flex-row gap-2'>
							<Badge className='text-2xl font-semibold'>Listado de Lotes</Badge>
						</div>
						<div className='flex flex-row gap-2'>
							<p className='text-sm text-gray-500'>
								Aqui puedes gestionar todos los lotes de productos
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<Button
						variant='solid'
						color='emerald'
						icon='HeroPlus'
						onClick={() => navigate('/technical-reviews/lotes/crear')}>
						Nuevo Lote
					</Button>
				</SubheaderRight>
			</Subheader>
			<Container>
				<ListaLotes />
			</Container>
		</PageWrapper>
	);
}

export default BatchesListPage;
