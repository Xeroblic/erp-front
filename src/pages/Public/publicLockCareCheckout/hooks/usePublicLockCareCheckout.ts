import { useState } from 'react';
import { useFormik } from 'formik';
import { checkOutValidationSchema, ICheckOutForm } from '../types';
import { lockersPublicService, ICheckOutResponse } from '@/services/lockersPublicService';
import { toast } from '@/utils/toast.utils';

export const usePublicLockCareCheckout = () => {
	const [isSubmittingCheckOut, setIsSubmittingCheckOut] = useState(false);
	const [checkoutResult, setCheckoutResult] = useState<ICheckOutResponse | null>(null);

	const formik = useFormik<ICheckOutForm>({
		initialValues: {
			withdrawal_keyword: '',
		},
		validationSchema: checkOutValidationSchema,
		onSubmit: async (values) => {
			try {
				setIsSubmittingCheckOut(true);
				const response = await lockersPublicService.checkOutLocker({
					withdrawal_keyword: values.withdrawal_keyword,
				});
				setCheckoutResult(response);
				toast.success('Clave validada correctamente.');
			} catch (error: any) {
				const apiMessage = error?.response?.data?.message;
				toast.error(apiMessage || 'Palabra clave inválida o casillero no encontrado.');
			} finally {
				setIsSubmittingCheckOut(false);
			}
		},
	});

	return {
		formik,
		isSubmittingCheckOut,
		checkoutResult,
	};
};
