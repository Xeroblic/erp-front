import React, { ReactNode } from 'react';
import Icon from '@/components/icon/Icon';

export interface TabProps {
	id: string;
	text: string;
	children: ReactNode;
	icon?: string;
	badge?: string | number;
	disabled?: boolean;
}

export interface TabsProps {
	activeTab: string;
	onTabChange: (tabId: string) => void;
	className?: string;
	contentClassName?: string;
	children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
	return <>{children}</>;
};

Tab.displayName = 'Tab';

const Tabs: React.FC<TabsProps> = ({
	activeTab,
	onTabChange,
	className = '',
	contentClassName = '',
	children,
}) => {
	const tabs = React.Children.toArray(children).filter(
		(child): child is React.ReactElement<TabProps> => React.isValidElement(child),
	);

	return (
		<div className={`w-full max-w-full overflow-hidden ${className}`}>
			<div className='border-b border-gray-200 dark:border-gray-700'>
				<div
					className='w-full overflow-x-auto pb-1'
					style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}>
					<nav
						className='flex w-max flex-nowrap gap-3 px-2'
						role='tablist'
						aria-label='Tabs'>
						{tabs.map((tab) => {
							const { id, text, icon, badge, disabled } = tab.props;
							const isActive = activeTab === id;
							return (
								<button
									key={id}
									type='button'
									role='tab'
									id={`tab-${id}`}
									aria-selected={isActive}
									aria-controls={`panel-${id}`}
									disabled={disabled}
									onClick={() => !disabled && onTabChange(id)}
									className={`group inline-flex min-w-max flex-none items-center justify-center gap-2 whitespace-nowrap border-b-2 px-3 pb-3 pt-2 text-sm font-medium transition-colors duration-200 ${
										isActive
											? 'border-blue-500 text-blue-600 dark:text-blue-400'
											: disabled
												? 'cursor-not-allowed border-transparent text-gray-400 dark:text-gray-500'
												: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
									}`}>
									{icon && (
										<Icon
											icon={icon}
											className={`h-5 w-5 ${
												isActive
													? 'text-blue-500 dark:text-blue-400'
													: 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-300'
											}`}
										/>
									)}
									<span className='whitespace-nowrap'>{text}</span>
									{badge && (
										<span
											className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
												isActive
													? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-100'
													: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
											}`}>
											{badge}
										</span>
									)}
								</button>
							);
						})}
					</nav>
				</div>
			</div>

			<div className={`mt-6 overflow-hidden ${contentClassName}`}>
				{tabs.map((tab) => {
					const { id, children: tabContent } = tab.props;
					const isActive = activeTab === id;
					return (
						<div
							key={id}
							role='tabpanel'
							id={`panel-${id}`}
							aria-labelledby={`tab-${id}`}
							className={isActive ? 'block' : 'hidden'}>
							{tabContent}
						</div>
					);
				})}
			</div>
		</div>
	);
};

Tabs.displayName = 'Tabs';

export default Tabs;
