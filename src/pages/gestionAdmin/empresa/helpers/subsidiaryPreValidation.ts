import { toast } from 'react-toastify';
import { MIN_NAME_LENGTH, MIN_RUT_LENGTH } from './subsidiaryValidation';

interface PreSubmitValidationParams {
	values: {
		name: string;
		email?: string;
		website?: string;
		phone?: string;
		rut?: string;
	};
	setFieldError: (field: string, message: string) => void;
}

export const validateManagerAvailability = (adminUsersCount: number): boolean => {
	if (adminUsersCount === 0) {
		toast.error('No hay gerentes disponibles. Cree usuarios con rol administrador.');
		return false;
	}
	return true;
};

export const validateSelectedManager = (
	selectedManager: any,
	setFieldError: (field: string, message: string) => void,
): boolean => {
	if (!selectedManager) {
		toast.error('Debe seleccionar un gerente válido');
		setFieldError('managerId', 'Seleccione un gerente');
		return false;
	}
	return true;
};

export const validateName = (
	name: string,
	setFieldError: (field: string, message: string) => void,
): boolean => {
	if (!name || name.trim().length < MIN_NAME_LENGTH) {
		toast.error(`Nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`);
		setFieldError('name', 'Nombre muy corto');
		return false;
	}
	return true;
};

export const validateEmail = (
	email: string | undefined,
	setFieldError: (field: string, message: string) => void,
): boolean => {
	if (email?.trim()) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
		if (!emailRegex.test(email.trim())) {
			toast.error('Email inválido');
			setFieldError('email', 'Email inválido');
			return false;
		}
	}
	return true;
};

export const validateWebsite = (
	website: string | undefined,
	setFieldError: (field: string, message: string) => void,
): boolean => {
	if (website?.trim()) {
		if (!website.startsWith('http://') && !website.startsWith('https://')) {
			toast.error('URL debe comenzar con http:// o https://');
			setFieldError('website', 'URL inválida');
			return false;
		}
	}
	return true;
};

export const validatePhone = (
	phone: string | undefined,
	setFieldError: (field: string, message: string) => void,
): boolean => {
	if (phone?.trim()) {
		const phoneNumbers = phone.replace(/\D/g, '');
		if (phoneNumbers.length < 8) {
			toast.error('Teléfono debe tener al menos 8 dígitos');
			setFieldError('phone', 'Teléfono incompleto');
			return false;
		}
	}
	return true;
};

export const validateRut = (
	rut: string | undefined,
	setFieldError: (field: string, message: string) => void,
): boolean => {
	if (rut?.trim()) {
		const cleanRut = rut.replace(/[.-]/g, '');
		if (cleanRut.length < MIN_RUT_LENGTH) {
			toast.error(`RUT debe tener al menos ${MIN_RUT_LENGTH} caracteres`);
			setFieldError('rut', 'RUT incompleto');
			return false;
		}
	}
	return true;
};

export const runAllPreSubmitValidations = (
	params: PreSubmitValidationParams & {
		adminUsersCount: number;
		selectedManager: any;
	},
): boolean => {
	const { values, setFieldError, adminUsersCount, selectedManager } = params;

	if (!validateManagerAvailability(adminUsersCount)) return false;
	if (!validateSelectedManager(selectedManager, setFieldError)) return false;
	if (!validateName(values.name, setFieldError)) return false;
	if (!validateEmail(values.email, setFieldError)) return false;
	if (!validateWebsite(values.website, setFieldError)) return false;
	if (!validatePhone(values.phone, setFieldError)) return false;
	if (!validateRut(values.rut, setFieldError)) return false;

	return true;
};
