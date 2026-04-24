import * as Yup from 'yup';

export const checkOutValidationSchema = Yup.object().shape({
	withdrawal_keyword: Yup.string().required('La palabra clave es requerida'),
});

export type ICheckOutForm = Yup.InferType<typeof checkOutValidationSchema>;
