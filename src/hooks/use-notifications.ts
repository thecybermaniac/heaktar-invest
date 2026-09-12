import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/notifications.functions";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const QUERY_KEY = ["notifications"];

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const load = useServerFn(fetchNotifications);

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => load(),
    enabled: !!user,
    staleTime: 15_000,
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
