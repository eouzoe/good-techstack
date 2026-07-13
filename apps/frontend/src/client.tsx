import { StartClient } from "@tanstack/react-start/client";
import { hydrateRoot } from "react-dom/client";
import { StrictMode } from "react";

hydrateRoot(
  document,
  <StrictMode>
    <StartClient />
  </StrictMode>,
);
