// Los grises acromáticos traen el tono como `none` (`oklch(98.5% 0 none)`).
const OKLCH_PATTERN = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+|none)\s*\)$/i;

const toSrgbChannel = (linear: number): number => {
	const gamma = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
	return Math.round(Math.min(1, Math.max(0, gamma)) * 255);
};

const toHexPair = (channel: number): string => channel.toString(16).padStart(2, '0');

/**
 * Tailwind 4 publica su paleta (`tailwindcss/colors`) en `oklch()`. CSS la entiende, pero
 * las librerías que operan sobre el color en JS (ApexCharts aclara, oscurece y concatena
 * alfa en hexadecimal) sólo aceptan hex o rgb. Este helper convierte un `oklch()` a `#rrggbb`
 * recortando al gamut sRGB, y devuelve sin cambios cualquier otro formato.
 */
const oklchToHex = (color: string): string => {
	const match = OKLCH_PATTERN.exec(color.trim());
	if (!match) return color;

	const [, rawLightness, percent, rawChroma, rawHue] = match;
	const lightness = Number(rawLightness) / (percent ? 100 : 1);
	const chroma = Number(rawChroma);
	const hue = rawHue.toLowerCase() === 'none' ? 0 : (Number(rawHue) * Math.PI) / 180;

	const a = chroma * Math.cos(hue);
	const b = chroma * Math.sin(hue);

	// OKLab → LMS no lineal → LMS lineal → sRGB lineal (matrices de Björn Ottosson).
	const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

	const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
	const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
	const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

	return `#${[red, green, blue].map((channel) => toHexPair(toSrgbChannel(channel))).join('')}`;
};

export default oklchToHex;
