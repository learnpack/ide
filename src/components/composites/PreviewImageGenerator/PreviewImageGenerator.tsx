// import React, { useEffect } from "react"
import html2canvas from "html2canvas";

import { useEffect, useState } from "react";
import useStore from "../../../utils/store";
import {
  checkPreviewImage,
  DEV_MODE,
  uploadBlobToBucket,
} from "../../../utils/lib";
import { useTranslation } from "react-i18next";

// import useStore from "../utils/store"
// import { uploadImageToBucket } from "../utils/lib"
// import { slugify } from "../utils/creatorUtils"
// import { eventBus } from "../utils/eventBus"
// import { SVGS } from "../assets/svgs"

function proxify(link: string) {
  // Validar que el enlace no sea vacío
  if (!link) {
    return "https://placehold.co/100x100";
  }

  const encodedUrl = btoa(link);
  return `${DEV_MODE ? "http://localhost:3000" : ""}/proxy?url=${encodedUrl}`;
}

const PreviewGenerator: React.FC = () => {
  const { t } = useTranslation();

  const confi = useStore((state) => state.configObject);
  const user = useStore((state) => state.user);
  const language = useStore((state) => state.language);
  const [generatePreviewImage, setGeneratePreviewImage] = useState(false);

  useEffect(() => {
    if (confi.config?.slug) {
      checkPreviewImage(confi.config?.slug).then((data) => {
        if (data.exists) {
          console.log("Preview image already exists", data);

          setGeneratePreviewImage(false);
        } else {
          setGeneratePreviewImage(true);
        }
      });
    }
  }, [confi.config?.slug]);

  useEffect(() => {
    const handleDownload = () => {
      const previewElement = document.getElementById("preview");
      if (previewElement) {
        html2canvas(previewElement, {
          useCORS: true,
        }).then(async (canvas) => {
          //   const anchor = document.createElement("a");
          //   anchor.href = canvas.toDataURL("image/png");
          //   anchor.download = "preview.png";
          //   anchor.click();
          console.log("Canvas created!");

          canvas.toBlob(async (blob) => {
            if (!blob) {
              console.error("No blob found");
              return;
            }

            try {
              console.log("Uploading blob to bucket", blob);

              await uploadBlobToBucket(
                blob,
                `courses/${confi.config?.slug}/preview.png`
              );
            } catch (error) {
              console.error("Error uploading image to bucket", error);
            } finally {
              setGeneratePreviewImage(false);
            }
          }, "image/png");
        });
      }
    };

    if (
      confi &&
      Object.keys(confi.config?.title || {}).length > 0 &&
      generatePreviewImage
    ) {
      setTimeout(() => {
        handleDownload();
      }, 2000);
    }
  }, [generatePreviewImage]);

  if (!generatePreviewImage) {
    return <></>;
  }

  return (
    <div
      id="preview"
      style={{
        width: "1095px",
        height: "575px",
        background: "white",
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="padding-big"
        style={{
          background: "var(--color-blue-rigo)",
        }}
      />
      <div className="px-big -mt-5">
        <h1 className="text-7xl mt-50px">
          {confi.config?.title?.[language] || confi.config?.title?.us}
        </h1>
        <section className="flex-x align-center justify-between">
          <div className="flex-x  gap-big align-center mt-50px">
            <img
              style={{
                width: "100px",
                height: "100px",
              }}
              src={proxify(user?.profile?.avatar_url || "")}
              alt="Profile"
              className="rounded-full"
            />
            <div className="flex-y gap-small">
              <p style={{ fontSize: "30px" }} className="text-bold m-0">
                Author: {user?.first_name} {user?.last_name}
              </p>
              <small style={{ fontSize: "20px" }} className="m-0">
                {t("publishedOn")}: {new Date().toLocaleDateString()}
              </small>
            </div>
          </div>
          <div className="ml-auto">
            <img
              style={{
                width: "100px",
              }}
              src="/logo-192.png"
              alt="Learnpack"
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default PreviewGenerator;
