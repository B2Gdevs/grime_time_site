import { type NextRequest, NextResponse } from "next/server";
import { componentConfigs } from "@/lib/workbench/component-configs";
import { scanThemeDiagnosticsForComponent } from "@/lib/workbench/theme/diagnostics";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Theme diagnostics are only available in development." },
      { status: 403 },
    );
  }

  const componentId = request.nextUrl.searchParams.get("id");
  if (!componentId) {
    return NextResponse.json(
      { error: "Missing component id parameter" },
      { status: 400 },
    );
  }

  if (!componentConfigs.some((c) => c.id === componentId)) {
    return NextResponse.json(
      { error: `Unknown component: ${componentId}` },
      { status: 404 },
    );
  }

  const files = await scanThemeDiagnosticsForComponent(
    componentId,
    process.cwd(),
  );
  const count = files.reduce((acc, file) => acc + file.diagnostics.length, 0);

  return NextResponse.json({
    componentId,
    count,
    files,
    tips: [
      "Prefer semantic tokens/classes: background/foreground/border.",
      "Avoid hardcoded white/black/absolute #fff/#000 colors.",
      "Apply one theme boundary at app root and let descendants inherit.",
    ],
  });
}
