import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { renderDesktopBlockedPage } from "./lib/desktop-blocked-page";
import { isPhoneUserAgent } from "./lib/device";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// The app is mobile-only: anything that isn't a phone browser (desktop, tablet, bots,
// curl, ...) gets a static "use your phone" page instead of the app shell. Runs for
// page/asset requests ("router") only — server function calls ("serverFn") are never
// reachable on their own since the client bundle that issues them never loads for a
// blocked visitor in the first place.
const deviceGateMiddleware = createMiddleware().server(async ({ request, handlerType, next }) => {
  if (handlerType === "router" && !isPhoneUserAgent(request.headers.get("user-agent") ?? "")) {
    return new Response(renderDesktopBlockedPage(), {
      status: 403,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, deviceGateMiddleware, csrfMiddleware],
}));
