import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import lockersInternalService from '../lockersInternalService';
import {
    ITechWithdrawRequest,
    ITechDropOffRequest,
    ITechResetRequest,
    ISetReadyForPickupRequest
} from '@/interface/lockers.interface';

// ============================================================================
// 🔍 QUERIES (GET)
// ============================================================================

export const useGetLocations = () => {
    return useQuery({
        queryKey: ['lockerLocations'],
        queryFn: lockersInternalService.getLocations,
    });
};

export const useGetLockersByLocation = (locationId: number) => {
    return useQuery({
        queryKey: ['lockers', locationId],
        queryFn: () => lockersInternalService.getLockersByLocation(locationId),
        // Solo se ejecuta si locationId existe (evita peticiones con undefined)
        enabled: !!locationId, 
    });
};

export const useGetPrivateInfo = (qrToken: string) => {
    return useQuery({
        queryKey: ['lockerPrivateInfo', qrToken],
        queryFn: () => lockersInternalService.getPrivateInfo(qrToken),
        enabled: !!qrToken,
    });
};

export const useGetServiceOrders = () => {
    return useQuery({
        queryKey: ['serviceOrders'],
        queryFn: lockersInternalService.getServiceOrders,
    });
};

// ============================================================================
// 🛠️ MUTATIONS (POST / PATCH)
// ============================================================================

export const useTechWithdraw = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ITechWithdrawRequest) => lockersInternalService.techWithdraw(data),
        onSuccess: () => {
            // Refresca la lista de casilleros y órdenes automáticamente
            queryClient.invalidateQueries({ queryKey: ['lockers'] });
            queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
        },
    });
};

export const useTechDropOff = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ITechDropOffRequest) => lockersInternalService.techDropOff(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lockers'] });
            queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
        },
    });
};

export const useSetReadyForPickup = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ISetReadyForPickupRequest) => lockersInternalService.setReadyForPickup(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lockers'] });
            queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
        },
    });
};

export const useResetLocker = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: ITechResetRequest) => lockersInternalService.resetLocker(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lockers'] });
        },
    });
};