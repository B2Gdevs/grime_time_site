"use client";

import { useEffect, useState } from "react";

let hasHydratedOnce = false;

export function useHydratedOnce(): boolean {
  const [hydrated, setHydrated] = useState(hasHydratedOnce);

  useEffect(() => {
    if (!hasHydratedOnce) {
      hasHydratedOnce = true;
    }
    setHydrated(true);
  }, []);

  return hydrated;
}
