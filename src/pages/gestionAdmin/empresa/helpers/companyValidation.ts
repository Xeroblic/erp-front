import * as Yup from 'yup';

export const companyValidationSchema = Yup.object({
    company_name: Yup.string()
        .required('El nombre es requerido')
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede superar los 100 caracteres'),
    legal_name: Yup.string()
        .required('La razón social es requerida')
        .min(3, 'La razón social debe tener al menos 3 caracteres')
        .max(150, 'La razón social no puede superar los 150 caracteres'),
    company_rut: Yup.string()
        .required('El RUT es requerido')
        .matches(/^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}\-?[0-9kK]{1}$/, 'El RUT no tiene un formato válido'),
    company_type: Yup.string().required('El tipo de empresa es requerido'),
    business_activity: Yup.string()
        .required('La actividad comercial es requerida')
        .max(255, 'La actividad comercial no puede superar los 255 caracteres'),
    company_website: Yup.string().url('Debe ser una URL válida').nullable(),
    company_phone: Yup.string()
        .matches(/^\+?[0-9\s\-\(\)]{8,20}$/, 'El teléfono no tiene un formato válido')
        .nullable(),
    company_address: Yup.string()
        .required('La dirección es requerida')
        .max(255, 'La dirección no puede superar los 255 caracteres'),
    representative_name: Yup.string()
        .required('El nombre del representante es requerido')
        .max(100, 'El nombre del representante no puede superar los 100 caracteres'),
    contact_email: Yup.string()
        .email('Debe ser un email válido')
        .required('El email de contacto es requerido'),
});
