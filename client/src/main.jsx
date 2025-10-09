import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./theme.css"; // global dark-mode + motion

const container = document.getElementById("root");
if (!container) throw new Error("#root not found");
createRoot(container).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
