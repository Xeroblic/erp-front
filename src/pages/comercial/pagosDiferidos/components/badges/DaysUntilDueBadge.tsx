import React from 'react';
import { getDaysUntilDueText } from '../../utils';

interface DaysUntilDueBadgeProps {
	daysUntilDue: number;
	isOverdue: boolean;
}

const DaysUntilDueBadge: React.FC<DaysUntilDueBadgeProps> = ({ daysUntilDue, isOverdue }) => (
	<span
		className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-zinc-600 dark:text-zinc-300'}`}>
		{getDaysUntilDueText(daysUntilDue)}
	</span>
);

export default DaysUntilDueBadge;
