import React from 'react';
import { getDaysUntilDueText } from '../../utils';

interface DaysUntilDueBadgeProps {
	daysUntilDue: number | null;
	isOverdue: boolean;
}

const DaysUntilDueBadge: React.FC<DaysUntilDueBadgeProps> = ({ daysUntilDue, isOverdue }) => {
	if (daysUntilDue === null) return null;
	const isDueSoon = !isOverdue && daysUntilDue >= 0 && daysUntilDue <= 7;
	let colorClass = 'bg-blue-600 text-white';
	if (isOverdue) colorClass = 'bg-red-600 text-white';
	else if (isDueSoon) colorClass = 'bg-amber-600 text-white';

	return (
		<span
			className={`inline-flex min-w-36 max-w-48 items-center justify-center whitespace-normal rounded-full px-3 py-1.5 text-center text-sm font-semibold leading-tight shadow-sm ${colorClass}`}>
			{getDaysUntilDueText(daysUntilDue)}
		</span>
	);
};

export default DaysUntilDueBadge;
