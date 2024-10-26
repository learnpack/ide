import SimpleButton from "../../mockups/SimpleButton";
import useStore from "../../../utils/store";
import { useState, useRef, useEffect } from "react";
import { OpenWindowLink } from "../../composites/OpenWindowLink";
import { useTranslation } from "react-i18next";
import TagManager from "react-gtm-module";
import { Modal } from "../../mockups/Modal";
import { svgs } from "../../../assets/svgs";
import toast from "react-hot-toast";

export default function LoginModal() {
  const { setOpenedModals, loginToRigo, openLink } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
    loginToRigo: state.loginToRigo,
    openLink: state.openLink,
  }));

  const { t } = useTranslation();
  const backdropRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  //   const [passwordInputType, setPasswordInputType] = useState("password");
  const [isLoading, setIsLoading] = useState(false);

  const handleClickOutside = (event: any) => {
    if (backdropRef.current === event.target) {
      setOpenedModals({ login: false });
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const login = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);

    const isLoggedId = await loginToRigo({
      email: email,
      password: password,
    });
    if (!isLoggedId) {
      setIsLoading(false);
    }
  };

  const sendAnalytics = () => {
    TagManager.dataLayer({
      dataLayer: {
        event: "sign_up_attempt",
      },
    });
  };

  function stringToBase64(str: string) {
    return btoa(unescape(encodeURIComponent(str))); // Convierte la cadena a Base64
  }

  function getCurrentUrlWithQueryParams() {
    const currentUrl = window.location.href;
    return currentUrl;
  }

  const redirectGithub = () => {
    let currentUrl = getCurrentUrlWithQueryParams();

    toast.success("Redirecting to GitHub...");
    openLink(
      `https://breathecode.herokuapp.com/v1/auth/github/?url=${stringToBase64(
        currentUrl
      )}`,
      { redirect: true }
    );
  };

  return (
    <>
      <Modal
        extraClass="login-modal"
        outsideClickHandler={() => {
          setOpenedModals({ login: false });
        }}
      >
        <div className="modal-content">
          <h2>{t("login")}</h2>

          <div>
            <p>{t("login-message")}</p>
          </div>

          <div>
            <SimpleButton
              extraClass="btn-dark w-100 justify-center big rounded"
              text={t("login-github")}
              svg={svgs.github}
              action={redirectGithub}
            />
          </div>
          <form action="">
            <div className="separator">
              <div></div>
              <h4>{t("or")}</h4>
              <div></div>
            </div>
            <input
              placeholder="Email"
              type="text"
              autoComplete="email"
              name="email"
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
            <div>
              <input
                placeholder={t("Password")}
                autoComplete="current-password"
                type={"password"}
                name="password"
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            </div>

            <div className="my-2">
              <SimpleButton
                text={isLoading ? t("Loading...") : t("login")}
                action={login}
                extraClass="bg-blue big"
              />
              <SimpleButton
                extraClass="btn-dark big rounded"
                action={() => {
                  setOpenedModals({ login: false });
                }}
                text={t("skip")}
              />
            </div>

            <div>
              <span>
                {t("Don't have an account? ")}
                <OpenWindowLink
                  callback={sendAnalytics}
                  text={t("Sign up here!")}
                  href="https://4geeks.com/pricing?plan=basic"
                />{" "}
              </span>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
