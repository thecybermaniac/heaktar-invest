import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchPlans, fetchPortfolio } from "@/lib/portfolio.functions";

export function usePortfolio() {
  const load = useServerFn(fetchPortfolio);
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: () => load(),
    staleTime: 15_000,
  });
}

export function usePlans() {
  const load = useServerFn(fetchPlans);
  return useQuery({
    queryKey: ["plans"],
    queryFn: () => load(),
    staleTime: 5 * 60_000,
  });
}

export function useRefreshPortfolio() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["portfolio"] });
}
