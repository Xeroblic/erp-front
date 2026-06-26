import React from 'react';
import NotificationPartial from '../_partial/Notification.partial';
import SettingsPartial from '../_partial/Settings.partial';
import MessagesPartial from '../_partial/Messages.partial';
import CompanySelectorButton from '../_partial/CompanySelectorButton';
import SelectSucursalEmpresa from '../_partial/SelectSucursalEmpresa';
import SearchPartial from '../_partial/Search.partial';
import PendingSerialBadge from '../_partial/PendingSerialBadge.partial';

const DefaultHeaderRightCommon = () => {
	return (
		<div className='flex items-center gap-8'>
			{/* <MessagesPartial /> */}
			<SelectSucursalEmpresa />
			{/* <LanguageSelectorPartial /> */}
			<SearchPartial />
			<PendingSerialBadge />
			<NotificationPartial />
			{/* <CompanySelectorButton /> */}
			<SettingsPartial />
		</div>
	);
};

export default DefaultHeaderRightCommon;
