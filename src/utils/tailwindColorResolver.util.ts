import colors from 'tailwindcss/colors';
import { TAllColors } from '../types/colors.type';
import { TColorIntensity } from '../types/colorIntensities.type';

type TColorPalette = Record<string, string>;

const flatColorMap: Record<string, string> = {
    inherit: 'inherit',
    current: 'currentColor',
    transparent: 'transparent',
    black: '#000000',
    white: '#ffffff',
};

const clampAlpha = (alpha: number) => Math.max(0, Math.min(1, alpha));

const hexToRgba = (hex: string, alpha: number) => {
    const raw = hex.replace('#', '');
    const normalized =
        raw.length === 3
            ? raw
                .split('')
                .map((char) => `${char}${char}`)
                .join('')
            : raw;

    if (normalized.length !== 6) return hex;

    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);

    if ([r, g, b].some((value) => Number.isNaN(value))) return hex;

    return `rgba(${r}, ${g}, ${b}, ${clampAlpha(alpha)})`;
};

export const resolveTailwindColor = (
    color: TAllColors | undefined,
    shade: TColorIntensity | undefined,
) => {
    if (!color) return undefined;

    if (flatColorMap[color]) return flatColorMap[color];

    const palette = (colors as unknown as Record<string, string | TColorPalette>)[color];
    if (!palette) return undefined;

    if (typeof palette === 'string') return palette;

    const shadeKey = shade ?? '500';
    return palette[shadeKey] ?? palette['500'] ?? undefined;
};

export const resolveTailwindColorAlpha = (
    color: TAllColors | undefined,
    shade: TColorIntensity | undefined,
    alpha: number,
) => {
    const baseColor = resolveTailwindColor(color, shade);
    if (!baseColor) return undefined;

    if (baseColor === 'transparent' || baseColor === 'inherit' || baseColor === 'currentColor') {
        return baseColor;
    }

    if (baseColor.startsWith('#')) return hexToRgba(baseColor, alpha);

    if (baseColor.startsWith('rgb(')) {
        const rgb = baseColor.slice(4, -1);
        return `rgba(${rgb}, ${clampAlpha(alpha)})`;
    }

    if (baseColor.startsWith('rgba(')) return baseColor;

    return baseColor;
};