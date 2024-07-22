import SimpleButton from "../../mockups/SimpleButton";
import useStore from "../../../utils/store";
import { useState, useRef, useEffect } from "react";
import { OpenWindowLink } from "../../composites/OpenWindowLink";
import { useTranslation } from "react-i18next";
import TagManager from "react-gtm-module";
import { Modal } from "../../mockups/Modal";

export default function LoginModal() {
  const { setOpenedModals, loginToRigo } = useStore((state) => ({
    setToken: state.setToken,
    host: state.host,
    setOpenedModals: state.setOpenedModals,
    startConversation: state.startConversation,
    currentExercisePosition: state.currentExercisePosition,
    loginToRigo: state.loginToRigo,
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

  return (
    <>
      <Modal
        extraClass="login-modal"
        outsideClickHandler={() => {
          setOpenedModals({ login: false });
        }}
      >
        <div className="modal-content">
          <h2>Login </h2>

          <div>
            <p>{t("loginMessage")}</p>
          </div>

          <form action="">
            <input
              placeholder="Email"
              type="text"
              name="email"
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
            <div>
              <input
                placeholder={t("Password")}
                // type={passwordInputType}
                type={"password"}
                name="password"
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            </div>

            <div>
              <SimpleButton
                text={isLoading ? t("Loading...") : t("submit")}
                action={login}
                extraClass="bg-blue"
              />
              <SimpleButton
                extraClass="bg-secondary"
                action={() => {
                  setOpenedModals({ login: false });
                }}
                text={t("skip")}
              />
            </div>
            <span>
              {t("Don't have an account? ")}
              <OpenWindowLink
                callback={sendAnalytics}
                text={t("Sign up here!")}
                href="https://4geeks.com/pricing"
              />{" "}
            </span>
          </form>
        </div>
      </Modal>
    </>
  );
}
