import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster.tsx";

const commitSha: string = import.meta.env.VITE_COMMIT_SHA || "dev";
const repoUrl: string = import.meta.env.VITE_REPO_URL || "";

const sp = new URLSearchParams(window.location.search);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App versionName={commitSha} sp={sp} repoUrl={repoUrl} />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
);
