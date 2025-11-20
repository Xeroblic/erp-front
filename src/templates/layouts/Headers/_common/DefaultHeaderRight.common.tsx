import React from 'react';
import NotificationPartial from '../_partial/Notification.partial';
import SettingsPartial from '../_partial/Settings.partial';
import MessagesPartial from '../_partial/Messages.partial';
import CompanySelectorButton from '../_partial/CompanySelectorButton';
import SelectSucursalEmpresa from '../_partial/SelectSucursalEmpresa';
import SearchPartial from '../_partial/Search.partial';

const DefaultHeaderRightCommon = () => {
	return (
		<>
			{/* <MessagesPartial /> */}
			<SelectSucursalEmpresa />
			{/* <LanguageSelectorPartial /> */}
			<SearchPartial />
			<NotificationPartial />
			{/* <CompanySelectorButton /> */}
			<SettingsPartial />
		</>
	);
};

export default DefaultHeaderRightCommon;
