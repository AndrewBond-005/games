import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// @ts-ignore: Allow side-effect import of CSS file without type declarations
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
