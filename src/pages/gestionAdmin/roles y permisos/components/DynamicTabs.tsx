import React from 'react';
import classNames from 'classnames';
import Icon from '@/components/icon/Icon';
import type { DynamicTabsProps, TabType } from '../types';
import Button from '@/components/ui/Button';

const DynamicTabs: React.FC<DynamicTabsProps> = ({
	tabs,
	activeTab,
	onTabChange,
	className = '',
}) => {
	return (
		<div className={`border-b border-zinc-200 dark:border-zinc-700 ${className}`}>
			<div className='flex gap-0 overflow-x-auto px-6'>
				{tabs.map((tab) => {
					const isActive = activeTab === tab.id;
					const buttonClasses = classNames(
						'inline-flex min-w-max flex-none items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-200',
						isActive
							? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200'
							: 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-300',
					);

					return (
						<Button
							key={tab.id}
							type='button'
							variant='default'
							color='blue'
							isActive={isActive}
							onClick={() => onTabChange(tab.id)}
							className={buttonClasses}>
							<Icon icon={tab.icon} className='h-5 w-5' />
							<span>{tab.label}</span>
						</Button>
					);
				})}
			</div>
		</div>
	);
};

export default DynamicTabs;
