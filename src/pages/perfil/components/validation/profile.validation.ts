import * as Yup from 'yup';

export const NAME_REGEX = /^[A-Za-zÀ-ÿ'`´\s-]+$/;
export const RUT_REGEX = /^(?:\d{1,2}\.\d{3}\.\d{3}|\d{7,8})-[\dkK]$/;

export const buildProfileValidationSchema = () =>
	Yup.object().shape({
		first_name: Yup.string()
			.required('El primer nombre es requerido')
			.matches(NAME_REGEX, 'El primer nombre solo puede contener letras y espacios'),
		second_name: Yup.string()
			.matches(NAME_REGEX, 'El segundo nombre solo puede contener letras y espacios')
			.nullable(),
		last_name: Yup.string()
			.required('El primer apellido es requerido')
			.matches(NAME_REGEX, 'El primer apellido solo puede contener letras y espacios'),
		second_last_name: Yup.string()
			.matches(NAME_REGEX, 'El segundo apellido solo puede contener letras y espacios')
			.nullable(),
		rut: Yup.string()
			.required('El RUT es requerido')
			.matches(RUT_REGEX, 'El formato del RUT no es valido'),
		phone_number: Yup.string()
			.matches(/^(\+569|569|9)[\d]{8}$/, 'El numero de celular debe tener 9 digitos comenzando con 9')
			.nullable(),
		direccion: Yup.string().max(250, 'La direccion debe tener menos de 250 caracteres').nullable(),
		region: Yup.string().nullable(),
		provincia: Yup.string().nullable(),
		comuna: Yup.string().nullable(),
		fecha_nacimiento: Yup.string()
			.nullable()
			.test('not-in-future', 'La fecha no puede ser futura', (val) => {
				if (!val) return true;
				const d = new Date(val + 'T00:00:00');
				const today = new Date();
				return d.getTime() <= new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
			})
			.test('age-18', 'No puedes ser la wawa Blass aqui mano', (val) => {
				if (!val) return true;
				const d = new Date(val + 'T00:00:00');
				const today = new Date();
				const eighteen = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
				return d.getTime() <= eighteen.getTime();
			}),
	});

