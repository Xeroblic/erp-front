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
 * El mínimo válido (1) se siembra únicamente al seleccionar explícitamente la
 * condición, que es una acción del técnico.
 */
export const SCREEN_COUNTER_MIN = 1;

export const resolveScreenCounter = (isConditionActive: boolean, currentValue: unknown): number => {
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
