import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
	fetchBatches,
	selectBatches,
	selectBatchesLoading,
	selectBatchesMeta,
} from '@/store/slices/technicalReviews';
import DataTable from '@/components/ui/DataTable/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { IBatch } from '@/interface/technicalReviews.interface';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import { TColors } from '@/types/colors.type';
import { BATCH_STATUS_LABELS } from '@/pages/refactor-technical-review/components/constants/technicalReview.constants';
import Card, { CardBody } from '@/components/ui/Card';
import Tooltip from '@/components/ui/Tooltip';

export function ListaLotes() {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { branchId } = useCurrentBranch();
	const data = useAppSelector(selectBatches);
	const loading = useAppSelector(selectBatchesLoading);
	const meta = useAppSelector(selectBatchesMeta);

	useEffect(() => {
		if (branchId) {
			dispatch(
				fetchBatches({
					branchId,
					params: {
						page: 1,
						per_page: 10,
						sort_by: 'id',
						order: 'desc',
					},
				}),
			);
		}
	}, [dispatch, branchId]);

	const columns: ColumnDef<IBatch>[] = [
		{
			accessorKey: 'id',
			header: 'ID',
			cell: (info) => <span className='font-medium'>#{info.getValue() as string}</span>,
		},
		{
			accessorKey: 'code',
			header: 'Nombre de la revision',
			cell: (info) => info.getValue() || 'N/A',
		},
		{
			accessorKey: 'warehouse.name',
			header: 'Bodega',
			cell: (info) => info.getValue() || 'N/A',
		},
		{
			header: 'Progreso',
			accessorFn: (row) => {
				const received = row.received_quantity || 0;
				const expected = row.expected_quantity || 0;
				return `${received}/${expected}`;
			},
			cell: (info) => {
				const received = info.row.original.received_quantity || 0;
				const expected = info.row.original.expected_quantity || 0;
				const percentage = expected > 0 ? (received / expected) * 100 : 0;

				let color: TColors = 'zinc';
				if (percentage < 20) color = 'red';
				else if (percentage < 80) color = 'amber';
				else color = 'emerald';

				return (
					<Badge variant='outline' color={color} className='border px-1 text-sm'>
						{received} / {expected}
					</Badge>
				);
			},
		},
		{
			accessorKey: 'status',
			header: 'Estado',
			cell: (info) => {
				const status = info.getValue() as string;
				let color: TColors = 'zinc';

				switch (status) {
					case 'DRAFT':
						color = 'blue';
						break;
					case 'IN_PROGRESS':
						color = 'amber';
						break;
					case 'COMPLETED':
						color = 'emerald';
						break;
					case 'CANCELLED':
						color = 'red';
						break;
					default:
						color = 'zinc';
				}

				return (
					<Badge variant='solid' color={color} className='px-1 capitalize'>
						{BATCH_STATUS_LABELS[status as keyof typeof BATCH_STATUS_LABELS] || status}
					</Badge>
				);
			},
		},
		{
			accessorKey: 'created_at',
			header: 'Fecha Creación',
			cell: (info) => dayjs(info.getValue() as string).format('DD/MM/YYYY HH:mm'),
		},
		{
			id: 'actions',
			header: 'Acciones',
			cell: (info) => (
				<>
					<Tooltip text='Detalle del lote'>
						<Button
							variant='solid'
							color='violet'
							icon='HeroEye'
							onClick={() =>
								navigate(`/technical-reviews/lotes/${info.row.original.id}`)
							}
						/>
					</Tooltip>

					{/* <Tooltip text='Eliminar'>
                        <Button
                            variant='solid'
                            color='red'
                            icon='DuoTrash'
                            // onClick={() => navigate(`/technical-reviews/batches/${info.row.original.id}`)}
                        />
                    </Tooltip> */}
				</>
			),
		},
	];

	return (
		<Card className='w-full'>
			<CardBody>
				<DataTable
					columns={columns}
					data={data}
					loading={loading}
					pageCount={meta?.last_page || 1}
					pageSize={meta?.per_page || 10}
					initialSortingState={[{ id: 'id', desc: true }]}
					manualPagination={true}
					onPaginationChange={(updater) => {
						// Handle pagination if needed, for now just basic structure
						console.log('Pagination changed', updater);
					}}
				/>
			</CardBody>
		</Card>
	);
}
