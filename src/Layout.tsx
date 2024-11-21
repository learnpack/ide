import React from "react";
import { Toaster } from "react-hot-toast";
import { Outlet } from "react-router-dom";

export const Layout: React.FC = () => {
  return (
    <>
      <Toaster />
      <Outlet />
    </>
  );
};
