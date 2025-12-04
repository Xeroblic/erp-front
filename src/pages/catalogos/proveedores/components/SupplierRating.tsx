import React from 'react';
import Icon from '@/components/icon/Icon';

type SupplierRatingProps = {
	value: number;
};

const SupplierRating: React.FC<SupplierRatingProps> = ({ value }) => (
	<div className='flex items-center space-x-1'>
		{Array.from({ length: 5 }).map((_, index) => (
			<Icon
				key={index}
				icon={index < value ? 'HeroStar' : 'HeroStarOutline'}
				className={`h-4 w-4 ${index < value ? 'text-yellow-400' : 'text-gray-300'}`}
			/>
		))}
	</div>
);

export default SupplierRating;
