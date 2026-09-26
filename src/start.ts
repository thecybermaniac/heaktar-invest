import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { renderDesktopBlockedPage } from "./lib/desktop-blocked-page";
import { isPhoneUserAgent, isCrawlerUserAgent } from "./lib/device";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// The app is mobile-only for real visitors: anything that isn't a phone browser (desktop,
// tablet, curl, ...) gets a static "use your phone" page instead of the app shell. Search
// engines and link-preview bots (Googlebot, facebookexternalhit, Twitterbot, WhatsApp, ...)
// are explicitly let through instead — they only ever fetch a page's <head> tags for search
// results / share cards, never "use" the app, and most of them don't present a phone-like
// UA in the first place, so without this they'd get the blocked page and every shared link
// would show a generic "use your phone" card instead of the real banner/description.
const deviceGateMiddleware = createMiddleware().server(async ({ request, handlerType, next }) => {
  const ua = request.headers.get("user-agent") ?? "";
  if (handlerType === "router" && !isPhoneUserAgent(ua) && !isCrawlerUserAgent(ua)) {
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
