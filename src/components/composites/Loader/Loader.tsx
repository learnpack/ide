export const Loader = ({
  text,
  svg,
  extraClass,
}: {
  text?: string;
  svg: React.ReactNode;
  extraClass?: string;
}) => {
  return (
    <div className={`loader ${extraClass}`}>
      <div className="loader-icon">{svg}</div>
      {text && <div className="loader-text">{text}</div>}
    </div>
  );
};
