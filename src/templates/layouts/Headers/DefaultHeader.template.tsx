import Header, { HeaderLeft, HeaderRight } from '../../../components/layouts/Header/Header';
import DefaultHeaderRightCommon from './_common/DefaultHeaderRight.common';
import UserRoutesDropdown from '@/components/navigation/UserRoutesDropdown';
import CompanySelectorButton from './_partial/CompanySelectorButton';

const DefaultHeaderTemplate = () => {
	return (
		<Header>
			<HeaderLeft>
				<UserRoutesDropdown className="hidden md:block" />
				{/* <SearchPartial /> */}
			</HeaderLeft>
			<HeaderRight>
				{/* <CompanySelectorButton /> */}
				<DefaultHeaderRightCommon />
			</HeaderRight>
		</Header>
	);
};

export default DefaultHeaderTemplate;
