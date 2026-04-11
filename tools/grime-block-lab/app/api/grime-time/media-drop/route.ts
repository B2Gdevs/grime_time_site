import { NextResponse } from "next/server";
const DEFAULT_GRIME_TIME_APP_ORIGIN = "http://127.0.0.1:3000";

function validateLocalOrigin(origin: string): null | string {
  try {
    const parsed = new URL(origin);
    const allowedHosts = new Set(["127.0.0.1", "localhost"]);
    if (!allowedHosts.has(parsed.hostname)) {
      return null;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    const safePort = parsed.port ? `:${parseInt(parsed.port, 10)}` : "";
    return `${parsed.protocol}//${parsed.hostname}${safePort}`;
  } catch {
    return null;
  }
}

function buildOriginError() {
  return NextResponse.json(
    {
      error:
        "GRIME_TIME_APP_ORIGIN must point at a localhost Grime Time app origin.",
    },
    { status: 400 },
  );
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        error:
          "The Grime Time live media proxy is only available in development mode.",
      },
      { status: 403 },
    );
  }

  const validatedOrigin = validateLocalOrigin(
    process.env.GRIME_TIME_APP_ORIGIN ?? DEFAULT_GRIME_TIME_APP_ORIGIN,
  );

  if (!validatedOrigin) {
    return buildOriginError();
  }

  try {
    const response = await fetch(`${validatedOrigin}/api/internal/block-lab/media`, {
      cache: "no-store",
    });
    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            payload?.error ||
            "The Grime Time app did not return a live media library.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to reach the Grime Time app.",
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        error:
          "The Grime Time live media proxy is only available in development mode.",
      },
      { status: 403 },
    );
  }

  const validatedOrigin = validateLocalOrigin(
    process.env.GRIME_TIME_APP_ORIGIN ?? DEFAULT_GRIME_TIME_APP_ORIGIN,
  );

  if (!validatedOrigin) {
    return buildOriginError();
  }

  try {
    const response = await fetch(`${validatedOrigin}/api/internal/block-lab/media`, {
      body: await request.formData(),
      cache: "no-store",
      method: "POST",
    });
    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: payload?.error || "The Grime Time app rejected the media upload.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to reach the Grime Time app.",
      },
      { status: 502 },
    );
  }
}
