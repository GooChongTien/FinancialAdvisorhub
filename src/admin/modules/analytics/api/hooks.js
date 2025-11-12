import { useQuery } from "@tanstack/react-query";
import {
  fetchGoals,
  fetchProductionSummary,
  fetchCommissionSummary,
  fetchBenchmarkSummary,
} from "./index";

export function useGoals(scope) {
  return useQuery({
    queryKey: ["goals", scope],
    queryFn: () => fetchGoals({ scope }),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
  });
}

export function useProduction(scope, period) {
  return useQuery({
    queryKey: ["production", scope, period],
    queryFn: () => fetchProductionSummary({ scope, period }),
    staleTime: 60 * 1000,
    refetchOnMount: "always",
  });
}

export function useCommission(scope, period) {
  return useQuery({
    queryKey: ["commission", scope, period],
    queryFn: () => fetchCommissionSummary({ scope, period }),
    staleTime: 60 * 1000,
    refetchOnMount: "always",
  });
}

export function useBenchmark(scope) {
  return useQuery({
    queryKey: ["benchmark", scope],
    queryFn: () => fetchBenchmarkSummary({ scope }),
    staleTime: 10 * 60 * 1000,
    refetchOnMount: "always",
  });
}
