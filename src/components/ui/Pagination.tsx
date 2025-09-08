import React from 'react';
import Button from './Button';

export interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
	className = '',
}) => {
	const getPageNumbers = () => {
		const pages: number[] = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
			let end = Math.min(totalPages, start + maxVisible - 1);

			if (end - start < maxVisible - 1) {
				start = Math.max(1, end - maxVisible + 1);
			}

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}
		}

		return pages;
	};

	if (totalPages <= 1) return null;

	return (
		<div className={`flex items-center justify-center space-x-2 ${className}`}>
			<Button
				variant='outline'
				size='sm'
				onClick={() => onPageChange(currentPage - 1)}
				isDisable={currentPage <= 1}
				icon='HeroChevronLeft'>
				Anterior
			</Button>

			{getPageNumbers().map((page) => (
				<Button
					key={page}
					variant={page === currentPage ? 'solid' : 'outline'}
					size='sm'
					onClick={() => onPageChange(page)}>
					{page}
				</Button>
			))}

			<Button
				variant='outline'
				size='sm'
				onClick={() => onPageChange(currentPage + 1)}
				isDisable={currentPage >= totalPages}
				icon='HeroChevronRight'>
				Siguiente
			</Button>
		</div>
	);
};

export default Pagination;
