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
 * Al activar la condición se siembra el mínimo válido (1) porque el schema exige
 * `min(1)`: dejar el contador en 0 o sin valor mostraría un control aparentemente
 * válido que bloquea el avance de la sección.
 */
export const SCREEN_COUNTER_MIN = 1;

export const resolveScreenCounter = (isConditionActive: boolean, currentValue: unknown): number => {
	if (!isConditionActive) return 0;

	return typeof currentValue === 'number' && currentValue >= SCREEN_COUNTER_MIN
		? currentValue
		: SCREEN_COUNTER_MIN;
};

/** `true` cuando el valor crudo de RHF no coincide con lo que exige la condición actual. */
export const needsScreenCounterNormalization = (
	isConditionActive: boolean,
	currentValue: unknown,
): boolean => resolveScreenCounter(isConditionActive, currentValue) !== currentValue;
