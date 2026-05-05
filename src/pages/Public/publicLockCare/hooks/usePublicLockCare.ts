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

	// Estado post-submit y modal de PIN
	const [pinReceived, setPinReceived] = useState<string | null>(null);
	const [lockerNumberReceived, setLockerNumberReceived] = useState<string | null>(null);
	const [isPinModalOpen, setIsPinModalOpen] = useState(false);
	const [isCheckInComplete, setIsCheckInComplete] = useState(false);

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
						`Este casillero se encuentra ocupado prueba con uno de estos:${info.available_lockers}.`,
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

				const pinFromResponse = response.locker_pin;
				const lockerNum = response.data?.locker?.number || String(lockerInfo?.locker_number || '');

				setPinReceived(pinFromResponse);
				setLockerNumberReceived(lockerNum);

				// Marcar check-in como completado y abrir el modal del PIN
				setIsCheckInComplete(true);
				setIsPinModalOpen(true);

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

	const handleClosePinModal = useCallback(() => {
		setIsPinModalOpen(false);
	}, []);

	const handleOpenPinModal = useCallback(() => {
		setIsPinModalOpen(true);
	}, []);

	return {
		// Estado del casillero
		isLoadingInfo,
		infoError,
		lockerInfo,
		// Formik
		formik,
		// PIN y modal
		pinReceived,
		lockerNumberReceived,
		isPinModalOpen,
		isCheckInComplete,
		handleClosePinModal,
		handleOpenPinModal,
		// Términos y condiciones
		isTerminosOpen,
		handleOpenTerms,
		handleCloseTerms,
		handleAcceptTerms,
	};
};
