import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { checkOutValidationSchema, ICheckOutForm } from '../types';
import { lockersPublicService, ICheckOutResponse } from '@/services/lockersPublicService';
import { toast } from '@/utils/toast.utils';

const MAX_ATTEMPTS = 3;
const BLOCK_TIME_MS = 15 * 60 * 1000; // 15 minutos

export const usePublicLockCareCheckout = () => {
    const [isSubmittingCheckOut, setIsSubmittingCheckOut] = useState(false);
    const [checkoutResult, setCheckoutResult] = useState<ICheckOutResponse | null>(null);
    const [attempts, setAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);

    // Al cargar, verificar si el usuario ya estaba bloqueado
    useEffect(() => {
        const blockTimestamp = localStorage.getItem('checkout_block_until');
        if (blockTimestamp) {
            const remainingTime = parseInt(blockTimestamp) - Date.now();
            if (remainingTime > 0) {
                setIsBlocked(true);
                const timer = setTimeout(() => setIsBlocked(false), remainingTime);
                return () => clearTimeout(timer);
            } else {
                localStorage.removeItem('checkout_block_until');
            }
        }
    }, []);

    const formik = useFormik<ICheckOutForm>({
        initialValues: {
            withdrawal_keyword: '',
        },
        validationSchema: checkOutValidationSchema,
        onSubmit: async (values) => {
            if (isBlocked) {
                toast.error('Demasiados intentos. Intenta más tarde.');
                return;
            }

            try {
                setIsSubmittingCheckOut(true);
                const response = await lockersPublicService.checkOutLocker({
                    withdrawal_keyword: values.withdrawal_keyword,
                });
                setCheckoutResult(response);
                toast.success('Clave validada correctamente.');
                setAttempts(0);
            } catch (error: any) {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= MAX_ATTEMPTS) {
                    const blockUntil = Date.now() + BLOCK_TIME_MS;
                    localStorage.setItem('checkout_block_until', blockUntil.toString());
                    setIsBlocked(true);
                    toast.error('Has superado el límite de intentos. Bloqueado por 15 min.');
                } else {
                    const apiMessage = error?.response?.data?.message;
                    toast.error(apiMessage || `Clave inválida. Te quedan ${MAX_ATTEMPTS - newAttempts} intentos.`);
                }
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
    };
};