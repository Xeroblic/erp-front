import { useQuery, useMutation } from '@tanstack/react-query';
import lockersPublicService from '../lockersPublicService';
import { ICheckInRequest, ICheckOutRequest } from '@/interface/lockers.interface';

// ============================================================================
// 🔍 QUERIES (GET)
// ============================================================================

export const useGetLockerInfo = (token: string) => {
	return useQuery({
		queryKey: ['lockerPublicInfo', token],
		queryFn: () => lockersPublicService.getLockerInfo(token),
		enabled: !!token, // No hace la petición si no hay token aún
	});
};

// ============================================================================
// 🛠️ MUTATIONS (POST)
// ============================================================================

export const useCheckInLocker = () => {
	return useMutation({
		mutationFn: (data: ICheckInRequest) => lockersPublicService.checkInLocker(data),
		// Aquí puedes agregar un onSuccess general si quisieras
	});
};

export const useCheckOutLocker = () => {
	return useMutation({
		mutationFn: (data: ICheckOutRequest) => lockersPublicService.checkOutLocker(data),
	});
};
