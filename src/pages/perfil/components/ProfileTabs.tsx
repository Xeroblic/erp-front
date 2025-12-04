import Button, { IButtonProps } from '@/components/ui/Button';
import { ProfileTabDefinition, ProfileTabKey } from './types';

type Props = {
	tabs: ProfileTabDefinition[];
	activeTab: ProfileTabKey;
	onTabChange: (tab: ProfileTabKey) => void;
};

const baseButtonProps: IButtonProps = {
	color: 'zinc',
};

const activeButtonProps: IButtonProps = {
	...baseButtonProps,
	isActive: true,
	color: 'emerald',
	colorIntensity: '500',
};

const ProfileTabs = ({ tabs, activeTab, onTabChange }: Props) => {
	return (
		<div className='col-span-12 flex gap-4 max-sm:flex-wrap sm:col-span-4 sm:flex-col md:col-span-2'>
			{tabs.map((tab) => {
				const isActive = tab.key === activeTab;
				return (
					<div key={tab.key}>
						<Button
							icon={tab.icon}
							{...(isActive ? activeButtonProps : baseButtonProps)}
							onClick={() => onTabChange(tab.key)}>
							{tab.label}
						</Button>
					</div>
				);
			})}
		</div>
	);
};

export default ProfileTabs;
