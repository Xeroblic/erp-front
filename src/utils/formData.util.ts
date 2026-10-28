/**
 * Texto de un campo de `FormData`. `formData.get` devuelve `string | File | null`, y
 * convertir un `File` con `String()` daría «[object File]»: los archivos y los campos
 * ausentes devuelven una cadena vacía.
 */
const getFormDataText = (formData: FormData, name: string): string => {
	const value = formData.get(name);
	return typeof value === 'string' ? value : '';
};

export default getFormDataText;
