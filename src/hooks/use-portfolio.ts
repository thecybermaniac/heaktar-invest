import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlans, fetchPortfolio } from "@/lib/portfolio.functions";

// Shared between the hooks below and route loaders (Route.loader calls
// queryClient.ensureQueryData(portfolioQueryOptions()) so data starts fetching during the
// route transition, not after the component mounts). Server functions are isomorphic —
// callable directly outside components — so no useServerFn binding is needed here.
export const portfolioQueryOptions = () =>
  queryOptions({
    queryKey: ["portfolio"],
    queryFn: () => fetchPortfolio(),
    staleTime: 15_000,
  });

export const plansQueryOptions = () =>
  queryOptions({
    queryKey: ["plans"],
    queryFn: () => fetchPlans(),
    staleTime: 5 * 60_000,
  });

export function usePortfolio() {
  return useQuery(portfolioQueryOptions());
}

export function usePlans() {
  return useQuery(plansQueryOptions());
}

export function useRefreshPortfolio() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["portfolio"] });
}
