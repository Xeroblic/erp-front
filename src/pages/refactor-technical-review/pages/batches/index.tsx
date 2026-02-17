import Container from '@/components/layouts/Container/Container';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft } from '@/components/layouts/Subheader/Subheader';
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
					<div className='flex flex-row gap-2'>
						<Icon icon='DuoAlignJustify' />
						<Badge className='text-2xl font-semibold'>Lotes</Badge>
					</div>
				</SubheaderLeft>
			</Subheader>
			<Container>
				<ListaLotes />
			</Container>
		</PageWrapper>
	);
}

export default index;
