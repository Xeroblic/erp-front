import React from 'react';
import { FloatingOrnament } from './FormLockCare.types';

interface FormLockCareDecorationsProps {
	ornaments: FloatingOrnament[];
	showEnhancedEffects?: boolean;
}

const FormLockCareDecorations: React.FC<FormLockCareDecorationsProps> = ({
	ornaments,
	showEnhancedEffects = true,
}) => {
	return (
		<>
			{showEnhancedEffects && (
				<div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#000_1px,_transparent_1px)] opacity-[0.06] mix-blend-overlay [background-size:18px_18px]' />
			)}
			<div className='pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/30 to-transparent' />

			{showEnhancedEffects && (
				<>
					<div className='pointer-events-none absolute left-[-120px] top-1/2 hidden -translate-y-1/2 lg:block'>
						<svg
							viewBox='0 0 200 200'
							className='h-[360px] w-[360px] animate-[bounce_10s_ease-in-out_infinite] opacity-40 blur-[1px]'>
							<path
								fill='#047857'
								d='M45.4,-64.6C59.7,-56.7,72.9,-45.2,77.7,-31.1C82.5,-17,78.8,-0.3,72.9,14.7C67,29.8,58.9,43.1,47.5,53.4C36.1,63.8,21.3,71.3,5.5,73.4C-10.3,75.5,-27.2,72.2,-41.2,63.7C-55.3,55.2,-66.5,41.5,-71.9,26.1C-77.3,10.6,-76.8,-6.6,-72.4,-22.7C-68,-38.8,-59.6,-53.9,-46.6,-62.3C-33.7,-70.7,-16.8,-72.3,-0.6,-71.4C15.6,-70.5,31.2,-67.1,45.4,-64.6Z'
								transform='translate(100 100)'
							/>r
						</svg>
					</div>

					<div className='pointer-events-none absolute right-[-120px] top-1/2 hidden -translate-y-1/2 lg:block'>
						<svg
							viewBox='0 0 200 200'
							className='h-[390px] w-[390px] animate-[bounce_12s_ease-in-out_infinite] opacity-35 blur-[1px] [animation-delay:1.2s]'>
							<path
								fill='#065f46'
								d='M40.2,-67.4C52.7,-62.6,64,-52.8,72.3,-40.3C80.6,-27.8,85.9,-12.7,84.9,2C83.9,16.7,76.5,31,67.1,43.6C57.7,56.1,46.3,66.9,32.7,72.2C19.1,77.4,3.2,77.1,-12.5,74.8C-28.3,72.6,-43.8,68.3,-56.2,59.3C-68.6,50.3,-78,36.6,-81.4,21.5C-84.8,6.3,-82.2,-10.3,-75.8,-24.9C-69.3,-39.5,-59,-52,-45.9,-57.4C-32.9,-62.8,-16.4,-61.2,-1,-59.5C14.4,-57.8,28.9,-56.1,40.2,-67.4Z'
								transform='translate(100 100)'
							/>
						</svg>
					</div>
				</>
			)}

			{showEnhancedEffects &&
				ornaments.map((ornament) => (
					<div key={ornament.id} className='pointer-event-none absolute hidden lg:block'
						style={{
							left: `${ornament.left}%`,
							top: `${ornament.top}%`,
							transform: `translate( -50%, -50%)`,
						}}>
						<img src={ornament.assetPath}
							alt={ornament.id}
							loading='lazy'
							decoding='async'
							fetchPriority='low'
							aria-hidden='true'
							className={ornament.animationClassName}
							style={{
								height: `${ornament.size}px`,
								width: `${ornament.size}px`,
								opacity: ornament.opacity,
								animationDelay: `${ornament.animationDelay}s`,
								transform: `rotate(${ornament.rotateDeg}deg)`,
							}}
						/>
					</div>
				))}
		</>
	);
};

export default React.memo(FormLockCareDecorations);
