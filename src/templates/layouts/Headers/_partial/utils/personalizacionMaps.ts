import DARK_MODE from '../../../../../constants/darkMode.constant';
import { TDarkMode } from '@/types/darkMode.type';
import { TColors } from '@/types/colors.type';
import { TColorIntensity } from '@/types/colorIntensities.type';


// Mapeo CONSISTENTE con la API: 1=LIGHT, 2=DARK, 3=SYSTEM
export const apiToDark = (n?: number): TDarkMode => {
    switch (n) {
        case 1:
            return DARK_MODE.LIGHT;
        case 2:
            return DARK_MODE.DARK;
        case 3:
            return DARK_MODE.SYSTEM;
        default:
            return DARK_MODE.SYSTEM;
    }
};

export const tDarkToApi = (m: TDarkMode): number => {
    if (m === DARK_MODE.LIGHT) return 1;
    if (m === DARK_MODE.DARK) return 2;
    return 3; // SYSTEM
};

const VALID_COLORS: readonly string[] = [
    'zinc', 'gray', 'red', 'amber', 'lime', 'emerald', 'sky', 'blue', 'violet'
];

export const isTcolor = (v: any): v is TColors => typeof v === 'string' && VALID_COLORS.includes(v);

const VALID_SHADES: readonly string[] = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

export const isTIntensity = (v: any): v is TColorIntensity => (typeof v === 'string' || typeof v === 'number') && VALID_SHADES.includes(String(v));
