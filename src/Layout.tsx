import React from "react";
import { Toaster } from "react-hot-toast";
import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Layout: React.FC = () => {
  return (
    <>
      <Toaster />
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
    </>
  );
};
