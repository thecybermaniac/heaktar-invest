import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listNotifications } = await import("./notifications.server");
    return listNotifications(context.supabase, context.userId);
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!data.id) throw new Error("Notification id is required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { markNotificationRead: markRead } = await import("./notifications.server");
    await markRead(context.supabase, context.userId, data.id);
    return { success: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { markAllNotificationsRead: markAllRead } = await import("./notifications.server");
    await markAllRead(context.supabase, context.userId);
    return { success: true };
  });
