import useStore from "../../utils/store";

type TOpenWindowLinkProps = {
  href: string;
  text: string;
  callback?: () => void;
};
export const OpenWindowLink = ({
  href,
  text,
  callback,
}: TOpenWindowLinkProps) => {
  const openLink = useStore((state) => state.openLink);

  const handleRedirect = (e: any) => {
    e.preventDefault();

    openLink(e.target.href);

    if (callback) {
      callback();
    }
  };

  return (
    <a href={href} onClick={handleRedirect}>
      {text}
    </a>
  );
};
