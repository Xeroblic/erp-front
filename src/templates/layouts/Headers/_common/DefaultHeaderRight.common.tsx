import React from 'react';
import NotificationPartial from '../_partial/Notification.partial';
import SettingsPartial from '../_partial/Settings.partial';
import LanguageSelectorPartial from '../_partial/LanguageSelector.partial';
import MessagesPartial from '../_partial/Messages.partial';
import CompanySelectorButton from '../_partial/CompanySelectorButton';

const DefaultHeaderRightCommon = () => {
	return (
		<>
			{/* <MessagesPartial /> */}
			{/* <NotificationPartial /> */}
			<CompanySelectorButton />
			<SettingsPartial />
			{/* <LanguageSelectorPartial /> */}
		</>
	);
};

export default DefaultHeaderRightCommon;
