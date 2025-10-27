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
        fullError.includes('duplicate') ||
        fullError.includes('unique') ||
        statusCode === 409;

    if (isDuplicate) {
        if (errorMessage.includes('email') || fullError.includes('subsidiary_email')) {
            toast.error('Email ya está en uso');
        } else if (errorMessage.includes('rut') || fullError.includes('subsidiary_rut')) {
            toast.error('RUT ya está registrado');
        } else if (errorMessage.includes('name') || fullError.includes('subsidiary_name')) {
            toast.error('Nombre ya existe');
        } else {
            toast.error('Ya existe un registro con estos datos');
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
