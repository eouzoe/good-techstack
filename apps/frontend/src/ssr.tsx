import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

export default createServerEntry({
  fetch(request: Readonly<Request>) {
    return handler.fetch(request);
  },
});
