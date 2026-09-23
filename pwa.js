(() => {
  const installButton = document.getElementById("installApp");
  const updateNotice = document.getElementById("updateNotice");
  const refreshButton = document.getElementById("refreshApp");
  let installPrompt = null;
  let refreshing = false;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    installPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButton.hidden = true;
  });

  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });

  navigator.serviceWorker.register("./sw.js").then(registration => {
    const showUpdate = () => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        updateNotice.hidden = false;
      }
    };
    showUpdate();
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", showUpdate);
    });
    refreshButton.addEventListener("click", () => {
      registration.waiting?.postMessage({type: "SKIP_WAITING"});
    });
  }).catch(error => {
    console.warn("Offline installation is unavailable:", error);
  });
})();
