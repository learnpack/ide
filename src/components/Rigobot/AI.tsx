export const RigoAI = {
  started: false,
  load: () => {
    if (RigoAI.started) return;
    const rigoAI = document.createElement("script");
    rigoAI.src = "https://unpkg.com/rigo-ai@0.1.7/dist/main.js";
    rigoAI.type = "text/javascript";
    rigoAI.async = true;
    document.head.appendChild(rigoAI);
    RigoAI.started = true;
  },
  init: ({
    chatHash,
    purposeSlug,
    userToken,
  }: {
    chatHash: string;
    purposeSlug: string;
    userToken: string;
  }) => {
    if (!RigoAI.started) RigoAI.load();

    // @ts-ignore
    if (window.rigo) {
      // @ts-ignore
      window.rigo.init(chatHash, {
        purposeSlug,
        user: {
          token: userToken,
        },
        // sockethost: "https://ai.4geeks.com",
        sockethost: "http://127.0.0.1:8003",
      });
      // @ts-ignore
      window.rigo.show({
        showBubble: true,
        collapsed: true,
      });
    }
  },
  useTemplate: ({
    slug,
    inputs,
    target,
  }: {
    slug: string;
    inputs: Record<string, string>;
    target: HTMLElement;
  }) => {
    // @ts-ignore
    const job = window.rigo.complete({
      templateSlug: slug,
      payload: {
        ...inputs,
      },
      target,
      format: "html",
      onComplete: (data: any) => {
        console.log("data", data);
      },
    });

    job.run();
  },
};
