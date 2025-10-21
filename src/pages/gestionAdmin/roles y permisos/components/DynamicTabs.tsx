import React from 'react';
import Icon from '@/components/icon/Icon';
import type { DynamicTabsProps, TabType } from '../types';

const DynamicTabs: React.FC<DynamicTabsProps> = ({
	tabs,
	activeTab,
	onTabChange,
	className = '',
}) => {
	return (
		<div className={`border-b border-zinc-200 dark:border-zinc-700 ${className}`}>
			<div className='flex gap-0 overflow-x-auto px-6'>
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => onTabChange(tab.id)}
						className={`inline-flex min-w-max flex-none items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
							activeTab === tab.id
								? 'border-blue-500 text-blue-600 dark:text-blue-400'
								: 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-300'
						}`}>
						<Icon icon={tab.icon} className='h-5 w-5' />
						<span>{tab.label}</span>
					</button>
				))}
			</div>
		</div>
	);
};

export default DynamicTabs;
