import React from 'react';
import Button from '@/components/ui/Button';

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	loading: boolean;
	onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	loading,
	onPageChange,
}) => {
	const handlePrevious = () => {
		if (currentPage > 1) {
			onPageChange(currentPage - 1);
		}
	};

	const handleNext = () => {
		if (currentPage < totalPages) {
			onPageChange(currentPage + 1);
		}
	};

	return (
		<div className='mt-6 flex items-center justify-between'>
			<Button
				variant='outline'
				size='sm'
				onClick={handlePrevious}
				isDisable={loading || currentPage <= 1}
				icon='HeroChevronLeft'>
				Anterior
			</Button>
			<div className='text-sm text-neutral-500'>
				Pagina {currentPage} de {totalPages}
			</div>
			<Button
				variant='outline'
				size='sm'
				onClick={handleNext}
				isDisable={loading || currentPage >= totalPages}
				rightIcon='HeroChevronRight'>
				Siguiente
			</Button>
		</div>
	);
};

export default Pagination;
