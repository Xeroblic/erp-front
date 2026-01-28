import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchMisSubsidiarias, deleteSubsidiaria } from '@/store/slices/subempresa/subEmpresaSlice';
import PageWrapper from '@/components/layouts/PageWrapper/PageWrapper';
import Subheader, { SubheaderLeft, SubheaderRight } from '@/components/layouts/Subheader/Subheader';
import Container from '@/components/layouts/Container/Container';
import Button from '@/components/ui/Button';
import Input from '@/components/form/Input';
import Badge from '@/components/ui/Badge';
import { ISubempresa } from '@/interface/empresas.interface';
import { SubempresasTable } from './components';
import Icon from '@/components/icon/Icon';
import Tooltip from '@/components/ui/Tooltip';

// Lazy load heavy modals - only loaded when opened
const CreateSubempresaModal = lazy(() => import('./components/modals/CreateSubempresaModal'));
const DeleteSubempresaModal = lazy(() => import('./components/modals/DeleteSubempresaModal'));

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

	// Memoized filtering - prevents recalculation on every render
	const filteredSubempresas = useMemo(
		() =>
			subempresas.filter((sub) =>
				sub.name?.toLowerCase().includes(globalFilter.toLowerCase()),
			),
		[subempresas, globalFilter],
	);

	return (
		<PageWrapper isProtectedRoute title='Subempresas' name='Subempresas'>
			<Subheader>
				<SubheaderLeft>
					<div>
						<div className='item-center flex gap-2'>
							<Icon icon='DuoBuilding' size='text-3xl' />
							<Badge className='text-2xl font-bold'>Subempresas de la Empresa</Badge>
						</div>
						<div className='flex flex-col gap-2'>
							<p className='mt-1 text-sm text-zinc-400'>
								Administración de las subempresas asociadas a la empresa principal.
							</p>
						</div>
					</div>
				</SubheaderLeft>
				<SubheaderRight>
					<div className='flex items-center gap-2'>
						<Input
							name='subempresa-busqueda'
							placeholder='Buscar subempresas...'
							value={globalFilter}
							onChange={(e) => setGlobalFilter(e.target.value)}
							className='w-48 rounded border'
						/>
						<Tooltip text='Crear nueva subempresa' placement='top-start' color='blue'>
							<Button variant='solid' icon='HeroPlus' onClick={handleCreate} />
						</Tooltip>
					</div>
				</SubheaderRight>
			</Subheader>

			<Container className='py-6'>
				<SubempresasTable
					subempresas={filteredSubempresas}
					loading={loading}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onCreate={handleCreate}
				/>
			</Container>

			{/* Conditionally render modals only when needed - reduces DOM size */}
			{openCreate && (
				<Suspense fallback={null}>
					<CreateSubempresaModal
						isOpen={openCreate}
						onClose={handleCloseModal}
						subempresa={editingSubempresa}
						companyId={companyId || 0}
					/>
				</Suspense>
			)}

			{openDelete && (
				<Suspense fallback={null}>
					<DeleteSubempresaModal
						isOpen={openDelete}
						onClose={() => setOpenDelete(false)}
						subempresaId={toDeleteId || 0}
						subsiName={
							toDeleteId
								? subempresas.find((s) => s.id === toDeleteId)?.name || ''
								: ''
						}
						isNavigate={false}
					/>
				</Suspense>
			)}
		</PageWrapper>
	);
}
