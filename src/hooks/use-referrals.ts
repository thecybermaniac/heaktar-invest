import { queryOptions, useQuery } from "@tanstack/react-query";
import { fetchReferralSummary } from "@/lib/referrals.functions";

// Shared with the referral route's loader — see use-portfolio.ts for why this calls the
// server function directly rather than through useServerFn.
export const referralsQueryOptions = () =>
  queryOptions({
    queryKey: ["referrals"],
    queryFn: () => fetchReferralSummary(),
    staleTime: 30_000,
  });

export function useReferrals() {
  return useQuery(referralsQueryOptions());
}
