import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { requestCheckout, setOpenInAppUrl } from "./checkout";

describe("checkout helpers", () => {
  it("uses host requestCheckout when available", async () => {
    let hostCalled = false;
    const originalWindow = (globalThis as { window?: unknown }).window;

    try {
      (globalThis as { window: unknown }).window = {
        openai: {
          requestCheckout: async (request: Record<string, unknown>) => {
            hostCalled = true;
            return { status: "completed", request };
          },
        },
      };

      const result = await requestCheckout({ id: "checkout_123" });
      assert.equal(result.mode, "host");
      assert.equal(hostCalled, true);
    } finally {
      if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        (globalThis as { window: unknown }).window = originalWindow;
      }
    }
  });

  it("runs fallback when requestCheckout is unavailable", async () => {
    let fallbackCalled = false;
    const originalWindow = (globalThis as { window?: unknown }).window;

    try {
      (globalThis as { window: unknown }).window = { openai: {} };

      const result = await requestCheckout({ id: "checkout_123" }, () => {
        fallbackCalled = true;
        return { openedExternally: true };
      });

      assert.equal(result.mode, "fallback");
      assert.equal(fallbackCalled, true);
      assert.deepEqual(result.result, { openedExternally: true });
    } finally {
      if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        (globalThis as { window: unknown }).window = originalWindow;
      }
    }
  });

  it("sets open-in-app URL when host API is available", () => {
    let href: string | null = null;
    const originalWindow = (globalThis as { window?: unknown }).window;

    try {
      (globalThis as { window: unknown }).window = {
        openai: {
          setOpenInAppUrl: (args: { href: string }) => {
            href = args.href;
          },
        },
      };

      const result = setOpenInAppUrl("https://example.com/app");
      assert.equal(result, true);
      assert.equal(href, "https://example.com/app");
    } finally {
      if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        (globalThis as { window: unknown }).window = originalWindow;
      }
    }
  });

  it("returns false when open-in-app API is unavailable", () => {
    const originalWindow = (globalThis as { window?: unknown }).window;

    try {
      (globalThis as { window: unknown }).window = { openai: {} };
      assert.equal(setOpenInAppUrl("https://example.com/app"), false);
    } finally {
      if (originalWindow === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        (globalThis as { window: unknown }).window = originalWindow;
      }
    }
  });
});
