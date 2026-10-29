import React, { useState } from 'react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '@/components/ui/Card';
import { CreateSubsidiaryModal } from '../modals';
import { ISubempresa } from '@/interface/empresas.interface';
import {
	useSubsidiaryColumns,
	SubsidiariesTableHeader,
	SubsidiariesLoadingState,
	SubsidiariesEmptyState,
	SubsidiariesTableContent,
} from '../table';

interface SubsidiariesTableProps {
	subsidiaries: ISubempresa[];
	loading: boolean;
	onRefresh: () => void;
}

export default function SubsidiariesTable({
	subsidiaries,
	loading,
	onRefresh,
}: SubsidiariesTableProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSubsidiary, setEditingSubsidiary] = useState<ISubempresa | null>(null);
	const navigate = useNavigate();

	const handleEdit = (subsidiary: ISubempresa) => {
		setEditingSubsidiary(subsidiary);
		setIsModalOpen(true);
	};

	const handleCreate = () => {
		setEditingSubsidiary(null);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setEditingSubsidiary(null);
	};

	const handleSuccess = () => {
		handleCloseModal();
		onRefresh();
	};

	const columns = useSubsidiaryColumns(handleEdit, navigate);

	const table = useReactTable({
		data: subsidiaries,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	if (loading) return <SubsidiariesLoadingState />;

	return (
		<>
			<Card>
				<SubsidiariesTableHeader
					subsidiariesCount={subsidiaries.length}
					onRefresh={onRefresh}
					onCreate={handleCreate}
				/>

				<CardBody className='p-0'>
					{subsidiaries.length > 0 ? (
						<SubsidiariesTableContent table={table} />
					) : (
						<SubsidiariesEmptyState onCreate={handleCreate} />
					)}
				</CardBody>
			</Card>

			<CreateSubsidiaryModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				subsidiary={editingSubsidiary}
				onSuccess={handleSuccess}
			/>
		</>
	);
}
