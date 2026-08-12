import type { AriaAttributes, FC } from 'react';
// eslint-disable-next-line import/extensions
import { Th } from '@/components/ui/Table';

export type TableSortDirection = 'asc' | 'desc';
export type TableSortState<TKey extends string> = {
	key: TKey;
	direction: TableSortDirection;
} | null;

interface SortableTableHeaderProps<TKey extends string> {
	label: string;
	sortKey: TKey;
	sort: TableSortState<TKey>;
	onSort: (key: TKey) => void;
	align?: 'left' | 'center' | 'right';
}

const SortIcon: FC<{ direction: TableSortDirection | null }> = ({ direction }) => (
	<div className='flex shrink-0 flex-col' aria-hidden='true'>
		<svg
			viewBox='0 0 12 12'
			className={`h-3 w-3 ${direction === 'asc' ? 'text-primary-600' : 'text-gray-400'}`}
			fill='none'
			stroke='currentColor'
			strokeWidth='1.75'>
			<path d='m2.5 7.5 3.5-3 3.5 3' />
		</svg>
		<svg
			viewBox='0 0 12 12'
			className={`-mt-1 h-3 w-3 ${direction === 'desc' ? 'text-primary-600' : 'text-gray-400'}`}
			fill='none'
			stroke='currentColor'
			strokeWidth='1.75'>
			<path d='m2.5 4.5 3.5 3 3.5-3' />
		</svg>
	</div>
);

const SortableTableHeader = <TKey extends string>({
	label,
	sortKey,
	sort,
	onSort,
	align = 'left',
}: SortableTableHeaderProps<TKey>) => {
	const direction = sort?.key === sortKey ? sort.direction : null;
	const alignmentClasses = {
		left: { header: undefined, content: 'justify-start' },
		center: { header: 'text-center', content: 'justify-center' },
		right: { header: 'text-right', content: 'justify-end' },
	}[align];
	let ariaSort: AriaAttributes['aria-sort'] = 'none';
	if (direction === 'asc') ariaSort = 'ascending';
	if (direction === 'desc') ariaSort = 'descending';

	return (
		<Th className={alignmentClasses.header} aria-sort={ariaSort}>
			<button
				type='button'
				className={`flex w-full items-center space-x-2 ${alignmentClasses.content}`}
				aria-label={`Ordenar por ${label}`}
				onClick={() => onSort(sortKey)}>
				<span>{label}</span>
				<SortIcon direction={direction} />
			</button>
		</Th>
	);
};

export default SortableTableHeader;
