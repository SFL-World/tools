import { useCallback } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getData, getFlowerUsdPrice, getList } from "../api/resources.api.js";

export function useGetList() {
  return useQuery({
    queryKey: ["getList"],
    queryFn: () => getList(),
  });
}

export function useGetData(id) {
  return useQuery({
    queryKey: ["getData", id],
    queryFn: () => getData(id),
  });
}

export function useGetDataList(ids) {
  const combine = useCallback(
    (results) => ({
      data: results.map((result) => result.data),
      isLoading: results.some((result) => result.isLoading),
    }),
    [],
  );

  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ["getData", id],
      queryFn: () => getData(id),
    })),
    combine,
  });
}

export function useGetFlowerUsdPrice(enabled) {
  return useQuery({
    queryKey: ["flowerUsdPrice"],
    queryFn: getFlowerUsdPrice,
    enabled,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
