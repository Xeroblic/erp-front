import { toast } from 'react-toastify';
import { FormikErrors } from 'formik';

interface SubsidiaryFormValues {
    name: string;
    managerId: string | number;
    rut: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    region: string;
    provincia: string;
    comuna: string;
}

export const handleSubsidiaryError = (
    error: any,
    values: SubsidiaryFormValues,
    setFieldError: (field: string, message: string) => void,
) => {
    const errorMessage = String(
        error?.message || error?.response?.data?.message || '',
    ).toLowerCase();
    const errorData = error?.response?.data || {};
    const statusCode = error?.response?.status;
    const fullError = JSON.stringify(error?.response?.data || error, null, 2).toLowerCase();

    if (
        errorMessage.includes('duplicate') ||
        errorMessage.includes('duplicado') ||
        errorMessage.includes('unique') ||
        errorMessage.includes('violation') ||
        errorMessage.includes('ya existe') ||
        errorMessage.includes('already exists') ||
        fullError.includes('duplicate') ||
        fullError.includes('unique') ||
        fullError.includes('violation') ||
        statusCode === 409
    ) {
        if (
            errorMessage.includes('subsidiary_manager_email') ||
            fullError.includes('subsidiary_manager_email')
        ) {
            toast.error('Este gerente ya está asignado a otra subsidiaria');
            setFieldError('managerId', 'Gerente ya asignado');
        } else if (errorMessage.includes('email') || fullError.includes('subsidiary_email') || fullError.includes('email')) {
            toast.error(`El email "${values.email}" ya está registrado en otra subsidiaria`);
            setFieldError('email', 'Email duplicado');
        } else if (errorMessage.includes('rut') || fullError.includes('subsidiary_rut') || fullError.includes('rut')) {
            toast.error(`El RUT "${values.rut}" ya está registrado en otra subsidiaria`);
            setFieldError('rut', 'RUT duplicado');
        } else if (
            errorMessage.includes('name') ||
            errorMessage.includes('nombre') ||
            fullError.includes('subsidiary_name')
        ) {
            toast.error(`El nombre "${values.name}" ya existe en otra subsidiaria`);
            setFieldError('name', 'Nombre duplicado');
        } else {
            toast.error('Ya existe una subsidiaria con estos datos');
        }
    } else if (
        errorMessage.includes('commune') &&
        (errorMessage.includes('foreign') || errorMessage.includes('invalid'))
    ) {
        toast.error('Comuna seleccionada es inválida');
        setFieldError('comuna', 'Comuna inválida');
    } else if (errorMessage.includes('company') && errorMessage.includes('foreign')) {
        toast.error('Error de configuración del sistema');
    } else if (errorMessage.includes('validation') || errorData.errors) {
        const validationErrors = errorData.errors || {};
        const errorFields = Object.keys(validationErrors);

        if (errorFields.length > 0) {
            const firstError = validationErrors[errorFields[0]]?.[0] || 'Error de validación';
            toast.error(firstError);

            errorFields.forEach((field) => {
                const fieldName = field.replace('subsidiary_', '');
                const errorMsg = validationErrors[field][0];
                setFieldError(fieldName, errorMsg);
            });
        } else {
            toast.error('Error de validación');
        }
    } else if (
        errorMessage.includes('null') ||
        errorMessage.includes('required') ||
        errorMessage.includes('obligatorio')
    ) {
        toast.error('Faltan campos obligatorios');
    } else if (
        errorMessage.includes('permission') ||
        errorMessage.includes('autorizado') ||
        errorMessage.includes('authorized') ||
        statusCode === 403
    ) {
        toast.error('No tiene permisos suficientes');
    } else if (
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('conexión')
    ) {
        toast.error('Error de conexión. Verifique su internet');
    } else if (
        statusCode === 500 ||
        errorMessage.includes('server') ||
        errorMessage.includes('internal')
    ) {
        toast.error('Error del servidor. Intente nuevamente');
    } else if (statusCode === 404) {
        toast.error('Endpoint no encontrado');
    } else if (statusCode === 400) {
        toast.error(`Datos inválidos: ${errorMessage || 'Verifique los campos'}`);
    } else {
        let displayError = errorMessage || errorData?.error || 'Error desconocido';

        if (displayError.length > 150) {
            displayError = displayError.substring(0, 150) + '...';
        }

        toast.error(displayError || 'Error al guardar');
    }
};
