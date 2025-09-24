import { useState } from 'react';

export const useSelection = (allIds: number[] = []) => {
    const [selected, setSelected] = useState<number[]>([]);
    const toggleAll = () => setSelected(selected.length === allIds.length ? [] : allIds);
    const toggleOne = (id: number) =>
        setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    const clear = () => setSelected([]);
    return { selected, toggleAll, toggleOne, clear };
};
