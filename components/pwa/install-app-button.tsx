"use client";

import React, { useEffect, useState } from "react";
import { Download, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone =
      window.matchMedia("(display-mode: standalone)")
        .matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(checkStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const detectIos = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(detectIos);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosHelp(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone) return null;
  if (!deferredPrompt && !isIos) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
      >
        <Download size={14} />
        Install App
      </button>

      {showIosHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative border border-slate-100">
            <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
              Install CardFlow
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Install CardFlow on your iOS device to use it as a standalone application:
            </p>

            <ol className="mt-4 space-y-3 text-xs text-slate-700 font-medium">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold shrink-0">
                  1
                </span>
                <span className="flex items-center gap-1.5 mt-0.5">
                  Tap the share button{" "}
                  <Share
                    size={14}
                    className="text-blue-600 inline"
                  />{" "}
                  in Safari.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold shrink-0">
                  2
                </span>
                <span className="flex items-center gap-1.5 mt-0.5">
                  Select{" "}
                  <strong className="text-slate-900 font-bold">
                    Add to Home Screen
                  </strong>{" "}
                  <Plus
                    size={14}
                    className="text-slate-600 inline"
                  />
                  .
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold shrink-0">
                  3
                </span>
                <span className="mt-0.5">
                  Tap{" "}
                  <strong className="text-slate-900 font-bold">
                    Add
                  </strong>{" "}
                  in the top right.
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosHelp(false)}
              className="mt-6 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
