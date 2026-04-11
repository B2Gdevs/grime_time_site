"use client";

export interface CheckoutRequest {
  [key: string]: unknown;
}

export interface CheckoutOutcome {
  mode: "host" | "fallback";
  result?: unknown;
}

type OpenAICheckoutAPI = {
  requestCheckout?: (request: CheckoutRequest) => Promise<unknown>;
  setOpenInAppUrl?: (args: { href: string }) => void;
};

function getCheckoutApi(): OpenAICheckoutAPI | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { openai?: OpenAICheckoutAPI }).openai;
}

/**
 * Register an "Open in App" URL in ChatGPT when the extension is available.
 * Returns `true` when the host API is present and invoked.
 */
export function setOpenInAppUrl(href: string): boolean {
  const openai = getCheckoutApi();
  if (!openai || typeof openai.setOpenInAppUrl !== "function") {
    return false;
  }

  openai.setOpenInAppUrl({ href });
  return true;
}

/**
 * Request ChatGPT Instant Checkout when available.
 *
 * Note: `requestCheckout` is currently a ChatGPT private beta extension.
 * Always provide a fallback path for non-ChatGPT hosts or unavailable beta.
 */
export async function requestCheckout(
  request: CheckoutRequest,
  fallback?: (request: CheckoutRequest) => unknown | Promise<unknown>,
): Promise<CheckoutOutcome> {
  const openai = getCheckoutApi();
  if (openai && typeof openai.requestCheckout === "function") {
    const result = await openai.requestCheckout(request);
    return { mode: "host", result };
  }

  if (fallback) {
    const result = await fallback(request);
    return { mode: "fallback", result };
  }

  return { mode: "fallback" };
}
