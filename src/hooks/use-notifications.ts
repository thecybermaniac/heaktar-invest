import { useEffect } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/notifications.functions";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const QUERY_KEY = ["notifications"];

// Shared with the dashboard/notifications route loaders — see use-portfolio.ts for why this
// calls the server function directly rather than through useServerFn.
export const notificationsQueryOptions = () =>
  queryOptions({
    queryKey: QUERY_KEY,
    queryFn: () => fetchNotifications(),
    staleTime: 15_000,
  });

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    ...notificationsQueryOptions(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const unread = query.data?.filter((n) => !n.read).length ?? 0;

  return { ...query, unread };
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const run = useServerFn(markNotificationRead);
  return async (id: string) => {
    await run({ data: { id } });
    qc.invalidateQueries({ queryKey: QUERY_KEY });
  };
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const run = useServerFn(markAllNotificationsRead);
  return async () => {
    await run();
    qc.invalidateQueries({ queryKey: QUERY_KEY });
  };
}
