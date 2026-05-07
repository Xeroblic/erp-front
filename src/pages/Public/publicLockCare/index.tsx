import React from 'react';
import { usePublicLockCare } from './hooks/usePublicLockCare';
import { PublicLockCareView } from './PublicLockCareView';

export default function PublicLockCare() {
	const {
		isLoadingInfo,
		infoError,
		suggestedLockers,
		formik,
		pinReceived,
		lockerNumberReceived,
		isPinModalOpen,
		isCheckInComplete,
		handleClosePinModal,
		handleOpenPinModal,
		isTerminosOpen,
		handleOpenTerms,
		handleCloseTerms,
		handleAcceptTerms,
	} = usePublicLockCare();

	return (
		<PublicLockCareView
			isLoadingInfo={isLoadingInfo}
			infoError={infoError}
			suggestedLockers={suggestedLockers}
			formik={formik}
			pinReceived={pinReceived}
			lockerNumberReceived={lockerNumberReceived}
			isPinModalOpen={isPinModalOpen}
			isCheckInComplete={isCheckInComplete}
			handleClosePinModal={handleClosePinModal}
			handleOpenPinModal={handleOpenPinModal}
			isTerminosOpen={isTerminosOpen}
			handleOpenTerms={handleOpenTerms}
			handleCloseTerms={handleCloseTerms}
			handleAcceptTerms={handleAcceptTerms}
		/>
	);
}
