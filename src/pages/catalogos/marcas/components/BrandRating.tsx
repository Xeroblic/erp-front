import React from 'react';
import Icon from '@/components/icon/Icon';

type BrandRatingProps = {
	value: number;
	size?: 'sm' | 'md' | 'lg';
};

const sizeClasses: Record<NonNullable<BrandRatingProps['size']>, string> = {
	sm: 'h-3 w-3',
	md: 'h-4 w-4',
	lg: 'h-5 w-5',
};

const BrandRating: React.FC<BrandRatingProps> = ({ value, size = 'md' }) => {
	const fullStars = Math.floor(value);
	const hasHalfStar = value % 1 >= 0.5;
	const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));
	const iconClass = sizeClasses[size];

	return (
		<div className='flex'>
			{Array.from({ length: fullStars }).map((_, index) => (
				<Icon
					key={`full-${index}`}
					icon='HeroStar'
					className={`${iconClass} text-yellow-400`}
				/>
			))}
			{hasHalfStar && (
				<Icon key='half' icon='HeroStar' className={`${iconClass} text-yellow-200`} />
			)}
			{Array.from({ length: emptyStars }).map((_, index) => (
				<Icon
					key={`empty-${index}`}
					icon='HeroStar'
					className={`${iconClass} text-gray-300`}
				/>
			))}
		</div>
	);
};

export default BrandRating;
