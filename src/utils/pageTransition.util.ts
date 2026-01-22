import gsap from 'gsap';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import pascalcase from 'pascalcase';

// Import icon maps directly to bypass Redux dependency in Icon component
import * as SvgIcon from '@/components/icon/svg-icons';
import * as DuoToneIcon from '@/components/icon/duotone';
import * as HeroIcon from '@/components/icon/heroicons';

let isManualTransitioning = false;
let currentTl: gsap.core.Timeline | null = null;
let currentRoot: any = null; 

// Simplified Icon component that doesn't use Redux hooks
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

export const runPageTransition = (
	onNavigate: () => void,
	textContent: string = 'Zentria ERP',
	iconName?: string,
	containerId: string = 'page-transition-overlay',
	type: 'manual' | 'auto' = 'auto'
) => {
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
		clipPath: 'circle(0% at 50% 50%)',
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
	});
	overlay.appendChild(contentContainer);

	container.appendChild(overlay);
    
    if (isScoped && getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }

	// 4. Render React Content
	const root = createRoot(contentContainer);
	currentRoot = root;
	
	const iconElement = iconName 
		? createElement(TransitionIcon, { 
			icon: iconName, 
			className: '!text-white text-9xl drop-shadow-xl mb-4',
		}) 
		: null;

	const textElement = createElement('div', {
		style: {
			color: '#fff',
			fontSize: '2.5rem',
			fontWeight: 'bold',
			fontFamily: 'system-ui, sans-serif',
			textShadow: '0 4px 12px rgba(0,0,0,0.2)',
			textAlign: 'center'
		}
	}, textContent);

    // Pulse animation container
	root.render(createElement('div', { 
		className: 'flex flex-col items-center justify-center animate-pulse',
        style: { animationDuration: '2s' }
	}, iconElement, textElement));


	// 5. Animation Sequence
	const tl = gsap.timeline({
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
			currentTl = null;
		},
	});
	currentTl = tl;

    // Expand Circle to Cover
	tl.to(overlay, {
		clipPath: 'circle(150% at 50% 50%)',
		duration: 0.5, 
		ease: 'power2.inOut',
	})
    // Show Content
	.to(contentContainer, {
		opacity: 1,
		scale: 1,
		duration: 0.4,
		ease: 'back.out(1.5)',
	}, '-=0.2')
    
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
