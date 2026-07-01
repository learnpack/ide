import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import TagManager from "react-gtm-module";
import { Layout } from "./Layout.tsx";
import { PreviewHTMLPage } from "./components/composites/PreviewHTML/PreviewHTML.tsx";

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
    errorElement: <App />,
    children: [
      {
        path: "/",
        element: <App />,
      },
      {
        path: "/preview/:slug",
        element: <App />,
      },
      {
        path: "/config/index.html",
        element: <App />,
      },
      {
        path: "/preview/:slug/webview",
        element: <PreviewHTMLPage />,
      },
      {
        // Catch-all: el LMS sirve el SCO en una ruta base anidada (ej.
        // /scorm/file/<hash>/config/index.html) que no matchea las rutas fijas.
        // Renderiza <App/> dentro del <Layout> (TooltipProvider) para cualquier ruta.
        path: "*",
        element: <App />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// sw.js no se incluye en el paquete SCORM y su scope absoluto "/sw.js" falla bajo
// la ruta anidada del LMS, así que se omite el registro cuando corremos como SCO.
const isScormPath = window.location.pathname.endsWith("/config/index.html");
if ("serviceWorker" in navigator && !isScormPath) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => console.log("Service Worker registrado:", reg))
    .catch((err) => console.error("Error al registrar Service Worker:", err));
}
