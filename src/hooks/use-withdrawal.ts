import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchBanks } from "@/lib/paystack.functions";
import { fetchWithdrawalMethod } from "@/lib/withdrawals.functions";

export function useWithdrawalMethod() {
  const load = useServerFn(fetchWithdrawalMethod);
  return useQuery({
    queryKey: ["withdrawal-method"],
    queryFn: () => load(),
    staleTime: 60_000,
  });
}

export function useRefreshWithdrawalMethod() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["withdrawal-method"] });
}

export function useBanks() {
  const load = useServerFn(fetchBanks);
  return useQuery({
    queryKey: ["banks"],
    queryFn: () => load(),
    // the Nigerian bank list barely changes; cache it hard to avoid hammering Paystack
    staleTime: 24 * 60 * 60_000,
  });
}
