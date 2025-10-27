import { toast } from 'react-toastify';

export const handleSubempresaError = (error: any, isEditing: boolean) => {
    const errorMessage = String(
        error?.message || error?.response?.data?.message || '',
    ).toLowerCase();
    const fullError = JSON.stringify(error?.response?.data || error, null, 2).toLowerCase();
    const statusCode = error?.response?.status;

    const isDuplicate =
        errorMessage.includes('duplicate') ||
        errorMessage.includes('duplicado') ||
        errorMessage.includes('unique') ||
        errorMessage.includes('violation') ||
        fullError.includes('duplicate') ||
        fullError.includes('unique') ||
        fullError.includes('violation') ||
        statusCode === 409;

    if (isDuplicate) {
        if (
            errorMessage.includes('subsidiary_manager_email') ||
            errorMessage.includes('manager_email') ||
            fullError.includes('subsidiary_manager_email')
        ) {
            toast.error('Este gerente ya está asignado a otra subempresa. Seleccione otro gerente.');
        } else if (errorMessage.includes('email') || fullError.includes('subsidiary_email') || fullError.includes('email')) {
            toast.error('El email ingresado ya está registrado en otra subempresa');
        } else if (errorMessage.includes('rut') || fullError.includes('subsidiary_rut') || fullError.includes('rut')) {
            toast.error('El RUT ingresado ya está registrado en otra subempresa');
        } else if (errorMessage.includes('name') || fullError.includes('subsidiary_name') || fullError.includes('name')) {
            toast.error('El nombre ingresado ya existe en otra subempresa');
        } else {
            toast.error('Ya existe una subempresa con estos datos');
        }
    } else if (errorMessage.includes('permission') || statusCode === 403) {
        toast.error('No tiene permisos suficientes');
    } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        toast.error('Error de conexión');
    } else {
        toast.error(
            isEditing ? 'Error al actualizar la subempresa' : 'Error al crear la subempresa',
        );
    }
};
