// Helper opcional: escoger esquina según el modo
import DARK_MODE from '@/constants/darkMode.constant';
import { TDarkMode } from '@/types/darkMode.type';

export type TWipeCorner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/**
 * Ejecuta un efecto radial (clip-path) que se encoge desde una esquina,
 * pintando con el color de fondo anterior y revelando el nuevo tema.
 * - Respeta prefers-reduced-motion
 * - Se autolimpia al finalizar la transición
 */
export function runThemeWipe(
	corner: TWipeCorner = 'top-right',
	duration = 420,
	backgroundColor?: string,
) {
	try {
		if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
			return;

		const readBackground = (el?: Element | null) => {
			if (!el) return '';
			const color = getComputedStyle(el).backgroundColor;
			if (!color || color === 'rgba(0, 0, 0, 0)' || color === 'transparent') return '';
			return color;
		};

		const root = document.documentElement;
		const fallbackBg = root.classList.contains('dark') ? '#09090b' : '#f4f4f5';

		const prevBg =
			backgroundColor || readBackground(document.body) || readBackground(root) || fallbackBg;

		document.querySelectorAll('.theme-wipe-overlay').forEach((node) => node.remove());

		const overlay = document.createElement('div');
		overlay.className = 'theme-wipe-overlay';
		overlay.style.setProperty('--theme-wipe-bg', prevBg);
		overlay.style.setProperty('--wipe-duration', `${duration}ms`);
		// Radio y easing configurables por CSS vars
		overlay.style.setProperty('--wipe-radius', '200vmax');
		overlay.style.setProperty('--wipe-easing', 'cubic-bezier(0.22,0.61,0.36,1)');

		let x = '100%';
		let y = '0%';
		if (corner === 'top-left') {
			x = '0%';
			y = '0%';
		}
		if (corner === 'bottom-right') {
			x = '100%';
			y = '100%';
		}
		if (corner === 'bottom-left') {
			x = '0%';
			y = '100%';
		}
		overlay.style.setProperty('--wipe-x', x);
		overlay.style.setProperty('--wipe-y', y);

		document.body.appendChild(overlay);
		// doble rAF asegura composición antes de animar (evita tirones)
		requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('animate')));
		const removeOverlay = () => overlay.remove();
		overlay.addEventListener('transitionend', removeOverlay, { once: true });
		overlay.addEventListener('transitioncancel', removeOverlay, { once: true });
	} catch {
		// no-op
	}
}

export function cornerForThemeMode(mode: TDarkMode): TWipeCorner {
	const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	if (mode === DARK_MODE.DARK) return 'bottom-left';
	if (mode === DARK_MODE.LIGHT) return 'top-right';
	return sysDark ? 'bottom-left' : 'top-right';
}
