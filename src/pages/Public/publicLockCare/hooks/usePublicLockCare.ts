import { useState, useEffect, useCallback } from 'react';
import { useFormik } from 'formik';
import { useParams } from 'react-router-dom';
import { TicketFormValues } from '@/pages/Public/formLockCleare/components/FormLockCare.types';
import { formLockCareValidationSchema } from '@/pages/Public/formLockCleare/components/FormLockCare.validation';
import { lockersPublicService, ILockerPublicInfo } from '@/services/lockersPublicService';
import { mapFormToCheckInPayload } from '../types';
import { toast } from '@/utils/toast.utils';

const initialValues: TicketFormValues = {
	name: '',
	email: '',
	phone: '',
	termsAccepted: false,
	requiresInvoice: '',
	invoiceRut: '',
	invoiceBusinessName: '',
	invoiceAddress: '',
	serviceType: '',
	// Reparación
	repairBrand: '',
	repairModel: '',
	repairSerialNumber: '',
	repairIncludesCharger: '',
	// Upgrade
	upgradeType: '',
	upgradeBrand: '',
	upgradeModel: '',
	upgradeSerialNumber: '',
	notes: '',
	message: '',
	attachments: [],
};

export const usePublicLockCare = () => {
	const { token } = useParams<{ token: string }>();

	// Estado de verificación del casillero
	const [isLoadingInfo, setIsLoadingInfo] = useState(true);
	const [lockerInfo, setLockerInfo] = useState<ILockerPublicInfo | null>(null);
	const [infoError, setInfoError] = useState<string | null>(null);

	// Estado post-submit
	const [pinReceived, setPinReceived] = useState<string | null>(null);

	// Estado para modal de términos
	const [isTerminosOpen, setIsTerminosOpen] = useState(false);

	// Verificar disponibilidad del casillero al montar
	useEffect(() => {
		if (!token) {
			setInfoError('Código QR inválido o incompleto.');
			setIsLoadingInfo(false);
			return;
		}

		const fetchInfo = async () => {
			try {
				setIsLoadingInfo(true);
				setInfoError(null);
				const info = await lockersPublicService.getLockerInfo(token);
				setLockerInfo(info);

				if (!info.is_available) {
					setInfoError(
						info.message ||
							'Este casillero no se encuentra disponible. Por favor, escanea otro casillero cercano.',
					);
				}
			} catch (error: any) {
				const apiMessage = error?.response?.data?.message;
				setInfoError(
					apiMessage || 'Error de conexión al verificar el casillero. Intente nuevamente.',
				);
			} finally {
				setIsLoadingInfo(false);
			}
		};

		fetchInfo();
	}, [token]);

	const formik = useFormik<TicketFormValues>({
		initialValues,
		validationSchema: formLockCareValidationSchema,
		validateOnBlur: true,
		validateOnChange: false,
		onSubmit: async (values, helpers) => {
			if (!token) return;

			try {
				const payload = mapFormToCheckInPayload(values, token);
				const response = await lockersPublicService.checkInLocker(payload);
				
				setPinReceived(response.locker_pin);
				toast.success('Registro completado exitosamente.');
				helpers.resetForm();
				setIsTerminosOpen(false);
			} catch (error: any) {
				const apiMessage = error?.response?.data?.message;
				toast.error(
					apiMessage ||
						'No se pudo completar el registro. Verifica los datos e intenta de nuevo.',
				);
			} finally {
				helpers.setSubmitting(false);
			}
		},
	});

	const handleOpenTerms = useCallback(() => {
		setIsTerminosOpen(true);
	}, []);

	const handleCloseTerms = useCallback(() => {
		setIsTerminosOpen(false);
	}, []);

	const handleAcceptTerms = useCallback(() => {
		formik.setFieldValue('termsAccepted', true);
		formik.setFieldTouched('termsAccepted', true, true);
	}, [formik]);

	return {
		// Estado del casillero
		isLoadingInfo,
		infoError,
		lockerInfo,
		// Formik
		formik,
		// PIN
		pinReceived,
		// Términos y condiciones
		isTerminosOpen,
		handleOpenTerms,
		handleCloseTerms,
		handleAcceptTerms,
	};
};
