import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Preload a route's beforeLoad/loader as soon as a <Link> is hovered (or touched, on
    // mobile) instead of waiting for the tap to land — the request is already in flight by
    // the time the navigation actually happens.
    defaultPreload: "intent",
    // 0 meant every preload was immediately marked stale and thrown away, making the
    // preload above pointless. This keeps a preloaded match usable for a few seconds if the
    // user does follow through.
    defaultPreloadStaleTime: 5_000,
  });

  return router;
};
