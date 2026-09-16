import React from "react";
import ReactDOM from "react-dom/client";
// @ts-expect-error Mantine exposes this stylesheet as a side-effect import without declarations.
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";

const queryClient = new QueryClient();
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark">
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </MantineProvider>
  </React.StrictMode>,
);
