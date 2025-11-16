import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CopilotKit
      runtimeUrl="http://localhost:3000/api/copilotkit"
      agent="studybuddy_agent"
    >
      <App />
    </CopilotKit>
  </StrictMode>
);
