import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useProductDetailState = (initialBranchId: number | null, effectiveBranchId: number | null) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [branchId, setBranchId] = useState<number | null>(
        Number.isFinite(initialBranchId ?? NaN) ? initialBranchId : null,
    );
    const [activeTab, setActiveTab] = useState<string>('general');

    useEffect(() => {
        if (!branchId && effectiveBranchId) {
            setBranchId(effectiveBranchId);
            if (effectiveBranchId) {
                const params = new URLSearchParams(searchParams);
                params.set('branchId', String(effectiveBranchId));
                setSearchParams(params, { replace: true });
            }
        }
    }, [branchId, effectiveBranchId, searchParams, setSearchParams]);

    const handleBranchChange = (nextValue: number | null) => {
        setBranchId(nextValue);
        const params = new URLSearchParams(searchParams);
        if (nextValue) {
            params.set('branchId', String(nextValue));
        } else {
            params.delete('branchId');
        }
        setSearchParams(params, { replace: true });
    };

    return {
        branchId,
        activeTab,
        setActiveTab,
        handleBranchChange,
    };
};
