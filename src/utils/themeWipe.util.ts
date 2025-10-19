export type TWipeCorner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

/**
 * Ejecuta un efecto radial (clip-path) que se encoge desde una esquina,
 * pintando con el color de fondo anterior y revelando el nuevo tema.
 * - Respeta prefers-reduced-motion
 * - Se autolimpia al finalizar la transición
 */
export function runThemeWipe(
  corner: TWipeCorner = 'top-right',
  duration = 900,
  backgroundColor?: string,
) {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const prevBg = backgroundColor
      || getComputedStyle(document.body).backgroundColor
      || getComputedStyle(document.documentElement).backgroundColor
      || '#fff';

    const overlay = document.createElement('div');
    overlay.className = 'theme-wipe-overlay';
    overlay.style.setProperty('--theme-wipe-bg', prevBg);
    overlay.style.setProperty('--wipe-duration', `${duration}ms`);
    // Radio y easing configurables por CSS vars
    overlay.style.setProperty('--wipe-radius', '220vmax');
    overlay.style.setProperty('--wipe-easing', 'cubic-bezier(.4,0,.2,1)');

    let x = '100%';
    let y = '0%';
    if (corner === 'top-left') { x = '0%'; y = '0%'; }
    if (corner === 'bottom-right') { x = '100%'; y = '100%'; }
    if (corner === 'bottom-left') { x = '0%'; y = '100%'; }
    overlay.style.setProperty('--wipe-x', x);
    overlay.style.setProperty('--wipe-y', y);

    document.body.appendChild(overlay);
    // doble rAF asegura composición antes de animar (evita tirones)
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('animate')));
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  } catch {
    // no-op
  }
}

// Helper opcional: escoger esquina según el modo
import DARK_MODE from '@/constants/darkMode.constant';
import { TDarkMode } from '@/types/darkMode.type';

export function cornerForThemeMode(mode: TDarkMode): TWipeCorner {
  const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (mode === DARK_MODE.DARK) return 'bottom-left';
  if (mode === DARK_MODE.LIGHT) return 'top-right';
  return sysDark ? 'bottom-left' : 'top-right';
}
