import { Outlet, createRootRoute } from "@tanstack/react-router";

const RootComponent = () => <Outlet />;

export const Route = createRootRoute({
  component: RootComponent,
});
