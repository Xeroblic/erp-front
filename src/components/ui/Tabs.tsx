import React, { ReactNode } from 'react';
import classNames from 'classnames';

export interface TabProps {
	id: string; // Cambiar key por id para evitar conflictos con React
	text: string;
	children: ReactNode;
}

export interface TabsProps {
	activeTab: string;
	onTabChange: (tabId: string) => void;
	className?: string;
	children: React.ReactElement<TabProps>[];
}

export const Tab: React.FC<TabProps> = ({ children }) => {
	return <div>{children}</div>;
};

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, className = '', children }) => {
	const tabs = React.Children.toArray(children) as React.ReactElement<TabProps>[];

	return (
		<div className={`w-full ${className}`}>
			<div className='border-b border-gray-200 dark:border-gray-700'>
				<nav className='-mb-px flex space-x-8' aria-label='Tabs'>
					{tabs.map((tab, index) => (
						<button
							key={tab.props.id || `tab-${index}`} // Usar id o fallback con índice
							onClick={() => onTabChange(tab.props.id)}
							className={classNames(
								'whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium',
								activeTab === tab.props.id
									? 'border-blue-500 text-blue-600 dark:text-blue-400'
									: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
							)}
							aria-current={activeTab === tab.props.id ? 'page' : undefined}>
							{tab.props.text}
						</button>
					))}
				</nav>
			</div>
			<div className='mt-4'>
				{tabs.find((tab) => tab.props.id === activeTab)?.props.children}
			</div>
		</div>
	);
};

export default Tabs;
