import * as Yup from 'yup';

export const MIN_NAME_LENGTH = 3;
export const MAX_NAME_LENGTH = 100;
export const MIN_RUT_LENGTH = 9;
export const MAX_RUT_LENGTH = 12;
export const MIN_ADDRESS_LENGTH = 10;
export const MAX_ADDRESS_LENGTH = 200;
export const MIN_PHONE_LENGTH = 9;
export const MAX_PHONE_LENGTH = 20;
export const MAX_EMAIL_LENGTH = 100;
export const MAX_WEBSITE_LENGTH = 100;

export const subsidiaryValidationSchema = Yup.object({
    name: Yup.string()
        .required('Nombre obligatorio')
        .min(MIN_NAME_LENGTH, `Mínimo ${MIN_NAME_LENGTH} caracteres`)
        .max(MAX_NAME_LENGTH, `Máximo ${MAX_NAME_LENGTH} caracteres`)
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_.&()]+$/, 'Solo letras, números y símbolos básicos')
        .test('no-only-spaces', 'No puede contener solo espacios', (value) => {
            return value ? value.trim().length > 0 : false;
        }),
    managerId: Yup.number()
        .required('Gerente obligatorio')
        .positive('Seleccione un gerente válido')
        .integer('Gerente inválido'),
    rut: Yup.string()
        .nullable()
        .matches(/^[\d\.-kK]+$/, 'Solo números, puntos, guiones y letra K')
        .min(MIN_RUT_LENGTH, `Mínimo ${MIN_RUT_LENGTH} caracteres`)
        .max(MAX_RUT_LENGTH, `Máximo ${MAX_RUT_LENGTH} caracteres`)
        .test('rut-format', 'Formato inválido (ej: 12.345.678-9)', (value) => {
            if (!value) return true;
            const cleanRut = value.replace(/[.-]/g, '');
            if (cleanRut.length < 8) return false;
            const rutPattern = /^\d{7,8}[0-9kK]$/;
            return rutPattern.test(cleanRut);
        }),
    address: Yup.string()
        .nullable()
        .min(MIN_ADDRESS_LENGTH, `Mínimo ${MIN_ADDRESS_LENGTH} caracteres`)
        .max(MAX_ADDRESS_LENGTH, `Máximo ${MAX_ADDRESS_LENGTH} caracteres`)
        .test('no-only-spaces', 'No puede contener solo espacios', (value) => {
            if (!value) return true;
            return value.trim().length > 0;
        }),
    phone: Yup.string()
        .nullable()
        .matches(/^[\d\s\-\+\(\)]+$/, 'Solo números y símbolos telefónicos')
        .min(MIN_PHONE_LENGTH, `Mínimo ${MIN_PHONE_LENGTH} dígitos`)
        .max(MAX_PHONE_LENGTH, `Máximo ${MAX_PHONE_LENGTH} caracteres`)
        .test('valid-phone', 'Debe contener al menos 8 números', (value) => {
            if (!value) return true;
            const numbers = value.replace(/\D/g, '');
            return numbers.length >= 8;
        }),
    email: Yup.string()
        .nullable()
        .email('Formato de email inválido')
        .max(MAX_EMAIL_LENGTH, `Máximo ${MAX_EMAIL_LENGTH} caracteres`)
        .test('email-format', 'Email inválido', (value) => {
            if (!value) return true;
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(value);
        })
        .test('no-spaces', 'El email no puede contener espacios', (value) => {
            if (!value) return true;
            return !value.includes(' ');
        }),
    website: Yup.string()
        .nullable()
        .url('URL inválida')
        .max(MAX_WEBSITE_LENGTH, `Máximo ${MAX_WEBSITE_LENGTH} caracteres`)
        .test('url-protocol', 'Debe comenzar con http:// o https://', (value) => {
            if (!value) return true;
            return value.startsWith('http://') || value.startsWith('https://');
        })
        .test('no-spaces', 'La URL no puede contener espacios', (value) => {
            if (!value) return true;
            return !value.includes(' ');
        }),
    comuna: Yup.string().nullable(),
});
