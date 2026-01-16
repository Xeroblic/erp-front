interface RangeSliderProps {
    value: number | string;
    onChange: (val: string) => void;
    label: string;
    max?: number;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({ value, onChange, label, max = 1000 }) => {
    const numValue = typeof value === 'string' ? parseInt(value) || 0 : value || 0;
    
    return (
        <div className='flex flex-col gap-2 rounded-xl p-4'>
            <div className='flex items-center justify-between'>
                <label className='text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400'>
                    {label}
                </label>
                <div className='flex items-center gap-2'>
                    <p className='text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400'>Ingresa el valor en W</p>
                    <input
                        type='number'
                        value={numValue}
                        onChange={(e) => {
                            const val = Math.min(max, Math.max(0, Number(e.target.value)));
                            onChange(val.toString());
                        }}
                        className='w-20 rounded-lg px-2 py-1 text-right text-sm font-bold text-blue-600 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-blue-400'
                    />
                    <span className='text-xs font-bold text-gray-400'>W</span>
                </div>
            </div>
            <input
                type='range'
                min='0'
                max={max}
                step='1'
                value={numValue}
                onChange={(e) => onChange(e.target.value)}
                className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600 dark:bg-gray-700'
            />
            <div className='flex justify-between text-[10px] font-bold text-gray-400 uppercase'>
                <span>0W</span>
                <span>{max}W</span>
            </div>
        </div>
    );
};;