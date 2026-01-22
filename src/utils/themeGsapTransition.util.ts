import gsap from 'gsap';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import classNames from 'classnames';
import pascalcase from 'pascalcase';
import { TDarkMode } from '@/types/darkMode.type';

// Import icon maps directly
import * as SvgIcon from '@/components/icon/svg-icons';
import * as DuoToneIcon from '@/components/icon/duotone';
import * as HeroIcon from '@/components/icon/heroicons';

const TransitionIcon = ({ icon, className }: { icon: string; className?: string }) => {
	const IconName = pascalcase(icon);
	const SvgIconWrapper = (SvgIcon as any)[IconName];
	const DuoToneWrapper = (DuoToneIcon as any)[IconName];
	const HeroWrapper = (HeroIcon as any)[IconName];

	if (typeof SvgIconWrapper === 'function') {
		return createElement(SvgIconWrapper, { className });
	}
	if (typeof DuoToneWrapper === 'function') {
		return createElement(DuoToneWrapper, { className });
	}
	if (typeof HeroWrapper === 'function') {
		return createElement(HeroWrapper, { className });
	}
	return null;
};

const COLORS = {
	TO_LIGHT: '#FDBA74', // Orange-300 (Warm)
	TO_DARK: '#6366F1', // Indigo-500 (Cool)
};

export const runGsapThemeTransition = (
	targetMode: TDarkMode,
	onSwitchTheme: () => void,
) => {
	const existingOverlay = document.getElementById('theme-transition-overlay');
	if (existingOverlay) existingOverlay.remove();

	const isToDark = targetMode === 'dark';
	const overlayColor = isToDark ? COLORS.TO_DARK : COLORS.TO_LIGHT;
	// Use standard icons that likely exist. standard heroicons: 'HeroSun', 'HeroMoon'
    // Or DuoTone: 'DuoSun', 'DuoMoon'
	const iconName = isToDark ? 'HeroMoon' : 'HeroSun';

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
		clipPath: 'circle(0% at 50% 50%)',
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
	
	const iconElement = createElement(TransitionIcon, {
		icon: iconName,
		className: '!text-white w-32 h-32', // Removed drop-shadow-2xl
	});

	root.render(iconElement);

	const tl = gsap.timeline({
		onComplete: () => {
			root.unmount();
			overlay.remove();
		},
	});

	tl.to(overlay, {
		clipPath: 'circle(150% at 50% 50%)',
		duration: 0.6,
		ease: 'power2.inOut',
	})
	.to(contentContainer, {
		opacity: 1,
		scale: 1,
		duration: 0.4,
		ease: 'back.out(1.7)',
	}, '-=0.4')
	
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
