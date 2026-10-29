import Header, { HeaderLeft, HeaderRight } from '../../../components/layouts/Header/Header';
import DefaultHeaderRightCommon from './_common/DefaultHeaderRight.common';
import UserRoutesDropdown from '@/components/navigation/UserRoutesDropdown';
import CompanySelectorButton from './_partial/CompanySelectorButton';
import { useAppSelector } from '@/store';
import { useVersion } from '@/hooks/useVersion';
import Badge from '@/components/ui/Badge';

const DefaultHeaderTemplate = () => {
	// const { personalizacionUsuario } = useAppSelector((state) => state.personalizacion);
	const version = useVersion();

	return (
		<Header>
			<HeaderLeft>
				{/* <UserRoutesDropdown /> */}
				<>
					{version === 'dev' && (
						<div className='rounded-xl bg-yellow-500'>
							<Badge className='rounded border border-red-600 px-2 py-1 text-2xl font-bold text-red-600'>
								MODO DESARROLLO
							</Badge>
						</div>
					)}
				</>
				{/* <>
				</> */}
			</HeaderLeft>
			<HeaderRight>
				{/* <CompanySelectorButton /> */}
				<DefaultHeaderRightCommon />
			</HeaderRight>
		</Header>
	);
};

export default DefaultHeaderTemplate;
