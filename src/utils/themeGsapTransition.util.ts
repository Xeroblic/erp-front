import gsap from 'gsap';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { TDarkMode } from '@/types/darkMode.type';

const TransitionThemeGlyph = ({ isToDark }: { isToDark: boolean }) =>
	createElement(
		'svg',
		{
			viewBox: '0 0 64 64',
			width: 96,
			height: 96,
			'aria-hidden': true,
			focusable: false,
			style: { display: 'block' },
		},
		isToDark
			? createElement('path', {
					d: 'M41 9a23 23 0 1 0 14 40.8A25 25 0 0 1 41 9Z',
					fill: '#fff',
				})
			: createElement(
					'g',
					null,
					createElement('circle', { cx: 32, cy: 32, r: 11, fill: '#fff' }),
					createElement(
						'g',
						{ stroke: '#fff', strokeWidth: 3, strokeLinecap: 'round' },
						createElement('line', { x1: 32, y1: 6, x2: 32, y2: 14 }),
						createElement('line', { x1: 32, y1: 50, x2: 32, y2: 58 }),
						createElement('line', { x1: 6, y1: 32, x2: 14, y2: 32 }),
						createElement('line', { x1: 50, y1: 32, x2: 58, y2: 32 }),
						createElement('line', { x1: 13, y1: 13, x2: 18.5, y2: 18.5 }),
						createElement('line', { x1: 45.5, y1: 45.5, x2: 51, y2: 51 }),
						createElement('line', { x1: 13, y1: 51, x2: 18.5, y2: 45.5 }),
						createElement('line', { x1: 45.5, y1: 18.5, x2: 51, y2: 13 }),
					),
				),
	);

const COLORS = {
	TO_LIGHT: '#FDBA74',
	TO_DARK: '#6366F1', // Indigo-500 (Cool)
};

export const runGsapThemeTransition = (targetMode: TDarkMode, onSwitchTheme: () => void) => {
	if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		onSwitchTheme();
		return;
	}

	const existingOverlay = document.getElementById('theme-transition-overlay');
	if (existingOverlay) existingOverlay.remove();

	const isToDark = targetMode === 'dark';
	const overlayColor = isToDark ? COLORS.TO_DARK : COLORS.TO_LIGHT;
	const radiusPx = Math.ceil(Math.hypot(window.innerWidth, window.innerHeight) / 2);

	const overlay = document.createElement('div');
	overlay.id = 'theme-transition-overlay';
	Object.assign(overlay.style, {
		position: 'fixed', // Fixed for full screen theme transition
		top: '0',
		left: '0',
		width: '100vw',
		height: '100vh',
		zIndex: '9999',
		background: overlayColor,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		pointerEvents: 'all', // Block clicks
		clipPath: 'circle(0px at 50% 50%)',
		willChange: 'clip-path',
		transform: 'translateZ(0)',
	});

	const contentContainer = document.createElement('div');
	Object.assign(contentContainer.style, {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		opacity: '0',
		transform: 'scale(0.5)',
		willChange: 'opacity, transform',
	});
	overlay.appendChild(contentContainer);
	document.body.appendChild(overlay);

	const root = createRoot(contentContainer);

	const iconElement = createElement(TransitionThemeGlyph, { isToDark });

	root.render(iconElement);

	const tl = gsap.timeline({
		overwrite: 'auto',
		onComplete: () => {
			root.unmount();
			overlay.remove();
		},
	});

	tl.to(overlay, {
		clipPath: `circle(${radiusPx}px at 50% 50%)`,
		duration: 0.6,
		ease: 'power2.inOut',
	})
		.to(
			contentContainer,
			{
				opacity: 1,
				scale: 1,
				duration: 0.35,
				ease: 'power2.out',
			},
			'-=0.4',
		)

		.call(onSwitchTheme)

		.to({}, { duration: 0.3 })

		.to(contentContainer, {
			opacity: 0,
			scale: 0.5,
			duration: 0.3,
			ease: 'power2.in',
		})
		.to(overlay, {
			opacity: 0,
			duration: 0.4,
			ease: 'power2.inOut',
		});
};
