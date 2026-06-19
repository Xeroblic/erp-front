import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Icon from '@/components/icon/Icon';
import Badge from '@/components/ui/Badge';
import Tooltip from '@/components/ui/Tooltip';
import { useReviewAttributes } from './hooks/useReviewAttributes';
import { useProductReviews, type ReviewItemMatch } from './hooks/useProductReviews';
import BasicInfoSection from './sections/BasicInfoSection';
import HardwareScreenSection from './sections/HardwareScreenSection';
import ConditionSection from './sections/ConditionSection';
import PortsSection from './sections/PortsSection';
import ExtrasSection from './sections/ExtrasSection';
import JsonPreviewSection from './sections/JsonPreviewSection';
import type { IProduct } from '@/interface/product.interface';
import type { ReviewSectionProps } from './types';
import { useCurrentBranch } from '@/hooks/useCurrentBranch';
import ApiService from '@/services/ApiService';

interface AttributesTabPanelProps {
	product?: IProduct | null;
	updateProduct?: (payload: { data: Partial<IProduct>; categoryIds?: number[] }) => Promise<void>;
}

const SECTION_COMPONENTS: Record<string, React.FC<ReviewSectionProps>> = {
	'basic-info': BasicInfoSection,
	hardware: HardwareScreenSection,
	condition: ConditionSection,
	ports: PortsSection,
	extras: ExtrasSection,
};

const getGradeValue = (grade: ReviewItemMatch['grade']): string => grade?.value ?? 'sin_grado';

const getGradeLabel = (grade: ReviewItemMatch['grade']): string => grade?.label ?? 'Sin grado';

const GRADE_COLORS: Record<string, string> = {
	A: 'emerald',
	B: 'blue',
	C: 'amber',
	M: 'red',
};

const AttributesTabPanel: React.FC<AttributesTabPanelProps> = ({ product }) => {
	const { reviewData, updateField, productKind, visibleTabs, importFromReview } =
		useReviewAttributes();
	const { branchId } = useCurrentBranch();

	const [activeSubTab, setActiveSubTab] = useState(visibleTabs[0]?.id ?? 'json-preview');
	const [importingId, setImportingId] = useState<number | null>(null);
	const [selectedReviewId, setSelectedReviewId] = useState<string>('');

	const { reviews, isLoading: matchLoading } = useProductReviews({
		productId: product?.id,
		productName: product?.name,
		productSku: product?.sku,
		productType: product?.product_type ?? undefined,
	});

	const reviewsByGrade = useMemo(() => {
		const groups: Record<string, ReviewItemMatch[]> = {};
		for (const r of reviews) {
			const g = getGradeValue(r.grade);
			if (!groups[g]) groups[g] = [];
			groups[g].push(r);
		}
		return groups;
	}, [reviews]);

	const handleImportItem = useCallback(
		async (item: ReviewItemMatch) => {
			if (item.details) {
				importFromReview(item.details);
				toast.success(`Datos importados del serial ${item.serial_number}`);
				return;
			}
			if (!branchId) return;
			setImportingId(item.id);
			try {
				const resp = await ApiService.fetchData<{ data?: Record<string, unknown> }>({
					url: `/branches/${branchId}/technical-reviews/items/${item.id}`,
					method: 'get',
				});
				const full = (resp.data?.data ?? resp.data) as Record<string, unknown> | null;
				if (full?.details && typeof full.details === 'object') {
					importFromReview(full.details as Record<string, unknown>);
					toast.success(`Datos importados del serial ${item.serial_number}`);
				}
			} catch {
				toast.error('No se pudieron importar los datos');
			} finally {
				setImportingId(null);
			}
		},
		[branchId, importFromReview],
	);

	const effectiveSubTab = visibleTabs.find((t) => t.id === activeSubTab)
		? activeSubTab
		: (visibleTabs[0]?.id ?? 'json-preview');

	const filledCount = Object.values(reviewData).filter(
		(v) => v !== undefined && v !== null && v !== '',
	).length;

	const renderSection = () => {
		if (effectiveSubTab === 'json-preview') return <JsonPreviewSection />;
		const Component = SECTION_COMPONENTS[effectiveSubTab];
		if (!Component) return null;
		return <Component data={reviewData} updateField={updateField} productKind={productKind} />;
	};

	return (
		<div className='space-y-4'>
			{/* Header */}
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div className='flex items-center gap-3'>
					<h3 className='text-lg font-semibold text-neutral-900 dark:text-neutral-50'>
						Atributos de revisión
					</h3>
					<Badge color={filledCount > 0 ? 'blue' : 'zinc'} variant='outline'>
						{filledCount} campos
					</Badge>
				</div>
				{reviews.length > 0 && (
					<Badge color='violet' variant='solid'>
						{reviews.length} revisión{reviews.length !== 1 ? 'es' : ''} asociada
						{reviews.length !== 1 ? 's' : ''}
					</Badge>
				)}
			</div>

			{/* Import from review — select */}
			<div className='flex flex-wrap items-end gap-2 rounded-lg border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-500/20 dark:bg-violet-950/20'>
				<div className='min-w-0 flex-1'>
					<label
						htmlFor='review-select'
						className='mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400'>
						<Icon icon='HeroClipboardDocumentCheck' className='h-3.5 w-3.5' />
						Importar desde revisión
					</label>
					<select
						id='review-select'
						value={selectedReviewId}
						onChange={(e) => setSelectedReviewId(e.target.value)}
						disabled={matchLoading || reviews.length === 0}
						className='w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:border-violet-400'>
						<option value=''>
							{matchLoading
								? 'Buscando revisiones…'
								: reviews.length === 0
									? 'Sin revisiones asociadas'
									: `Seleccionar revisión (${reviews.length} encontrada${reviews.length !== 1 ? 's' : ''})`}
						</option>
						{Object.entries(reviewsByGrade).map(([gradeKey, items]) => (
							<optgroup
								key={gradeKey}
								label={`Grado ${gradeKey === 'sin_grado' ? '?' : gradeKey} (${items.length})`}>
								{items.map((item) => (
									<option key={item.id} value={String(item.id)}>
										{item.serial_number} —{' '}
										{item.product?.name ?? item.equipment_type.label} [
										{getGradeValue(item.grade) === 'sin_grado'
											? '?'
											: getGradeValue(item.grade)}
										]
									</option>
								))}
							</optgroup>
						))}
					</select>
				</div>
				<Tooltip text='Importar los datos de la revisión seleccionada'>
					<button
						type='button'
						onClick={() => {
							const item = reviews.find((r) => String(r.id) === selectedReviewId);
							if (item) void handleImportItem(item);
						}}
						disabled={!selectedReviewId || importingId !== null}
						className='flex h-[38px] items-center gap-1.5 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-40 dark:bg-violet-600 dark:hover:bg-violet-500'
						aria-label='Importar revisión seleccionada'>
						{importingId !== null ? (
							<Icon icon='HeroArrowPath' className='h-4 w-4 animate-spin' />
						) : (
							<Icon icon='HeroArrowDownTray' className='h-4 w-4' />
						)}
						Importar
					</button>
				</Tooltip>
			</div>

			{/* Sub-tab navigation */}
			<div className='overflow-x-auto border-b border-neutral-200 dark:border-neutral-700'>
				<nav
					className='flex w-max min-w-full gap-0'
					role='tablist'
					aria-label='Secciones de atributos'
					style={{ scrollbarWidth: 'none' }}>
					{visibleTabs.map((tab) => {
						const isActive = effectiveSubTab === tab.id;
						return (
							<button
								key={tab.id}
								type='button'
								role='tab'
								aria-selected={isActive}
								onClick={() => setActiveSubTab(tab.id)}
								className={`relative inline-flex flex-shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium transition-colors ${
									isActive
										? 'text-blue-600 dark:text-blue-400'
										: 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
								}`}>
								<Icon
									icon={tab.icon}
									className={`h-3.5 w-3.5 ${
										isActive
											? 'text-blue-500 dark:text-blue-400'
											: 'text-neutral-400 dark:text-neutral-500'
									}`}
								/>
								{tab.label}
								{isActive && (
									<span className='absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-blue-500 dark:bg-blue-400' />
								)}
							</button>
						);
					})}
				</nav>
			</div>

			{/* Active section content */}
			<div className='rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-800/50'>
				{renderSection()}
			</div>
		</div>
	);
};

export default AttributesTabPanel;
