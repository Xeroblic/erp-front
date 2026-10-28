/**
 * Texto de un valor primitivo (`string`, `number`, `boolean` o `bigint`). Para objetos,
 * `null`, `undefined` y el resto devuelve `fallback`, en vez del «[object Object]» que
 * daría `String()`.
 */
const toText = (value: unknown, fallback = ''): string => {
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
		return String(value);
	}
	return fallback;
};

export default toText;
