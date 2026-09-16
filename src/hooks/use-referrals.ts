import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchReferralSummary } from "@/lib/referrals.functions";

export function useReferrals() {
  const load = useServerFn(fetchReferralSummary);
  return useQuery({
    queryKey: ["referrals"],
    queryFn: () => load(),
    staleTime: 30_000,
  });
}
