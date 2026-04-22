import React from 'react';
import { usePublicLockCare } from './hooks/usePublicLockCare';
import { PublicLockCareView } from './PublicLockCareView';

export default function PublicLockCare() {
	const {
		isLoadingInfo,
		infoError,
		formik,
		pinReceived,
		isTerminosOpen,
		handleOpenTerms,
		handleCloseTerms,
		handleAcceptTerms,
	} = usePublicLockCare();

	return (
		<PublicLockCareView
			isLoadingInfo={isLoadingInfo}
			infoError={infoError}
			formik={formik}
			pinReceived={pinReceived}
			isTerminosOpen={isTerminosOpen}
			handleOpenTerms={handleOpenTerms}
			handleCloseTerms={handleCloseTerms}
			handleAcceptTerms={handleAcceptTerms}
		/>
	);
}
