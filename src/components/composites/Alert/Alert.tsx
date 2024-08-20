import { ReactNode } from "react";

type TAlertProps = {
  children: ReactNode;
};

export const Alert = ({ children }: TAlertProps) => {
  return <div className="alert">{children}</div>;
};
