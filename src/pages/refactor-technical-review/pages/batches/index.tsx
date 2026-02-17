import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Button from '@/components/ui/Button';
import { useAppDispatch } from '@/store';
import { useNavigate } from 'react-router-dom';
import { ListaLotes } from './components/tables/ListaLotes';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';

function index() {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	return (
		<PageWrapper isProtectedRoute={true} name='Lotes' title='Lotes'>
			<Subheader>
				<SubheaderLeft>
					<Button
						variant='outline'
						icon='HeroArrowLeft'
						onClick={() => navigate('/technical-reviews/refactor')}
					/>
					<div className='flex flex-row gap-2'>
						<Icon icon='DuoAlignJustify' size={'text-3xl'} />
						<Badge className='text-2xl font-semibold'>Listado de Lotes</Badge>
						
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

export default index;
