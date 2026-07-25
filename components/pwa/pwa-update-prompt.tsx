"use client";

import { useEffect, useState } from "react";

export function PwaUpdatePrompt() {
  const [show, setShow] = useState(false);
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        setSwRegistration(reg);
        setShow(true);
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setSwRegistration(reg);
              setShow(true);
            }
          });
        }
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      }
    );
  }, []);

  const handleUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({
        type: "SKIP_WAITING",
      });
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-600 text-white p-4 rounded-2xl shadow-2xl z-50 flex flex-col gap-3 border border-blue-500">
      <div className="flex flex-col">
        <span className="font-extrabold text-sm tracking-tight">
          Update Available
        </span>
        <span className="text-xs text-blue-100 mt-1">
          A new version of the application is available.
        </span>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setShow(false)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-200 hover:text-white transition"
        >
          Dismiss
        </button>
        <button
          onClick={handleUpdate}
          className="bg-white text-blue-600 px-4 py-1.5 rounded-xl text-xs font-extrabold shadow hover:bg-blue-50 transition"
        >
          Update Now
        </button>
      </div>
    </div>
  );
}
