import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
  });

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

export { getRouter };
