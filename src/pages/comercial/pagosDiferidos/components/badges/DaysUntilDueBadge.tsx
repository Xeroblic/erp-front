import React from 'react';
import { getDaysUntilDueText } from '../../utils';

interface DaysUntilDueBadgeProps {
	daysUntilDue: number;
	isOverdue: boolean;
}

const DaysUntilDueBadge: React.FC<DaysUntilDueBadgeProps> = ({ daysUntilDue, isOverdue }) => {
	const isDueSoon = !isOverdue && daysUntilDue <= 7;
	const colorClass = isOverdue
		? 'bg-red-600 text-white'
		: isDueSoon
			? 'bg-amber-600 text-white'
			: 'bg-blue-600 text-white';

	return (
		<span
			className={`inline-flex w-44 items-center justify-center rounded-full px-3 py-1.5 text-center text-sm font-semibold shadow-sm ${colorClass}`}>
			{getDaysUntilDueText(daysUntilDue)}
		</span>
	);
};

export default DaysUntilDueBadge;
