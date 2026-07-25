"use client";

import { useEffect, useState } from "react";

export function useStandaloneMode(): boolean {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone =
      window.matchMedia("(display-mode: standalone)")
        .matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(checkStandalone);
  }, []);

  return isStandalone;
}
