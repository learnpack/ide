import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import TagManager from "react-gtm-module";
import { Layout } from "./Layout.tsx";
import {
  PreviewHTMLPage,
  previewLoader,
} from "./components/composites/PreviewHTML/PreviewHTML.tsx";

const tagManagerArgs = {
  gtmId: "GTM-WCVQ4KJ",
  auth: "UziHoBlMGYrHZqefka0uXg",
  env: "env-1",
};

TagManager.initialize(tagManagerArgs);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <App />,
      },
      {
        path: "/preview",
        element: <PreviewHTMLPage />,
        loader: previewLoader,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => console.log("Service Worker registrado:", reg))
    .catch((err) => console.error("Error al registrar Service Worker:", err));
}
