import { createFileRoute } from "@tanstack/react-router";

const RouteComponent = () => (
  <main>
    <h1>good-techstack</h1>
  </main>
);

export const Route = createFileRoute("/")({
  component: RouteComponent,
});
