import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfile } from "@/lib/profile.functions";

// Shared between _authenticated's beforeLoad (ensureQueryData starts this during the auth
// gate, before any child route mounts), the dashboard loader, and AuthProvider — see
// use-portfolio.ts for why this calls the server function directly rather than through
// useServerFn. Having one query key means all three dedupe onto the same request/cache
// entry instead of each firing its own round trip to the profiles table.
export const profileQueryOptions = () =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
    staleTime: 15_000,
  });

export function useProfileQuery() {
  return useQuery(profileQueryOptions());
}

export function useRefreshProfileQuery() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["profile"] });
}
