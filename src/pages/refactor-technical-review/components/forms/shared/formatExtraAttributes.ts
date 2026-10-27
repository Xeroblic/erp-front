/** Texto editable de `extra_attributes`: se guarda como texto, pero puede llegar como objeto. */
const formatExtraAttributes = (value: unknown): string => {
	if (typeof value === 'string') return value;
	if (!value) return '';
	return JSON.stringify(value, null, 2);
};

export default formatExtraAttributes;
