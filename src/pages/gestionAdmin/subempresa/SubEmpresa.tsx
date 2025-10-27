import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMisSubsidiarias, deleteSubsidiaria } from '@/store/slices/subempresa/subEmpresaSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Badge from '@/components/ui/Badge';
import { ISubempresa } from '@/interface/empresas.interface';
import { toast } from 'react-toastify';
import { CreateSubempresaModal, DeleteSubempresaModal, SubempresasTable } from './components';

export default function SubEmpresaLista() {
	const dispatch = useAppDispatch();
	const user = useAppSelector((s) => s.auth.user);
	const personalizacionState = useAppSelector((s) => s.personalizacion);

	const companyId =
		personalizacionState?.personalizacionUsuario?.company_id ||
		personalizacionState?.personalizacionUsuario?.empresa ||
		user?.company?.id ||
		(user?.personalizacion?.empresa ?? undefined);

	const { lista: subempresas = [], loading } = useAppSelector((s) => s.subEmpresa);

	const [globalFilter, setGlobalFilter] = useState('');
	const [openCreate, setOpenCreate] = useState(false);
	const [openDelete, setOpenDelete] = useState(false);
	const [toDeleteId, setToDeleteId] = useState<number | null>(null);
	const [editingSubempresa, setEditingSubempresa] = useState<ISubempresa | null>(null);

	useEffect(() => {
		if (user) {
			dispatch(fetchMisSubsidiarias());
		}
	}, [dispatch, user]);

	const handleEdit = (subempresa: ISubempresa) => {
		setEditingSubempresa(subempresa);
		setOpenCreate(true);
	};

	const handleCreate = () => {
		setEditingSubempresa(null);
		setOpenCreate(true);
	};

	const handleCloseModal = () => {
		setOpenCreate(false);
		setEditingSubempresa(null);
	};

	const handleDelete = (id: number) => {
		setToDeleteId(id);
		setOpenDelete(true);
	};

	const confirmDelete = async () => {
		if (!toDeleteId) return;
		try {
			await dispatch(deleteSubsidiaria(toDeleteId)).unwrap();
			toast.success('Subempresa eliminada');
			dispatch(fetchMisSubsidiarias());
		} catch {
			toast.error('Error al eliminar subempresa');
		} finally {
			setOpenDelete(false);
			setToDeleteId(null);
		}
	};

	const filteredSubempresas = subempresas.filter((sub) =>
		sub.name?.toLowerCase().includes(globalFilter.toLowerCase()),
	);

	return (
		<PageWrapper isProtectedRoute title='Subempresas' name='Subempresas'>
			<Subheader>
				<SubheaderLeft>
					<Badge className='text-xl'>Subempresas de la Empresa</Badge>
				</SubheaderLeft>
				<SubheaderRight className='flex items-center gap-2'>
					<Input
						name='subempresa-busqueda'
						placeholder='Buscar subempresas...'
						value={globalFilter}
						onChange={(e) => setGlobalFilter(e.target.value)}
						className='w-48 rounded border'
					/>
					<Button variant='solid' icon='HeroPlus' onClick={handleCreate}>
						Nueva Subempresa
					</Button>
				</SubheaderRight>
			</Subheader>

			<Container className='pt-4'>
				<SubempresasTable
					subempresas={filteredSubempresas}
					loading={loading}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onCreate={handleCreate}
				/>
			</Container>

			<CreateSubempresaModal
				isOpen={openCreate}
				onClose={handleCloseModal}
				subempresa={editingSubempresa}
				companyId={companyId || 0}
			/>

			<DeleteSubempresaModal
				isOpen={openDelete}
				onClose={() => setOpenDelete(false)}
				onConfirm={confirmDelete}
			/>
		</PageWrapper>
	);
}
