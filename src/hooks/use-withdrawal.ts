import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBanks } from "@/lib/paystack.functions";
import { fetchWithdrawalMethod } from "@/lib/withdrawals.functions";

// Shared with the withdraw route loaders — see use-portfolio.ts for why these call the
// server function directly rather than through useServerFn.
export const withdrawalMethodQueryOptions = () =>
  queryOptions({
    queryKey: ["withdrawal-method"],
    queryFn: () => fetchWithdrawalMethod(),
    staleTime: 60_000,
  });

export const banksQueryOptions = () =>
  queryOptions({
    queryKey: ["banks"],
    queryFn: () => fetchBanks(),
    // the Nigerian bank list barely changes; cache it hard to avoid hammering Paystack
    staleTime: 24 * 60 * 60_000,
  });

export function useWithdrawalMethod() {
  return useQuery(withdrawalMethodQueryOptions());
}

export function useRefreshWithdrawalMethod() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["withdrawal-method"] });
}

export function useBanks() {
  return useQuery(banksQueryOptions());
}
