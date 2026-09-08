import type { TDecimalString } from '@/interface/procurement.interface';

/**
 * Aritmética de los importes del contrato de abastecimiento (PR #67).
 *
 * El contrato transporta los importes como strings decimales de dos decimales y
 * exige redondeo half-up a 2. Convertirlos a `number` para operar reintroduce el
 * error binario que el contrato evita (`0.1 + 0.2`), así que todo el cálculo se
 * hace sobre enteros `bigint` en centésimas y solo se vuelve a string al final.
 *
 * Nada de este módulo es fuente de verdad: el backend calcula y persiste el IVA.
 * Sirve para previsualizar y para formatear lo que el servidor ya devolvió.
 */

/** Decimales con los que viajan los importes del contrato. */
export const DECIMAL_SCALE = 2;

const SCALE_FACTOR = 100n;

const DECIMAL_STRING_PATTERN = /^-?\d+(\.\d+)?$/;

/**
 * Convierte un string decimal del contrato a centésimas exactas.
 * Devuelve `null` si el valor no es un decimal reconocible, para que quien
 * llame trate el importe como desconocido en lugar de asumir cero.
 */
export const parseDecimalString = (value: string | null | undefined): bigint | null => {
	if (typeof value !== 'string') return null;

	const trimmed = value.trim();
	if (!DECIMAL_STRING_PATTERN.test(trimmed)) return null;

	const isNegative = trimmed.startsWith('-');
	const unsigned = isNegative ? trimmed.slice(1) : trimmed;
	const [integerPart, fractionPart = ''] = unsigned.split('.');

	// Se trunca lo que exceda la escala del contrato en vez de redondear: un
	// importe con más decimales de los pactados es un dato fuera de contrato, no
	// un cálculo que corresponda ajustar acá.
	const normalizedFraction = fractionPart.padEnd(DECIMAL_SCALE, '0').slice(0, DECIMAL_SCALE);
	const magnitude = BigInt(`${integerPart}${normalizedFraction}`);

	return isNegative ? -magnitude : magnitude;
};

/** Formatea centésimas exactas como string decimal del contrato (`"5712.00"`). */
export const formatDecimalCents = (cents: bigint): TDecimalString => {
	const isNegative = cents < 0n;
	const magnitude = isNegative ? -cents : cents;
	const integerPart = magnitude / SCALE_FACTOR;
	const fractionPart = (magnitude % SCALE_FACTOR).toString().padStart(DECIMAL_SCALE, '0');

	return `${isNegative ? '-' : ''}${integerPart.toString()}.${fractionPart}`;
};

/**
 * División entera con redondeo half-up, el que exige el contrato para derivar
 * IVA y neto. `denominator` debe ser positivo.
 */
export const divideRoundHalfUp = (numerator: bigint, denominator: bigint): bigint => {
	if (denominator <= 0n) {
		throw new Error('divideRoundHalfUp requiere un denominador positivo');
	}

	const isNegative = numerator < 0n;
	const magnitude = isNegative ? -numerator : numerator;
	// half-up sobre magnitudes: (2n + d) / 2d equivale a floor(n/d + 0.5).
	const rounded = (2n * magnitude + denominator) / (2n * denominator);

	return isNegative ? -rounded : rounded;
};

const GROUP_SEPARATOR = '.';
const DECIMAL_SEPARATOR = ',';

const groupIntegerDigits = (digits: string): string =>
	digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);

/**
 * Presenta un string decimal del contrato en formato es-CL (`"$5.712,00"`) sin
 * pasar por `number`. Devuelve `null` cuando el importe no es representable —
 * un costo desconocido se muestra como desconocido, nunca como `$0`.
 */
export const formatDecimalAmount = (
	value: string | null | undefined,
	currencyCode: string | null | undefined = 'CLP',
): string | null => {
	const cents = parseDecimalString(value);
	if (cents === null) return null;

	const isNegative = cents < 0n;
	const magnitude = isNegative ? -cents : cents;
	const integerDigits = (magnitude / SCALE_FACTOR).toString();
	const fractionDigits = (magnitude % SCALE_FACTOR).toString().padStart(DECIMAL_SCALE, '0');
	const symbol = currencyCode === 'CLP' || !currencyCode ? '$' : `${currencyCode} `;

	return `${isNegative ? '-' : ''}${symbol}${groupIntegerDigits(integerDigits)}${DECIMAL_SEPARATOR}${fractionDigits}`;
};
