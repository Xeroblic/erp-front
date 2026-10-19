/** Objeto plano (no `null` ni arreglo): la guarda para leer cuerpos `unknown` del backend. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export default isRecord;
