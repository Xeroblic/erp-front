import type { TDecimalString } from '@/interface/procurement.interface';

/**
 * Los importes viajan como strings con dos decimales. Se opera en centésimas
 * `bigint` porque pasar por `number` reintroduce el error binario (`0.1 + 0.2`).
 */

const DECIMAL_SCALE = 2;

const SCALE_FACTOR = 100n;

const DECIMAL_STRING_PATTERN = /^-?\d+(\.\d+)?$/;

/** `null` ante un valor no decimal, para que se trate como desconocido y no como cero. */
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

/** Centésimas a string del contrato (`"5712.00"`). */
export const formatDecimalCents = (cents: bigint): TDecimalString => {
	const isNegative = cents < 0n;
	const magnitude = isNegative ? -cents : cents;
	const integerPart = magnitude / SCALE_FACTOR;
	const fractionPart = (magnitude % SCALE_FACTOR).toString().padStart(DECIMAL_SCALE, '0');

	return `${isNegative ? '-' : ''}${integerPart.toString()}.${fractionPart}`;
};

/** Half-up, el redondeo que exige el contrato. `denominator` debe ser positivo. */
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

/** Formato es-CL (`"$5.712,00"`); `null` si no es representable, para no mostrar `$0`. */
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

/**
 * `"$1.234,5"` → `"1234,5"`. En es-CL el punto es separador de miles y se
 * descarta; la coma es la única marca decimal.
 */
export const parsePesoInput = (value: string): string => {
	const cleaned = value.replace(/[^\d,]/g, '');
	const commaIndex = cleaned.indexOf(',');
	if (commaIndex === -1) return cleaned;

	const integerPart = cleaned.slice(0, commaIndex);
	const fractionPart = cleaned
		.slice(commaIndex + 1)
		.replace(/,/g, '')
		.slice(0, DECIMAL_SCALE);

	return `${integerPart},${fractionPart}`;
};

/**
 * `"1234,5"` → `"$1.234,5"`. Acepta también el string del contrato (`"5712.00"`)
 * que llega al editar. No completa decimales para no pelear con el tipeo.
 */
export const formatPesoInput = (value: string): string => {
	const trimmed = value.trim();
	if (trimmed === '') return '';

	const [integerPart = '', fractionPart] = trimmed.split(/[.,]/);
	const integerDigits = integerPart.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
	const grouped = groupIntegerDigits(integerDigits === '' ? '0' : integerDigits);

	return fractionPart === undefined
		? `$${grouped}`
		: `$${grouped}${DECIMAL_SEPARATOR}${fractionPart.replace(/\D/g, '')}`;
};
