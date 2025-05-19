// src/hooks/useFeatures.ts
import { useEffect } from "react";
import { useGetFeaturesQuery } from "@/services/RtkQueryService";
import { useDispatch, useSelector } from "react-redux";
import { selectFeaturesStatus } from "@/store/slices/featuresSlice/featuresSlice";
import { AppDispatch } from "@/store/storeSetup";

// Define FeatureStatus enum
export enum FeatureStatus {
  Loading = "loading",
  Failed = "failed",
  Succeeded = "succeeded",
}

export default function useFeatures() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, isError, data } = useGetFeaturesQuery(undefined);
  const status = useSelector(selectFeaturesStatus);

  // (opcional) si quieres despachar algo extra:
  useEffect(() => {
    if (data) {
      // por ejemplo guardar en otro slice… o nada
    }
  }, [data, dispatch]);

  if (isLoading) return FeatureStatus.Loading;
  if (isError) return FeatureStatus.Failed;
  return FeatureStatus.Succeeded;
}
