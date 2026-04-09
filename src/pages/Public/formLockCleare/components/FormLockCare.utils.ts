import ramDerecha from '../vectores/ramderecha.svg';
import ramHorizontal from '../vectores/ramhorizontal.svg';
import ramIzquierda from '../vectores/ramizquierda.svg';
import pcDerecha from '../vectores/pc-derecha.svg';
import pcHorizontal from '../vectores/pc-horizontal.svg';
import pcIzquierda from '../vectores/pc-izquierda.svg';
import { FloatingOrnament } from './FormLockCare.types';

const ramAssets = [ramDerecha, ramHorizontal, ramIzquierda] as const;
const pcAssets = [pcDerecha, pcHorizontal, pcIzquierda] as const;
const vectorAssets = [...ramAssets, ...pcAssets] as const;

const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

const pickFrom = <T,>(items: readonly T[], seed: number): T =>
    items[Math.floor(seededRandom(seed) * items.length)];

const clampValue = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const ornamentAnchors = [
    { left: 10, top: 14 },
    { left: 20, top: 22 },
    { left: 12, top: 48 },
    { left: 16, top: 70 },
    { left: 28, top: 84 },
    { left: 72, top: 84 },
    { left: 86, top: 68 },
    { left: 90, top: 48 },
    { left: 82, top: 24 },
    { left: 88, top: 14 },
    { left: 50, top: 10 },
    { left: 50, top: 88 },
    { left: 6, top: 30 },
    { left: 6, top: 58 },
    { left: 94, top: 32 },
    { left: 94, top: 60 },
    { left: 30, top: 8 },
    { left: 70, top: 8 },
    { left: 32, top: 92 },
    { left: 68, top: 92 },
    { left: 14, top: 84 },
    { left: 86, top: 84 },
    { left: 22, top: 40 },
    { left: 78, top: 40 },
] as const;

export const buildFloatingOrnaments = (): FloatingOrnament[] => {
    const animationPool = [
        'animate-[spin_32s_linear_infinite]',
        'animate-[bounce_12s_ease-in-out_infinite]',
        'animate-[pulse_5.2s_ease-in-out_infinite]',
    ] as const;
    const repeatsPerAsset = 4;
    const assetInstances = vectorAssets.flatMap((assetPath) =>
        Array.from({ length: repeatsPerAsset }, (_, repeatIndex) => ({
            assetPath,
            repeatIndex,
        })),
    );

    return assetInstances.map((instance, index) => {
        const seedBase = (index + 1) * 7.31;
        const anchor = ornamentAnchors[index % ornamentAnchors.length];
        const jitterX = (seededRandom(seedBase + 11) - 0.5) * 9;
        const jitterY = (seededRandom(seedBase + 12) - 0.5) * 8;
        let left = anchor.left + jitterX;
        let top = anchor.top + jitterY;

        if (left > 32 && left < 68 && top > 20 && top < 82) {
            left = left < 50 ? left - 16 : left + 16;
        }

        const size =
            instance.repeatIndex === 0
                ? 120 + Math.round(seededRandom(seedBase + 8) * 20)
                : instance.repeatIndex === 1
                    ? 92 + Math.round(seededRandom(seedBase + 9) * 16)
                    : instance.repeatIndex === 2
                        ? 72 + Math.round(seededRandom(seedBase + 10) * 14)
                        : 58 + Math.round(seededRandom(seedBase + 13) * 12);

        const rotateDeg = Math.round((seededRandom(seedBase + 14) - 0.5) * 42);

        return {
            id: `ornament-${index + 1}-${instance.repeatIndex}`,
            assetPath: instance.assetPath,
            left: clampValue(left, 2, 96),
            top: clampValue(top, 2, 92),
            rotateDeg,
            size,
            opacity: instance.repeatIndex === 0 ? 0.2 : 0.14 + seededRandom(seedBase + 4) * 0.16,
            animationClassName: pickFrom(animationPool, seedBase + 5),
            animationDelay: Number((seededRandom(seedBase + 6) * 2.2).toFixed(2)),
        };
    });
};
