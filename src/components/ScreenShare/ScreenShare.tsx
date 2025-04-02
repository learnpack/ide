import { useState, useRef } from "react";
import { Modal } from "../mockups/Modal";

export const ScreenShareSmart = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const pipWindowRef = useRef<Window | null>(null);

  const analyzeAndSuggest = async (blob: Blob): Promise<string> => {
    console.log("Analyzing and suggesting...", blob);
    
    await new Promise((r) => setTimeout(r, 1500));
    return "🧠 Sugerencia: Parece que estás editando código.";
  };

  const createSharedUI = (
    win: Window,
    stream: MediaStream,
    onClose: () => void
  ) => {
    win.document.body.innerHTML = "";
    win.document.title = "Screen Preview";
    win.document.body.style.margin = "0";
    win.document.body.style.background = "#111";
    win.document.body.style.display = "flex";
    win.document.body.style.flexDirection = "column";
    win.document.body.style.alignItems = "center";
    win.document.body.style.justifyContent = "center";
    win.document.body.style.color = "white";
    win.document.body.style.fontFamily = "sans-serif";

    const video = win.document.createElement("video");
    video.style.width = "100%";
    video.autoplay = true;
    video.muted = true;
    video.srcObject = stream;
    win.document.body.appendChild(video);

    const suggestBtn = win.document.createElement("button");
    suggestBtn.innerText = "💡 Dar Sugerencias";
    suggestBtn.style.marginTop = "12px";
    suggestBtn.style.padding = "8px 16px";
    suggestBtn.style.fontSize = "16px";
    suggestBtn.style.cursor = "pointer";
    suggestBtn.onclick = async () => {
      const canvas = win.document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) return;

      const a = win.document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `captura-${Date.now()}.png`;
      a.click();

      const feedback = await analyzeAndSuggest(blob);
      const msg = win.document.createElement("div");
      msg.innerText = feedback;
      msg.style.marginTop = "12px";
      msg.style.padding = "8px";
      msg.style.background = "#222";
      msg.style.borderRadius = "6px";
      msg.style.color = "lightgreen";
      msg.style.fontSize = "14px";
      msg.style.textAlign = "center";
      win.document.body.appendChild(msg);
    };
    win.document.body.appendChild(suggestBtn);

    const stopBtn = win.document.createElement("button");
    stopBtn.innerText = "🛑 Detener Compartir";
    stopBtn.style.marginTop = "10px";
    stopBtn.style.padding = "8px 16px";
    stopBtn.style.fontSize = "16px";
    stopBtn.onclick = onClose;
    win.document.body.appendChild(stopBtn);
  };

  const startScreenShare = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      streamRef.current = mediaStream;
      setIsSharing(true);

      if ("documentPictureInPicture" in window) {
        const pipWindow = await (
          window as any
        ).documentPictureInPicture.requestWindow({
          width: 600,
          height: 400,
        });
        pipWindowRef.current = pipWindow;

        createSharedUI(pipWindow, mediaStream, stopScreenShare);

        pipWindow.addEventListener("pagehide", stopScreenShare);
      } else {
        const fallbackWin = window.open(
          "",
          "ScreenPreview",
          "width=600,height=400"
        );
        if (!fallbackWin) throw new Error("No se pudo abrir la ventana");
        pipWindowRef.current = fallbackWin;
        createSharedUI(fallbackWin, mediaStream, stopScreenShare);
        fallbackWin.onbeforeunload = stopScreenShare;
      }
    } catch (err) {
      console.error("Error al compartir pantalla:", err);
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close();
    }

    pipWindowRef.current = null;
    setIsSharing(false);
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <Modal outsideClickHandler={stopScreenShare}>
          <h1>¿Listo para compartir pantalla?</h1>
          <div style={{ marginTop: "1rem" }}>
            {!isSharing ? (
              <button onClick={startScreenShare}>Iniciar Compartir</button>
            ) : (
              <button onClick={stopScreenShare}>Detener Compartir</button>
            )}
          </div>
        </Modal>
      )}
      <button onClick={() => setIsOpen(true)}>Compartir pantalla</button>
    </>
  );
};
