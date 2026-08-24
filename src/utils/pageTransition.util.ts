import gsap from 'gsap';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';

let isManualTransitioning = false;
let currentTl: gsap.core.Timeline | null = null;
let currentRoot: any = null;
let currentTransitionType: 'manual' | 'auto' | null = null;

const TransitionGlyph = ({ name }: { name?: string }) => {
	if (!name) return null;

	if (name === 'HeroTicket') {
		return createElement(
			'svg',
			{ viewBox: '0 0 64 64', width: 92, height: 92, ariaHidden: true, focusable: false },
			createElement('path', {
				d: 'M9 24a6 6 0 0 0 6-6h34a6 6 0 0 0 6 6v16a6 6 0 0 0-6 6H15a6 6 0 0 0-6-6V24Zm19 2v12m8-12v12',
				fill: 'none',
				stroke: '#fff',
				strokeWidth: 3,
				strokeLinecap: 'round',
				strokeLinejoin: 'round',
			}),
		);
	}

	if (name === 'HeroSparkles') {
		return createElement(
			'svg',
			{ viewBox: '0 0 64 64', width: 92, height: 92, ariaHidden: true, focusable: false },
			createElement('path', {
				d: 'M32 10l4.5 11.5L48 26l-11.5 4.5L32 42l-4.5-11.5L16 26l11.5-4.5L32 10Zm17 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5ZM15 37l2.2 5.8L23 45l-5.8 2.2L15 53l-2.2-5.8L7 45l5.8-2.2L15 37Z',
				fill: '#fff',
			}),
		);
	}

	return null;
};

export const runPageTransition = (
	onNavigate: () => void,
	textContent: string = 'Zentria ERP',
	iconName?: string,
	containerId: string = 'page-transition-overlay',
	type: 'manual' | 'auto' = 'auto',
) => {
	if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		onNavigate();
		return;
	}

	// Prevent 'auto' transitions (router) from interrupting a 'manual' one (user action)
	if (type === 'auto' && isManualTransitioning) {
		return;
	}

	// If starting a new manual transition, set the flag
	if (type === 'manual') {
		isManualTransitioning = true;
	}

	// Cleanup previous transition if valid to overwrite
	if (currentTl) {
		currentTl.kill();
		currentTl = null;
	}
	if (currentTransitionType === 'manual') {
		isManualTransitioning = false;
	}
	currentTransitionType = type;
	if (currentRoot) {
		currentRoot.unmount();
		currentRoot = null;
	}
	const existingOverlay = document.getElementById('active-page-transition');
	if (existingOverlay) existingOverlay.remove();

	// 1. Target Container
	let container = document.getElementById(containerId);
	let isScoped = true;

	if (!container && containerId === 'page-transition-overlay') {
		container = document.body;
		isScoped = false;
	} else if (!container) {
		container = document.body;
		isScoped = false;
	}

	// 2. Theme Colors
	const rootStyle = getComputedStyle(document.documentElement);
	const colorStart = rootStyle.getPropertyValue('--color-primary-400').trim() || '#f97316';
	const colorEnd = rootStyle.getPropertyValue('--color-primary-600').trim() || '#db2777';
	const radiusPx = Math.ceil(Math.hypot(container.clientWidth, container.clientHeight) / 2);

	// 3. Create Overlay
	const overlay = document.createElement('div');
	overlay.id = 'active-page-transition';
	Object.assign(overlay.style, {
		position: isScoped ? 'absolute' : 'fixed',
		top: '0',
		left: '0',
		width: '100%',
		height: '100%',
		zIndex: '50',
		pointerEvents: 'all',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: `linear-gradient(135deg, ${colorStart}, ${colorEnd})`,
		clipPath: 'circle(0px at 50% 50%)',
		willChange: 'clip-path', // Hint browser to optimize clip-path
		transform: 'translateZ(0)', // Force GPU layer
	});

	// Create a content container for React
	const contentContainer = document.createElement('div');
	Object.assign(contentContainer.style, {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '1rem',
		opacity: '0',
		transform: 'scale(0.8)',
		width: '100%',
		height: '100%',
		willChange: 'opacity, transform', // Optimize content animation
	});
	overlay.appendChild(contentContainer);

	container.appendChild(overlay);

	if (isScoped && getComputedStyle(container).position === 'static') {
		container.style.position = 'relative';
	}

	// 4. Render React Content
	const root = createRoot(contentContainer);
	currentRoot = root;

	const iconElement = iconName ? createElement(TransitionGlyph, { name: iconName }) : null;

	const textElement = createElement(
		'div',
		{
			style: {
				color: '#fff',
				fontSize: '2.5rem',
				fontWeight: 'bold',
				fontFamily: 'system-ui, sans-serif',
				// Text shadow is cheaper than SVG drop-shadow filter
				textShadow: '0 2px 4px rgba(0,0,0,0.2)',
				textAlign: 'center',
			},
		},
		textContent,
	);

	// Static container: avoid endless CSS animation loop
	root.render(
		createElement(
			'div',
			{
				className: 'flex flex-col items-center justify-center',
			},
			iconElement,
			textElement,
		),
	);

	// 5. Animation Sequence
	const tl = gsap.timeline({
		overwrite: 'auto',
		onComplete: () => {
			if (currentRoot === root) {
				root.unmount();
				currentRoot = null;
			}
			overlay.remove();

			// If this was a manual transition, release the lock
			if (type === 'manual') {
				isManualTransitioning = false;
			}
			currentTransitionType = null;
			currentTl = null;
		},
	});
	currentTl = tl;

	// Expand Circle to Cover
	tl.to(overlay, {
		clipPath: `circle(${radiusPx}px at 50% 50%)`,
		duration: 0.5,
		ease: 'power2.inOut',
	})
		// Show Content
		.to(
			contentContainer,
			{
				opacity: 1,
				scale: 1,
				duration: 0.4,
				ease: 'back.out(1.5)',
			},
			'-=0.2',
		)

		// Navigate
		.call(onNavigate)

		.to({}, { duration: 0.5 })

		// Fade Out Content
		.to(contentContainer, {
			opacity: 0,
			y: -20,
			duration: 0.3,
		})
		// Fade Out Overlay
		.to(overlay, {
			opacity: 0,
			duration: 0.4,
			ease: 'power2.inOut',
		});
};
