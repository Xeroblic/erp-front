import { useEffect } from "react";
import { useGetFeaturesQuery } from "@/services/RtkQueryService";
import { useAppDispatch, useAppSelector } from "@/store";
import {
    setStatus,
    setFeatures,
    selectFeaturesStatus,
    FeatureStatus,
} from "@/store/slices/featuresSlice/featuresSlice";

export default function useFeatures() {
    const dispatch = useAppDispatch();
    const status = useAppSelector(selectFeaturesStatus);
    const { data, error, isLoading } = useGetFeaturesQuery();

    useEffect(() => {
        if (isLoading) {
            dispatch(setStatus(FeatureStatus.Loading));
        } else if (error) {
            dispatch(setStatus(FeatureStatus.Failed));
        } else if (data) {
            dispatch(setFeatures(data));
            dispatch(setStatus(FeatureStatus.Succeeded));
        }
    }, [isLoading, data, error, dispatch]);

    return status;
}
