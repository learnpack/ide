import { LucideProps } from "lucide-react";
import * as Icons from "lucide-react";

export type IconName = keyof typeof Icons;

interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export const Icon = ({
  name,
  size = 24,
  color,
  strokeWidth = 2,
  className = "",
  ...props
}: IconProps) => {
  const LucideIcon = Icons[name] as React.ComponentType<LucideProps>;

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return null;
  }

  return (
    <LucideIcon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      {...props}
    />
  );
};

