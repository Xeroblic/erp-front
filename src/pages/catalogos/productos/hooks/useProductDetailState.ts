import { useState, useEffect } from 'react';

export const useProductDetailState = (
	initialBranchId: number | null,
	effectiveBranchId: number | null,
) => {
	const [branchId, setBranchId] = useState<number | null>(() =>
		Number.isFinite(initialBranchId ?? NaN) ? initialBranchId : null,
	);
	const [activeTab, setActiveTab] = useState<string>('general');

	useEffect(() => {
		if (!Number.isFinite(initialBranchId ?? NaN)) return;
		if (branchId !== initialBranchId) {
			setBranchId(initialBranchId as number);
		}
	}, [branchId, initialBranchId]);

	useEffect(() => {
		if (!branchId && effectiveBranchId) {
			setBranchId(effectiveBranchId);
		}
	}, [branchId, effectiveBranchId]);

	const handleBranchChange = (nextValue: number | null) => {
		setBranchId(nextValue);
	};

	return {
		branchId,
		activeTab,
		setActiveTab,
		handleBranchChange,
	};
};
