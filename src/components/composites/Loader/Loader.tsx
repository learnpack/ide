export const Loader = ({
  text,
  svg,
}: {
  text: string;
  svg: React.ReactNode;
}) => {
  return (
    <div className="loader">
      <div className="loader-icon">{svg}</div>
      <div className="loader-text">{text}</div>
    </div>
  );
};
