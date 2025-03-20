import SimpleButton from "../../mockups/SimpleButton";
import useStore from "../../../utils/store";
import { useState, useRef, useEffect } from "react";
import { OpenWindowLink } from "../../composites/OpenWindowLink";
import { useTranslation } from "react-i18next";
import { Modal } from "../../mockups/Modal";
import { svgs } from "../../../assets/svgs";
import toast from "react-hot-toast";
import { BREATHECODE_HOST } from "../../../utils/lib";

export default function LoginModal() {
  const {
    setOpenedModals,
    loginToRigo,
    environment,
    openLink,
    authentication,
    reportEnrichDataLayer,
  } = useStore((state) => ({
    setOpenedModals: state.setOpenedModals,
    loginToRigo: state.loginToRigo,
    openLink: state.openLink,
    environment: state.environment,
    authentication: state.authentication,
    language: state.language,
    isIframe: state.isIframe,
    reportEnrichDataLayer: state.reportEnrichDataLayer,
  }));

  const { t } = useTranslation();
  const backdropRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

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

    if (!email || !password) {
      toast.error(t("please-fill-all-fields"));
      setIsLoading(false);
      return;
    }

    const isLoggedId = await loginToRigo({
      email: email,
      password: password,
      messages: {
        error: t("login-credentials-error"),
        success: t("login-success"),
      },
    });

    reportEnrichDataLayer("login", {
      method: "native",
    });

    if (!isLoggedId) {
      setIsLoading(false);
    }
  };

  const reportPasswordRecoveryAttempt = () => {
    reportEnrichDataLayer("tries_recover_password", {});
  };

  const reportSignUpAttempt = () => {
    reportEnrichDataLayer("sign_up_attempt", {});
  };

  function stringToBase64(str: string) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function getCurrentUrlWithQueryParams() {
    let currentUrl = window.location.origin + window.location.pathname;
  
    if (environment === "localhost") {
      return `${currentUrl}?autoclose=true`;
    }
  
    return window.location.href;
  }
  
  const redirectGithub = () => {
    let currentUrl = getCurrentUrlWithQueryParams();

    toast.success(t("redirecting-to-github"));
    openLink(
      `${BREATHECODE_HOST}/v1/auth/github/?url=${stringToBase64(currentUrl)}`,
      { redirect: true }
    );
  };

  const handleExit = () => {
    if (!authentication.mandatory) {
      setOpenedModals({ login: false });
    } else {
      toast.success(t("you-must-login-to-continue"), {
        icon: "🔒",
      });
    }
  };

  return (
    <>
      <Modal extraClass="login-modal" outsideClickHandler={handleExit}>
        <div className="modal-content">
          <div className="d-flex justify-between">
            <h2>{t("login")}</h2>
            <div className="bg-soft-blue d-flex flex-y justify-center padding-small rounded text-black mr-10">
              <p className="m-0 text-black">{t("Don't have an account? ")}</p>
              <p className="m-0">
                <OpenWindowLink
                  callback={reportSignUpAttempt}
                  text={t("Sign up here!")}
                  href="https://4geeks.com/pricing?plan=basic"
                />{" "}
              </p>
            </div>
          </div>

          <p>{t("login-message")}</p>

          {!showForm && (
            <>
              <div>
                <SimpleButton
                  extraClass="btn-dark w-100 justify-center big rounded text-bold"
                  text={t("login-github")}
                  svg={svgs.github}
                  action={redirectGithub}
                />
              </div>
              <div className="separator">
                <div></div>
                <h4>{t("or")}</h4>
                <div></div>
              </div>
              <div>
                <SimpleButton
                  extraClass="btn-dark w-100 justify-center big rounded text-bold"
                  text={t("login-with-email")}
                  svg={svgs.email}
                  action={() => {
                    setShowForm(true);
                  }}
                />
              </div>
            </>
          )}

          {showForm && (
            <form className="flex-y gap-small" action="" onSubmit={login}>
              <input
                placeholder="Email"
                type="email"
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
                  type="submit"
                  text={isLoading ? t("Loading...") : t("login")}
                  extraClass="bg-blue big"
                />
                <SimpleButton
                  extraClass="btn-dark big rounded"
                  action={() => {
                    setShowForm(false);
                  }}
                  text={t("back")}
                />
              </div>
              <div>
                <span>
                  {t("forgot-password")}
                  <OpenWindowLink
                    callback={reportPasswordRecoveryAttempt}
                    text={t("recover-it-here")}
                    href={`${BREATHECODE_HOST}/v1/auth/password/reset?url=${getCurrentUrlWithQueryParams()}`}
                  />{" "}
                </span>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </>
  );
}
