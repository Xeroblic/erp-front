import { useState, useEffect, useCallback } from 'react';
import { useFormik } from 'formik';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { TicketFormValues } from '@/pages/Public/formLockCleare/components/FormLockCare.types';
import { formLockCareValidationSchema } from '@/pages/Public/formLockCleare/components/FormLockCare.validation';
import lockersPublicService from '@/services/lockers/lockersPublicService';
import { ILockerPublicInfo } from '@/interface/lockers.interface';
import { resolveLockerError } from '@/utils/lockerErrors.util';
import { mapFormToCheckInPayload } from '../types';

const initialValues: TicketFormValues = {
	// ... tus initialValues se mantienen igual
	name: '',
	email: '',
	phone: '',
	termsAccepted: false,
	requiresInvoice: '',
	invoiceRut: '',
	invoiceBusinessName: '',
	invoiceAddress: '',
	serviceType: '',
	repairBrand: '',
	repairModel: '',
	repairSerialNumber: '',
	repairIncludesCharger: '',
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
	const [isLoadingInfo, setIsLoadingInfo] = useState(true);
	const [lockerInfo, setLockerInfo] = useState<ILockerPublicInfo | null>(null);
	const [infoError, setInfoError] = useState<string | null>(null);

	const [pinReceived, setPinReceived] = useState<string | null>(null);
	const [lockerNumberReceived, setLockerNumberReceived] = useState<string | null>(null);
	const [isPinModalOpen, setIsPinModalOpen] = useState(false);
	const [isCheckInComplete, setIsCheckInComplete] = useState(false);
	const [isTerminosOpen, setIsTerminosOpen] = useState(false);

	// Estado para los casilleros sugeridos
	const [suggestedLockers, setSuggestedLockers] = useState<string[]>([]);

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
						info.message && typeof info.message === 'string'
							? info.message.replace('.', '')
							: 'Este casillero se encuentra ocupado.',
					);

					setSuggestedLockers((info.available_lockers ?? []).map(String));
				}
			} catch (error: unknown) {
				setInfoError(
					resolveLockerError(
						error,
						'Error de conexión al verificar el casillero. Intente nuevamente.',
					).message,
				);
			} finally {
				setIsLoadingInfo(false);
			}
		};

		fetchInfo();
	}, [token]);

	const formik = useFormik<TicketFormValues>({
		// ... toda tu configuración de formik se mantiene igual
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
				setLockerNumberReceived(response.data.locker?.number ?? null);

				setIsCheckInComplete(true);
				setIsPinModalOpen(true);

				toast.success('Registro completado exitosamente.');
				helpers.resetForm();
				setIsTerminosOpen(false);
			} catch (error: unknown) {
				toast.error(
					resolveLockerError(
						error,
						'No se pudo completar el registro. Verifica los datos e intenta de nuevo.',
					).message,
				);
			} finally {
				helpers.setSubmitting(false);
			}
		},
	});

	// El mismo QR del casillero lleva al retiro: el backend exige su token junto a la palabra clave.
	const checkOutPath =
		token && lockerInfo && !lockerInfo.is_available
			? `/lockers/${encodeURIComponent(token)}/check-out`
			: null;

	const handleOpenTerms = useCallback(() => setIsTerminosOpen(true), []);
	const handleCloseTerms = useCallback(() => setIsTerminosOpen(false), []);
	const handleAcceptTerms = useCallback(() => {
		formik.setFieldValue('termsAccepted', true);
		formik.setFieldTouched('termsAccepted', true, true);
	}, [formik]);
	const handleClosePinModal = useCallback(() => setIsPinModalOpen(false), []);
	const handleOpenPinModal = useCallback(() => setIsPinModalOpen(true), []);

	return {
		isLoadingInfo,
		infoError,
		lockerInfo,
		suggestedLockers,
		checkOutPath,
		formik,
		pinReceived,
		lockerNumberReceived,
		isPinModalOpen,
		isCheckInComplete,
		handleClosePinModal,
		handleOpenPinModal,
		isTerminosOpen,
		handleOpenTerms,
		handleCloseTerms,
		handleAcceptTerms,
	};
};
