import { useEffect } from "react";
import { useGetFeaturesQuery } from "@/services/RtkQueryService";
import { useDispatch, useSelector } from "react-redux";
import { selectFeaturesStatus } from "@/store/slices/featuresSlice/featuresSlice";
import { AppDispatch } from "@/store/storeSetup";


export enum FeatureStatus {
  Loading = "loading",
  Failed = "failed",
  Succeeded = "succeeded",
}

export default function useFeatures() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, isError, data } = useGetFeaturesQuery(undefined);
  const status = useSelector(selectFeaturesStatus);

  // useEffect(() => {
  //   if (data) {
      
  //   }
  // }, [data, dispatch]);

  if (isLoading) return FeatureStatus.Loading;
  if (isError) return FeatureStatus.Failed;
  return FeatureStatus.Succeeded;
}
