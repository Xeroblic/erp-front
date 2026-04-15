import React from 'react';
import Nav, {
	NavButton,
	NavItem,
	NavSeparator,
} from '../../../../components/layouts/Navigation/Nav';
import Badge from '../../../../components/ui/Badge';
import UserTemplate from '../../User/User.template';
import DarkModeSwitcherPart from './DarkModeSwitcher.part';
import { AsideFooter } from '../../../../components/layouts/Aside/Aside';
import { useCliVersion } from '../../../../hooks/useCliVersion';
import { useVersion } from '@/hooks/useVersion';

const AsideFooterPart = () => {
	const { hasNewVersion, handleDownloadCli, isReady, latestVersion } = useCliVersion();

	const version = useVersion();

	return (
		<AsideFooter>
			{/* {isReady && version === 'dev' && ( */}
			<Nav>
				<NavSeparator />
				<NavItem text='Zentria Installers'>
					{hasNewVersion && (
						<Badge
							variant='solid'
							color='emerald'
							className='ml-2 animate-pulse text-[0.65rem] leading-none'>
							Nueva versión
						</Badge>
					)}

					{latestVersion && (
						<NavButton
							icon='HeroCloudArrowDown'
							title={`CLI ${latestVersion}`}
							onClick={handleDownloadCli}
						/>
					)}
				</NavItem>
			</Nav>
			{/* )} */}
			<UserTemplate />
			<DarkModeSwitcherPart />
		</AsideFooter>
	);
};

export default AsideFooterPart;
