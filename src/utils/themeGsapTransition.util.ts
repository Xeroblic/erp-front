import gsap from 'gsap';
import { TDarkMode } from '@/types/darkMode.type';

const COLORS = {
	TO_LIGHT: '#F4E9D7',
	TO_DARK: '#1E1E1E', 
};


const ICONS = {
	SUN: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41-1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
	MOON: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
};

export const runGsapThemeTransition = (
	targetMode: TDarkMode,
	onSwitchTheme: () => void,
) => {
	const existingOverlay = document.getElementById('theme-transition-overlay');
	if (existingOverlay) existingOverlay.remove();

	const isToDark = targetMode === 'dark';
	const overlayColor = isToDark ? COLORS.TO_DARK : COLORS.TO_LIGHT;
	const iconSvg = isToDark ? ICONS.MOON : ICONS.SUN;

	const overlay = document.createElement('div');
	overlay.id = 'theme-transition-overlay';
	Object.assign(overlay.style, {
		position: 'fixed',
		top: '0',
		left: '0',
		width: '100vw',
		height: '100vh',
		zIndex: '9999',
		backgroundColor: overlayColor,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		pointerEvents: 'none',
		clipPath: 'circle(0% at 0% 0%)',
	});

	const iconContainer = document.createElement('div');
	iconContainer.innerHTML = iconSvg;
	Object.assign(iconContainer.style, {
		opacity: '0',
		transform: 'scale(0.5)',
	});

	overlay.appendChild(iconContainer);
	document.body.appendChild(overlay);

	const tl = gsap.timeline({
		onComplete: () => {
			overlay.remove();
		},
	});

	tl.to(overlay, {
		clipPath: 'circle(150% at 0% 0%)',
		duration: 0.8,
		ease: 'power2.inOut',
	})
		.to(
			iconContainer,
			{
				opacity: 1,
				scale: 1.5,
				duration: 0.5,
				ease: 'back.out(1.7)',
			},
			'<0.2',
		)
		.call(onSwitchTheme)
		
		.to(overlay, {
			opacity: 0,
			duration: 0.5,
			ease: 'power1.out',
			delay: 0.2,
		});
};
