import { useState } from 'react';
import { useFormik } from 'formik';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import lockersPublicService from '@/services/lockers/lockersPublicService';
import { ICheckOutResponse } from '@/interface/lockers.interface';
import { resolveLockerError } from '@/utils/lockerErrors.util';
import { checkOutValidationSchema, ICheckOutForm } from '../types';

// El límite de intentos lo aplica el backend (por IP y por casillero) y responde 429.
export const usePublicLockCareCheckout = () => {
	const { token } = useParams<{ token: string }>();
	const [isSubmittingCheckOut, setIsSubmittingCheckOut] = useState(false);
	const [checkoutResult, setCheckoutResult] = useState<ICheckOutResponse | null>(null);
	const [isBlocked, setIsBlocked] = useState(false);

	const formik = useFormik<ICheckOutForm>({
		initialValues: {
			withdrawal_keyword: '',
		},
		validationSchema: checkOutValidationSchema,
		onSubmit: async (values) => {
			if (!token) return;

			try {
				setIsSubmittingCheckOut(true);
				const response = await lockersPublicService.checkOutLocker({
					qr_token: token,
					withdrawal_keyword: values.withdrawal_keyword,
				});
				setCheckoutResult(response);
				setIsBlocked(false);
				toast.success('Clave validada correctamente.');
			} catch (error: unknown) {
				const resolved = resolveLockerError(
					error,
					'No se pudo validar la palabra clave. Intenta de nuevo.',
				);
				setIsBlocked(resolved.kind === 'rate_limited');
				toast.error(resolved.message);
			} finally {
				setIsSubmittingCheckOut(false);
			}
		},
	});

	return {
		formik,
		isSubmittingCheckOut,
		checkoutResult,
		isBlocked,
		hasToken: !!token,
	};
};
