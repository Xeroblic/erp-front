import React from 'react';
import Card, { CardBody } from '@/components/ui/Card';
import Icon from '@/components/icon/Icon';

interface StatsCardProps {
	title: string;
	value: string | number;
	subtitle?: string;
	icon: string; // HeroIcon name
	colorClass?: string; // e.g. "bg-green-100 text-green-600"
	trend?: 'up' | 'down' | 'neutral';
}

const StatsCard: React.FC<StatsCardProps> = ({
	title,
	value,
	subtitle,
	icon,
	colorClass = 'bg-blue-100 text-blue-600',
	trend,
}) => {
	// Helper to format number as currency if it looks like a large number or price
	const formattedValue = React.useMemo(() => {
		if (typeof value === 'number') {
			// If it's a very large number (likely money in CLP), format it
			if (value > 1000) return `$ ${value.toLocaleString('es-CL')}`;
			return value;
		}
		// If it's a string, try to parse it
		const num = parseFloat(String(value));
		if (!isNaN(num) && num > 1000) {
			return `$ ${num.toLocaleString('es-CL')}`;
		}
		return value;
	}, [value]);

	return (
		<Card className='group h-full border-zinc-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:shadow-zinc-900/10'>
			<CardBody className='flex flex-col justify-between p-6'>
				<div className='flex items-center justify-between'>
					{/* Icon Box */}
					<div
						className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${colorClass}`}>
						<Icon icon={icon} className='h-6 w-6' />
					</div>
				</div>

				<div className='mt-6'>
					<h3 className='text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white'>
						{formattedValue}
					</h3>
					<p className='mt-1 text-sm font-medium capitalize text-zinc-500 dark:text-zinc-400'>
						{title.toLowerCase()}
					</p>
				</div>

				{subtitle && (
					<div className='mt-4 flex items-center gap-2'>
						{trend === 'up' && (
							<Icon icon='HeroTrendingUp' className='h-4 w-4 text-emerald-500' />
						)}
						{trend === 'down' && (
							<Icon icon='HeroTrendingDown' className='h-4 w-4 text-red-500' />
						)}
						<span
							className={`rounded-full px-2 py-0.5 text-xs font-bold ${
								trend === 'down'
									? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
									: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
							}`}>
							{subtitle}
						</span>
					</div>
				)}
			</CardBody>
		</Card>
	);
};

export default StatsCard;
