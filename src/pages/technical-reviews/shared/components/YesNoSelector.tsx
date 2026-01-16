import { SelectionCard } from "./SelectionCard";

interface YesNoSelectorProps {
    label: string;
    value: boolean | undefined | null;
    onChange: (val: boolean) => void;
    className?: string;
}

export const YesNoSelector: React.FC<YesNoSelectorProps> = ({ label, value, onChange, className }) => {
    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <label className='block text-sm font-bold text-center dark:text-gray-300'>{label}</label>
            <div className='grid grid-cols-2 gap-4'>
                <SelectionCard
                    label='Sí'
                    value='yes'
                    isSelected={value === true}
                    onClick={() => onChange(true)}
                    color='green'
                    icon='HeroCheck'
                    className='h-16 min-h-[60px]'
                />
                <SelectionCard
                    label='No'
                    value='no'
                    isSelected={value === false}
                    onClick={() => onChange(false)}
                    color='red'
                    icon='HeroXMark'
                    className='h-16 min-h-[60px]'
                />
            </div>
        </div>
    );
};
