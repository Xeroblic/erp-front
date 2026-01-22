import gsap from 'gsap';

/**
 * Handles a page transition effect using a GSAP timeline and SVG morphing (via attr).
 * Effect: A wave fills the screen from bottom to top, then uncovers it.
 */
export const runPageTransition = (onNavigate: () => void) => {
	// 1. Cleanup existing overlay
	const existingOverlay = document.getElementById('page-transition-overlay');
	if (existingOverlay) existingOverlay.remove();

	// Retrieve theme colors from CSS variables set by ThemeContext
	const rootStyle = getComputedStyle(document.documentElement);
	// Use 400 and 600 for a nice gradient effect, or default if not set
	const colorStart = rootStyle.getPropertyValue('--color-primary-400').trim() || 'rgb(255, 135, 9)';
	const colorEnd = rootStyle.getPropertyValue('--color-primary-600').trim() || 'rgb(247, 189, 248)';

	// 2. Define Paths (Top to Bottom)
	// Initial: Flat at top
	const PATH_FLAT = 'M 0 0 V 0 Q 50 0 100 0 V 0 z';
	// Mid: Wave cresting down
	const PATH_MID = 'M 0 0 V 50 Q 50 100 100 50 V 0 z';
	// Full: Filling the screen
	const PATH_FULL = 'M 0 0 V 100 Q 50 100 100 100 V 0 z';

	// 3. Create Overlay Structure
	const overlay = document.createElement('div');
	overlay.id = 'page-transition-overlay';
	Object.assign(overlay.style, {
		position: 'fixed',
		top: '0',
		left: '0',
		width: '100vw',
		height: '100vh',
		zIndex: '10000',
		pointerEvents: 'all',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	});

	// SVG
	// preserveAspectRatio="none" to stretch filling specific dims if needed, or stick to slice
	const svgNamespace = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(svgNamespace, 'svg');
	svg.setAttribute('viewBox', '0 0 100 100');
	svg.setAttribute('preserveAspectRatio', 'none'); // Stretch to fill
	svg.setAttribute('class', 'transition-svg');
	Object.assign(svg.style, {
		position: 'absolute',
		top: '0',
		left: '0',
		width: '100%',
		height: '100%',
		pointerEvents: 'none',
	});

	// Gradient Defs
	const defs = document.createElementNS(svgNamespace, 'defs');
	const gradient = document.createElementNS(svgNamespace, 'linearGradient');
	gradient.setAttribute('id', 'wave-grad');
	gradient.setAttribute('x1', '0');
	gradient.setAttribute('y1', '0');
	gradient.setAttribute('x2', '0'); // Vertical gradient looks better for rising water usually, or diagonal
	gradient.setAttribute('y2', '1');

	const stop1 = document.createElementNS(svgNamespace, 'stop');
	stop1.setAttribute('offset', '0.2');
	stop1.setAttribute('stop-color', colorStart);
	
	const stop2 = document.createElementNS(svgNamespace, 'stop');
	stop2.setAttribute('offset', '0.7');
	stop2.setAttribute('stop-color', colorEnd);

	gradient.appendChild(stop1);
	gradient.appendChild(stop2);
	defs.appendChild(gradient);
	svg.appendChild(defs);

	// Path
	const path = document.createElementNS(svgNamespace, 'path');
	path.setAttribute('class', 'wave-path');
	path.setAttribute('d', PATH_FLAT);
	path.setAttribute('fill', 'url(#wave-grad)');
	path.setAttribute('stroke', 'url(#wave-grad)');
	path.setAttribute('stroke-width', '2px');
	// vector-effect="non-scaling-stroke" not purely native property style in all TS defs, set via attribute
	path.setAttribute('vector-effect', 'non-scaling-stroke');

	svg.appendChild(path);
	overlay.appendChild(svg);

	// Text
	const text = document.createElement('div');
	text.innerText = 'Revisiones por lotes';
	Object.assign(text.style, {
		position: 'relative',
		zIndex: '10',
		color: '#fffce1',
		fontSize: '2rem',
		fontWeight: 'bold',
		fontFamily: 'sans-serif',
		opacity: '0', // Start hidden
		transform: 'translateY(20px)',
	});
	overlay.appendChild(text);

	document.body.appendChild(overlay);

	// 4. Animation Sequence
	const tl = gsap.timeline({
		onComplete: () => {
			overlay.remove();
		},
	});

	// Note: We animate the 'd' attribute directly. 
	// GSAP Plugin 'AttrPlugin' is included in core, so 'attr: { d: ... }' works.

	// Step 1: Rise UP (Flat -> Mid -> Full)
	tl.to(path, {
		attr: { d: PATH_MID },
		duration: 0.4,
		ease: 'power2.in',
	})
	.to(path, {
		attr: { d: PATH_FULL },
		duration: 0.4,
		ease: 'power2.out',
	})
	
	// Show Text when mostly full
	.to(text, {
		opacity: 1,
		y: 0,
		duration: 0.3,
		ease: 'back.out',
	}, '-=0.4')

	// Step 2: Navigate
	.call(onNavigate)
	
	// Wait a moment for effect
	.to({}, { duration: 0.5 }) 

	// Step 3: Hide Text
	.to(text, {
		opacity: 0,
		y: -20,
		duration: 0.3,
	})

	// Step 4: Fall DOWN (Reverse logic: Full -> Mid -> Flat)
	// Actually, usually easier to just fade out or move up out of view? 
	// The user snippet did `.reverse()`. Let's morph back down.
	.to(path, {
		attr: { d: PATH_MID },
		duration: 0.4,
		ease: 'power2.in',
	})
	.to(path, {
		attr: { d: PATH_FLAT },
		duration: 0.4,
		ease: 'power2.out',
	});
};
