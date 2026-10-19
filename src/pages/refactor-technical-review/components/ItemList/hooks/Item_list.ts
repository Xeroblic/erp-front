import { deleteItem } from '@/store/slices/technicalReviews';
import { toast } from 'react-toastify';

const handleDelete = async (
	itemId: number,
	branchId: number,
	dispatch: any,
	setIsDeleting: any,
	setDeleteModalOpen: any,
	setItemToDelete: any,
	onPageChange: any,
	meta: any,
) => {
	if (!branchId) {
		toast.error('No hay sucursal activa para eliminar la revisión');
		return;
	}
	try {
		setIsDeleting(true);
		await dispatch(deleteItem({ branchId, itemId })).unwrap();
		toast.success('Revisión eliminada');
		onPageChange?.(meta.current_page);
	} catch (err: any) {
		toast.error(err?.message || 'No se pudo eliminar la revisión');
	} finally {
		setIsDeleting(false);
		setDeleteModalOpen(false);
		setItemToDelete(null);
	}
};

export default handleDelete;
