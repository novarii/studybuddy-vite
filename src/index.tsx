import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Studybuddy } from "./screens/Studybuddy";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Studybuddy />
  </StrictMode>,
);
