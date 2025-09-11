import Header, { HeaderLeft, HeaderRight } from '../../../components/layouts/Header/Header';
import DefaultHeaderRightCommon from './_common/DefaultHeaderRight.common';
import UserRoutesDropdown from '@/components/navigation/UserRoutesDropdown';
import CompanySelectorButton from './_partial/CompanySelectorButton';
import { useAppSelector } from '@/store';

const DefaultHeaderTemplate = () => {
	// const { personalizacionUsuario } = useAppSelector((state) => state.personalizacion);
	
	return (
		<Header>
			{/* <HeaderLeft> */}
				{/* <UserRoutesDropdown className="hidden md:block" /> */}
				{/* <SearchPartial /> */}
			{/* </HeaderLeft> */}
			<HeaderRight>
				{/* <CompanySelectorButton /> */}
				<DefaultHeaderRightCommon />
			</HeaderRight>
		</Header>
	);
};

export default DefaultHeaderTemplate;
