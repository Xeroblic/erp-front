import { useId } from 'react';
import Select from '@/components/form/Select';
import Pagination from '@/components/ui/Pagination';
import { CardFooter } from '@/components/ui/Card';
import type { IApiPaginationMeta } from '@/interface/procurement.interface';
import { describePageRange } from '@/utils/procurementPagination.util';

const StockPagination = ({
	meta,
	noun,
	onChange,
}: {
	meta: IApiPaginationMeta;
	noun: string;
	onChange: (page: number, perPage: number) => void;
}) => {
	const id = useId();
	return (
		<CardFooter className='flex-wrap gap-3'>
			<span>
				{describePageRange(meta) ?? '0'} {meta.total === 1 ? noun.slice(0, -1) : noun}
			</span>
			<div className='flex items-center gap-2'>
				<label htmlFor={id}>Por página</label>
				<Select
					id={id}
					name='per_page'
					value={meta.per_page}
					className='!w-auto'
					onChange={(event) => onChange(1, Number(event.target.value))}>
					{[5, 15, 30, 50, 100].map((size) => (
						<option key={size} value={size}>
							{size}
						</option>
					))}
				</Select>
			</div>
			<Pagination
				currentPage={meta.current_page}
				totalPages={meta.last_page}
				onPageChange={(page) => onChange(page, meta.per_page)}
			/>
		</CardFooter>
	);
};

export default StockPagination;
