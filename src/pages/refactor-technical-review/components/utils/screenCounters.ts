/**
 * Normalización de los contadores de defectos de pantalla (AIO y monitor).
 *
 * Los contadores `dead_pixels_count` y `spots_count` sólo tienen sentido mientras
 * `screen_condition` sea la condición que los habilita. El schema de Yup ya los
 * normaliza con `transform(() => 0)`, pero ese transform sólo corre en el cast del
 * resolver: el autosave lee los valores crudos de react-hook-form y el bypass
 * «No enciende» arma su payload sin pasar por Yup. Por eso la normalización vive
 * aquí y se aplica en cada ruta de escritura.
 *
 * Al cargar un borrador sólo se limpia la dirección inactiva (condición distinta
 * del contador). El valor activo se conserva tal como fue medido, incluso si es 0,
 * para que Yup muestre el error y el técnico ingrese el valor real.
 *
 * El mínimo válido (1) se siembra únicamente cuando el técnico **cambia** a la
 * condición que habilita el contador. Volver a pulsar la tarjeta ya seleccionada no
 * es una medición nueva: el valor conservado (incluido 0) se mantiene intacto.
 */
export const SCREEN_COUNTER_MIN = 1;

/**
 * Siembra incondicional del mínimo. **Privada a propósito:** llamarla desde una
 * sección volvería a convertir un 0 medido en 1 en cada clic. La única puerta
 * pública de siembra es `resolveScreenCounterOnSelection`, que exige que la
 * condición haya cambiado.
 */
const resolveScreenCounter = (isConditionActive: boolean, currentValue: unknown): number => {
	if (!isConditionActive) return 0;

	return typeof currentValue === 'number' && currentValue >= SCREEN_COUNTER_MIN
		? currentValue
		: SCREEN_COUNTER_MIN;
};

/** Valor fiel para render: conserva cualquier número almacenado, incluido 0. */
export const getScreenCounterValue = (currentValue: unknown): number =>
	typeof currentValue === 'number' ? currentValue : 0;

/** `true` sólo cuando un contador inactivo debe limpiarse en RHF. */
export const needsScreenCounterNormalization = (
	isConditionActive: boolean,
	currentValue: unknown,
): boolean => !isConditionActive && currentValue !== 0;

/** `true` cuando un contador activo todavía no alcanza el mínimo exigido. */
export const isScreenCounterBelowMinimum = (currentValue: unknown): boolean =>
	!(typeof currentValue === 'number' && currentValue >= SCREEN_COUNTER_MIN);

/**
 * Valor del contador tras pulsar una tarjeta de condición de pantalla.
 *
 * Criterio compartido por AIO y monitor: el mínimo se siembra sólo si la condición
 * realmente cambia. Si se vuelve a pulsar la condición ya seleccionada, el valor
 * medido se conserva tal cual —un 0 recibido del borrador sigue siendo 0 y su error
 * sigue a la vista— y si la condición del contador queda inactiva, se limpia a 0.
 */
export const resolveScreenCounterOnSelection = <TCondition extends string>(
	previousCondition: TCondition | null | undefined,
	nextCondition: TCondition,
	counterCondition: TCondition,
	currentValue: unknown,
): number => {
	if (nextCondition !== counterCondition) return 0;
	if (previousCondition === nextCondition) return getScreenCounterValue(currentValue);

	return resolveScreenCounter(true, currentValue);
};
