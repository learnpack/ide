export const Dropdown = ({
  children,
  className,
  openingElement,
  spaceBetween = 5,
}: {
  children: React.ReactNode;
  className?: string;
  openingElement?: React.ReactNode;
  spaceBetween?: number;
}) => {
  return (
    <div className={`dropdown ${className}`}>
      {openingElement}
      <div style={{ gap: spaceBetween }} className="dropdown-content">
        {children}
      </div>
    </div>
  );
};
