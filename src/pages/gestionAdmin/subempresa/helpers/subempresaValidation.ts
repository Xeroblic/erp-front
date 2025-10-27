import * as Yup from 'yup';

export const subempresaValidationSchema = Yup.object({
    nombre: Yup.string()
        .min(3, 'El nombre debe tener al menos 3 caracteres')
        .max(100, 'El nombre no puede exceder 100 caracteres')
        .required('El nombre es obligatorio'),
    managerId: Yup.string()
        .required('Debe seleccionar un gerente responsable'),
    rut: Yup.string()
        .min(9, 'El RUT debe tener al menos 9 caracteres')
        .max(12, 'El RUT no puede exceder 12 caracteres')
        .nullable(),
    telefono: Yup.string()
        .min(8, 'El teléfono debe tener al menos 8 dígitos')
        .nullable(),
    email: Yup.string()
        .email('Email inválido')
        .max(100, 'El email no puede exceder 100 caracteres')
        .nullable(),
    direccion: Yup.string()
        .min(10, 'La dirección debe tener al menos 10 caracteres')
        .max(200, 'La dirección no puede exceder 200 caracteres')
        .nullable(),
});
