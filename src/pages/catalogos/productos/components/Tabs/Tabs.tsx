import React, { ReactNode } from 'react';
import Icon from '@/components/icon/Icon';

export interface TabItem {
	id: string;
	label: string;
	icon?: string;
	content: ReactNode;
	disabled?: boolean;
	badge?: string | number;
}

interface TabsProps {
	tabs: TabItem[];
	activeTab: string;
	onTabChange: (tabId: string) => void;
	className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, className = '' }) => {
	return (
		<div className={`w-full ${className}`}>
			{/* Tab Headers */}
			<div className='border-b border-gray-200'>
				<nav className='-mb-px flex space-x-8' aria-label='Tabs'>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => !tab.disabled && onTabChange(tab.id)}
							disabled={tab.disabled}
							className={`group inline-flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
								activeTab === tab.id
									? 'border-blue-500 text-blue-600'
									: tab.disabled
										? 'cursor-not-allowed border-transparent text-gray-400'
										: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
							} `}>
							{tab.icon && (
								<Icon
									icon={tab.icon}
									className={`h-5 w-5 ${
										activeTab === tab.id
											? 'text-blue-500'
											: tab.disabled
												? 'text-gray-400'
												: 'text-gray-400 group-hover:text-gray-500'
									}`}
								/>
							)}
							{tab.label}
							{tab.badge && (
								<span
									className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
										activeTab === tab.id
											? 'bg-blue-100 text-blue-800'
											: 'bg-gray-100 text-gray-800'
									} `}>
									{tab.badge}
								</span>
							)}
						</button>
					))}
				</nav>
			</div>

			{/* Tab Content */}
			<div className='mt-6'>
				{tabs.map((tab) => (
					<div
						key={tab.id}
						className={`${activeTab === tab.id ? 'block' : 'hidden'}`}
						role='tabpanel'
						aria-labelledby={`tab-${tab.id}`}>
						{tab.content}
					</div>
				))}
			</div>
		</div>
	);
};

export default Tabs;
