import { FormikProps } from 'formik';
import { TIcons } from '@/types/icons.type';

export type ProfileTabKey = 'EDIT' | 'CONTACT' | 'APPEARANCE';

export type ProfileTabDefinition = {
	key: ProfileTabKey;
	label: string;
	icon: TIcons;
};

export type ProfileFormValues = {
	email?: string;
	first_name?: string;
	second_name?: string;
	last_name?: string;
	second_last_name?: string;
	rut?: string;
	phone_number?: string;
	direccion?: string;
	region?: string;
	provincia?: string;
	comuna?: string;
	genero?: string;
	theme: string;
	fecha_nacimiento?: string;
};

export type ProfileFormik = FormikProps<ProfileFormValues>;
