import Icon from "@/components/icon/Icon";

interface SelectionCardProps {
    label: string;
    value: string;
    isSelected: boolean;
    onClick: () => void;
    color?: 'green' | 'red' | 'yellow' | 'gray';
    icon?: string;
    className?: string;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
    label,
    value,
    isSelected,
    onClick,
    color = 'gray',
    icon,
    className = '',
}) => {
    const colorStyles = {
        green: isSelected
            ? 'bg-green-100 border-green-500 text-green-800 shadow-md ring-1 ring-green-500 ring-offset-1 dark:bg-green-900/60 dark:border-green-400 dark:text-green-100'
            : 'bg-green-50/50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-900/10 dark:border-green-900/30 dark:text-green-400',
        red: isSelected
            ? 'bg-red-100 border-red-500 text-red-800 shadow-md ring-1 ring-red-500 ring-offset-1 dark:bg-red-900/60 dark:border-red-400 dark:text-red-100'
            : 'bg-red-50/50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400',
        yellow: isSelected
            ? 'bg-yellow-100 border-yellow-500 text-yellow-800 shadow-md ring-1 ring-yellow-500 ring-offset-1 dark:bg-yellow-900/60 dark:border-yellow-400 dark:text-yellow-100'
            : 'bg-yellow-50/50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/30 dark:text-yellow-400',
        gray: isSelected
            ? 'bg-blue-100 border-blue-500 text-blue-800 shadow-md ring-1 ring-blue-500 ring-offset-1 dark:bg-blue-900/60 dark:border-blue-400 dark:text-blue-100'
            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400',
    };

    return (
        <div
            data-value={value}
            onClick={onClick}
            className={`cursor-pointer rounded-xl border-2 p-3 text-center transition-all duration-200 ${
                isSelected ? 'scale-105 z-10' : 'scale-100'
            } ${colorStyles[color]} flex flex-col items-center justify-center gap-2 min-h-[70px] ${className}`}
        >
            {icon && <Icon icon={icon} className={`h-6 w-6 ${isSelected ? '' : 'opacity-80'}`} />}
            <span className={`text-sm font-semibold ${isSelected ? 'font-bold' : ''}`}>{label}</span>
        </div>
    );
};